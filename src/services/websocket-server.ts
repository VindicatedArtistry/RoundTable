import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
// Redis adapter removed - using default in-memory adapter
// TODO: Consider re-adding Redis for production scalability
// import { createAdapter } from '@socket.io/redis-adapter';
// import { createClient } from 'redis';
import * as jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, LoggerInterface } from '../utils/logger';
import { validateInputBasic } from '../utils/security';
import { sanitize } from '../utils/sanitizer';

interface AuthenticatedSocket extends Socket {
	userId: string;
	role: string;
	isActive: boolean;
}

interface MessagePayload {
	id: string;
	type: 'text' | 'file' | 'system' | 'notification';
	content: string;
	senderId: string;
	senderName: string;
	timestamp: Date;
	roomId?: string;
	metadata?: Record<string, any>;
}

interface RoomData {
	id: string;
	name: string;
	type: 'council_meeting' | 'direct_channel' | 'broadcast';
	participants: Set<string>;
	isActive: boolean;
	createdAt: Date;
	metadata?: Record<string, any>;
}

interface QueuedMessage {
	id: string;
	socketId: string;
	payload: MessagePayload;
	attempts: number;
	timestamp: Date;
	expiresAt: Date;
}

interface ConnectionMetrics {
	latency: number;
	lastPing: Date;
	messagesSent: number;
	messagesReceived: number;
	reconnectCount: number;
}

class WebSocketServer {
	private io!: SocketIOServer; // Definite assignment assertion - initialized in initializeSocketIO
	private redisClient: any;
	private rooms: Map<string, RoomData> = new Map();
	private messageQueue: Map<string, QueuedMessage[]> = new Map();
	private connectionMetrics: Map<string, ConnectionMetrics> = new Map();
	private rateLimiter: any;
	private logger: LoggerInterface;
	private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();

	// Starlink optimization settings
	private readonly STARLINK_PING_INTERVAL = 15000; // 15 seconds
	private readonly STARLINK_TIMEOUT = 30000; // 30 seconds
	private readonly MAX_RETRY_ATTEMPTS = 5;
	private readonly MESSAGE_TTL = 300000; // 5 minutes
	private readonly ADAPTIVE_COMPRESSION_THRESHOLD = 1024; // 1KB

	constructor(httpServer: HTTPServer) {
		this.logger = createLogger('WebSocketServer');
		this.initializeRateLimiter();
		this.initializeSocketIO(httpServer);
		this.setupStarlinkOptimizations();
		
		// Initialize Redis asynchronously - properly handled
		this.initializeRedis().catch(error => {
			this.logger.error('Failed to initialize Redis', { error });
		});
	}

	/**
	 * Initialize the WebSocket server asynchronously
	 * Call this method after construction to ensure all async setup is complete
	 */
	public async initialize(): Promise<void> {
		try {
			await this.initializeRedis();
			this.logger.info('WebSocket server fully initialized');
		} catch (error) {
			this.logger.error('Failed to initialize WebSocket server', { error });
			throw error;
		}
	}

	/**
	 * Initialize rate limiting for WebSocket connections
	 */
	private initializeRateLimiter(): void {
		this.rateLimiter = rateLimit({
			windowMs: 60 * 1000, // 1 minute
			max: 100, // limit each IP to 100 requests per windowMs
			message: 'Too many requests from this IP',
			standardHeaders: true,
			legacyHeaders: false,
		});
	}

	/**
	 * Initialize Redis client for horizontal scaling
	 */
	private async initializeRedis(): Promise<void> {
		try {
			const redisConfig: any = {
				socket: {
					host: process.env.REDIS_HOST || 'localhost',
					port: parseInt(process.env.REDIS_PORT || '6379'),
				},
			};

			// Only add password if it exists to satisfy exactOptionalPropertyTypes
			if (process.env.REDIS_PASSWORD) {
				redisConfig.password = process.env.REDIS_PASSWORD;
			}

			// Redis client disabled - using in-memory adapter for now
			// TODO: Re-enable when @socket.io/redis-adapter is configured
			// this.redisClient = createClient(redisConfig);
			// await this.redisClient.connect();
			this.redisClient = null;
			this.logger.info('Using in-memory adapter (Redis disabled)');
		} catch (error) {
			this.logger.error('Failed to connect to Redis', { error });
			throw new Error('Redis connection failed');
		}
	}

	/**
	 * Initialize Socket.IO server with authentication and middleware
	 */
	private initializeSocketIO(httpServer: HTTPServer): void {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
				methods: ['GET', 'POST'],
				credentials: true,
			},
			transports: ['websocket', 'polling'],
			pingTimeout: this.STARLINK_TIMEOUT,
			pingInterval: this.STARLINK_PING_INTERVAL,
		});

		// Redis adapter for horizontal scaling (disabled - using in-memory)
		// TODO: Re-enable when @socket.io/redis-adapter is configured
		// this.io.adapter(createAdapter(this.redisClient, this.redisClient.duplicate()));

		// Authentication middleware
		this.io.use(this.authenticateSocket.bind(this));

		// Rate limiting middleware
		this.io.use(this.rateLimitMiddleware.bind(this));

		this.setupEventHandlers();
	}

	/**
	 * Authenticate socket connections using JWT
	 */
	private async authenticateSocket(socket: any, next: Function): Promise<void> {
		try {
			const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

			if (!token) {
				return next(new Error('Authentication token required'));
			}

			const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

			if (!decoded.userId || !decoded.role) {
				return next(new Error('Invalid token payload'));
			}

			socket.userId = decoded.userId;
			socket.role = decoded.role;
			socket.isActive = true;

			this.logger.info(`Socket authenticated: ${socket.userId} (${socket.role})`);
			next();
		} catch (error) {
			this.logger.error('Socket authentication failed', { error });
			next(new Error('Authentication failed'));
		}
	}

	/**
	 * Rate limiting middleware for WebSocket connections
	 */
	private async rateLimitMiddleware(socket: any, next: Function): Promise<void> {
		const clientIP = socket.handshake.address;
		const key = `rate_limit:${clientIP}`;

		try {
			const current = await this.redisClient.incr(key);
			if (current === 1) {
				await this.redisClient.expire(key, 60); // 1 minute window
			}

			if (current > 100) { // 100 connections per minute per IP
				return next(new Error('Rate limit exceeded'));
			}

			next();
		} catch (error) {
			this.logger.error('Rate limiting error', { error });
			next();
		}
	}

	/**
	 * Setup event handlers for socket connections
	 */
	private setupEventHandlers(): void {
		this.io.on('connection', (socket: Socket) => {
			const authSocket = socket as AuthenticatedSocket;
			this.handleConnection(authSocket);

			authSocket.on('join_room', (data) => this.handleJoinRoom(authSocket, data));
			authSocket.on('leave_room', (data) => this.handleLeaveRoom(authSocket, data));
			authSocket.on('send_message', (data) => this.handleSendMessage(authSocket, data));
			authSocket.on('direct_message', (data) => this.handleDirectMessage(authSocket, data));
			authSocket.on('broadcast_notification', (data) => this.handleBroadcastNotification(authSocket, data));
			authSocket.on('ping_latency', (data) => this.handlePingLatency(authSocket, data));
			authSocket.on('disconnect', () => this.handleDisconnection(authSocket));
			authSocket.on('error', (error) => this.handleSocketError(authSocket, error));
		});
	}

	/**
	 * Handle new socket connection with Starlink optimizations
	 */
	private handleConnection(socket: AuthenticatedSocket): void {
		this.logger.info(`User ${socket.userId} connected with socket ${socket.id}`);

		// Initialize connection metrics
		this.connectionMetrics.set(socket.id, {
			latency: 0,
			lastPing: new Date(),
			messagesSent: 0,
			messagesReceived: 0,
			reconnectCount: 0,
		});

		// Process any queued messages
		this.processQueuedMessages(socket.id);

		// Start latency monitoring for Starlink optimization
		this.startLatencyMonitoring(socket);

		// Send connection acknowledgment
		socket.emit('connection_established', {
			socketId: socket.id,
			timestamp: new Date(),
			features: ['message_queuing', 'latency_optimization', 'auto_reconnect'],
		});
	}

	/**
	 * Handle user joining a room (council meeting or direct channel)
	 */
	private async handleJoinRoom(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			// Validate input data
			if (!validateInputBasic(data?.roomId, { maxLength: 50, required: true }) ||
				!validateInputBasic(data?.roomType, { allowedTypes: ['string'], required: true })) {
				socket.emit('error', { message: 'Invalid room data provided' });
				return;
			}

			const { roomId, roomType } = data;

			// Validate room type
			if (!['council_meeting', 'direct_channel'].includes(roomType)) {
				socket.emit('error', { message: 'Invalid room type' });
				return;
			}

			// Check authorization for room type
			if (roomType === 'council_meeting' && !['council_member', 'admin'].includes(socket.role)) {
				socket.emit('error', { message: 'Insufficient permissions for council meetings' });
				return;
			}

			await socket.join(roomId);

			// Update room data
			let room = this.rooms.get(roomId);
			if (!room) {
				room = {
					id: roomId,
					name: `${roomType}_${roomId}`,
					type: roomType as 'council_meeting' | 'direct_channel',
					participants: new Set(),
					isActive: true,
					createdAt: new Date(),
				};
				this.rooms.set(roomId, room);
			}

			room.participants.add(socket.userId);

			// Notify other participants
			socket.to(roomId).emit('user_joined', {
				userId: socket.userId,
				roomId,
				timestamp: new Date(),
			});

			socket.emit('room_joined', {
				roomId,
				participantCount: room.participants.size,
				timestamp: new Date(),
			});

			this.logger.info(`User ${socket.userId} joined room ${roomId}`);
		} catch (error) {
			this.logger.error('Error joining room', { error });
			socket.emit('error', { message: 'Failed to join room' });
		}
	}

	/**
	 * Handle user leaving a room
	 */
	private async handleLeaveRoom(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			if (!validateInputBasic(data?.roomId, { maxLength: 50, required: true, allowedTypes: ['string'] })) {
				socket.emit('error', { message: 'Invalid room ID provided' });
				return;
			}

			const { roomId } = data;

			await socket.leave(roomId);

			const room = this.rooms.get(roomId);
			if (room) {
				room.participants.delete(socket.userId);

				if (room.participants.size === 0) {
					room.isActive = false;
				}

				socket.to(roomId).emit('user_left', {
					userId: socket.userId,
					roomId,
					timestamp: new Date(),
				});
			}

			socket.emit('room_left', { roomId, timestamp: new Date() });
			this.logger.info(`User ${socket.userId} left room ${roomId}`);
		} catch (error) {
			this.logger.error('Error leaving room', { error });
			socket.emit('error', { message: 'Failed to leave room' });
		}
	}

	/**
	 * Handle sending messages in rooms with message queuing
	 */
	private async handleSendMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			// Validate input data
			if (!validateInputBasic(data?.roomId, { maxLength: 50, required: true, allowedTypes: ['string'] }) ||
				!validateInputBasic(data?.content, { maxLength: 10000, required: true, allowedTypes: ['string'] })) {
				socket.emit('error', { message: 'Invalid message data provided' });
				return;
			}

			const { roomId, content, type = 'text', metadata } = data;

			// Validate message type
			if (type && !['text', 'file'].includes(type)) {
				socket.emit('error', { message: 'Invalid message type' });
				return;
			}

			const sanitizedContent = sanitize(content);

			const message: MessagePayload = {
				id: uuidv4(),
				type,
				content: sanitizedContent,
				senderId: socket.userId,
				senderName: metadata?.senderName || 'Unknown',
				timestamp: new Date(),
				roomId,
				metadata,
			};

			// Update metrics
			const metrics = this.connectionMetrics.get(socket.id);
			if (metrics) {
				metrics.messagesSent++;
			}

			// Emit to room with message queuing fallback
			const success = await this.emitToRoomWithQueue(roomId, 'message_received', message);

			if (success) {
				socket.emit('message_sent', { messageId: message.id, timestamp: new Date() });
			} else {
				socket.emit('message_queued', { messageId: message.id, timestamp: new Date() });
			}

			this.logger.info(`Message sent from ${socket.userId} to room ${roomId}`);
		} catch (error) {
			this.logger.error('Error sending message', { error });
			socket.emit('error', { message: 'Failed to send message' });
		}
	}

	/**
	 * Handle direct messages between users
	 */
	private async handleDirectMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			// Validate input data
			if (!validateInputBasic(data?.recipientId, { maxLength: 50, required: true, allowedTypes: ['string'] }) ||
				!validateInputBasic(data?.content, { maxLength: 10000, required: true, allowedTypes: ['string'] })) {
				socket.emit('error', { message: 'Invalid direct message data provided' });
				return;
			}

			const { recipientId, content, type = 'text' } = data;

			// Validate message type
			if (type && !['text', 'file'].includes(type)) {
				socket.emit('error', { message: 'Invalid message type' });
				return;
			}

			const sanitizedContent = sanitize(content);

			const message: MessagePayload = {
				id: uuidv4(),
				type,
				content: sanitizedContent,
				senderId: socket.userId,
				senderName: 'Direct Message',
				timestamp: new Date(),
			};

			// Find recipient socket
			const recipientSocket = await this.findUserSocket(recipientId);

			if (recipientSocket) {
				recipientSocket.emit('direct_message_received', message);
				socket.emit('direct_message_sent', { messageId: message.id, timestamp: new Date() });
			} else {
				// Queue message for offline user
				this.queueMessageForUser(recipientId, message);
				socket.emit('direct_message_queued', { messageId: message.id, timestamp: new Date() });
			}

			this.logger.info(`Direct message sent from ${socket.userId} to ${recipientId}`);
		} catch (error) {
			this.logger.error('Error sending direct message', { error });
			socket.emit('error', { message: 'Failed to send direct message' });
		}
	}

	/**
	 * Handle broadcast notifications (admin only)
	 */
	private async handleBroadcastNotification(socket: AuthenticatedSocket, data: any): Promise<void> {
		try {
			if (socket.role !== 'admin') {
				socket.emit('error', { message: 'Insufficient permissions for broadcast' });
				return;
			}

			// Validate input data
			if (!validateInputBasic(data?.content, { maxLength: 1000, required: true, allowedTypes: ['string'] })) {
				socket.emit('error', { message: 'Invalid broadcast content provided' });
				return;
			}

			const { content, priority = 'normal' } = data;

			// Validate priority
			if (priority && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
				socket.emit('error', { message: 'Invalid priority level' });
				return;
			}

			const notification: MessagePayload = {
				id: uuidv4(),
				type: 'notification',
				content: sanitize(content),
				senderId: socket.userId,
				senderName: 'System Administrator',
				timestamp: new Date(),
				metadata: { priority },
			};

			this.io.emit('broadcast_notification', notification);
			socket.emit('broadcast_sent', { notificationId: notification.id, timestamp: new Date() });

			this.logger.info(`Broadcast notification sent by ${socket.userId}`);
		} catch (error) {
			this.logger.error('Error sending broadcast', { error });
			socket.emit('error', { message: 'Failed to send broadcast' });
		}
	}

	/**
	 * Handle latency ping for Starlink optimization
	 */
	private handlePingLatency(socket: AuthenticatedSocket, data: any): void {
		const metrics = this.connectionMetrics.get(socket.id);
		if (metrics && data.timestamp) {
			metrics.latency = Date.now() - data.timestamp;
			metrics.lastPing = new Date();

			// Adjust compression based on latency
			this.adjustCompressionSettings(socket, metrics.latency);
		}

		socket.emit('pong_latency', { timestamp: Date.now() });
	}

	/**
	 * Handle socket disconnection with reconnection preparation
	 */
	private handleDisconnection(socket: AuthenticatedSocket): void {
		this.logger.info(`User ${socket.userId} disconnected (${socket.id})`);

		// Remove from all rooms
		for (const [roomId, room] of this.rooms) {
			if (room.participants.has(socket.userId)) {
				room.participants.delete(socket.userId);
				socket.to(roomId).emit('user_disconnected', {
					userId: socket.userId,
					roomId,
					timestamp: new Date(),
				});
			}
		}

		// Clean up metrics but keep for potential reconnection
		const metrics = this.connectionMetrics.get(socket.id);
		if (metrics) {
			metrics.reconnectCount++;
			// Keep metrics for 5 minutes for reconnection
			setTimeout(() => {
				this.connectionMetrics.delete(socket.id);
			}, 300000);
		}

		// Set up reconnection interval for Starlink optimization
		this.setupReconnectionInterval(socket);
	}

	/**
	 * Handle socket errors
	 */
	private handleSocketError(socket: AuthenticatedSocket, error: Error): void {
		this.logger.error(`Socket error for user ${socket.userId}`, { error: { message: error.message, name: error.name, stack: error.stack } });

		// Attempt recovery for certain error types
		if (error.message.includes('timeout') || error.message.includes('connection')) {
			this.attemptSocketRecovery(socket);
		}
	}

	/**
	 * Setup Starlink-specific optimizations
	 */
	private setupStarlinkOptimizations(): void {
		// Adaptive ping interval based on connection quality
		setInterval(() => {
			this.adjustPingIntervals();
		}, 30000); // Check every 30 seconds

		// Message queue cleanup
		setInterval(() => {
			this.cleanupExpiredMessages();
		}, 60000); // Cleanup every minute

		// Connection health monitoring
		setInterval(() => {
			this.monitorConnectionHealth();
		}, 15000); // Monitor every 15 seconds
	}

	/**
	 * Start latency monitoring for a socket
	 */
	private startLatencyMonitoring(socket: AuthenticatedSocket): void {
		const interval = setInterval(() => {
			if (!socket.connected) {
				clearInterval(interval);
				return;
			}

			socket.emit('ping_latency', { timestamp: Date.now() });
		}, this.STARLINK_PING_INTERVAL);
	}

	/**
	 * Adjust compression settings based on latency
	 */
	private adjustCompressionSettings(socket: any, latency: number): void {
		let threshold = this.ADAPTIVE_COMPRESSION_THRESHOLD;

		if (latency > 1000) { // High latency (>1s) - aggressive compression
			threshold = 256;
		} else if (latency > 500) { // Medium latency - moderate compression
			threshold = 512;
		} else if (latency < 100) { // Low latency - minimal compression
			threshold = 2048;
		}

		// Note: Socket.IO doesn't allow dynamic compression changes per socket
		// This would need to be implemented at the message level
	}

	/**
	 * Emit message to room with queuing fallback
	 */
	private async emitToRoomWithQueue(roomId: string, event: string, data: any): Promise<boolean> {
		try {
			const room = this.io.sockets.adapter.rooms.get(roomId);
			if (!room || room.size === 0) {
				// Queue for all room participants
				const roomData = this.rooms.get(roomId);
				if (roomData) {
					for (const userId of roomData.participants) {
						this.queueMessageForUser(userId, data);
					}
				}
				return false;
			}

			this.io.to(roomId).emit(event, data);
			return true;
		} catch (error) {
			this.logger.error('Error emitting to room', { error });
			return false;
		}
	}

	/**
	 * Queue message for offline user
	 */
	private queueMessageForUser(userId: string, message: MessagePayload): void {
		const queuedMessage: QueuedMessage = {
			id: uuidv4(),
			socketId: userId,
			payload: message,
			attempts: 0,
			timestamp: new Date(),
			expiresAt: new Date(Date.now() + this.MESSAGE_TTL),
		};

		if (!this.messageQueue.has(userId)) {
			this.messageQueue.set(userId, []);
		}

		const userQueue = this.messageQueue.get(userId)!;
		userQueue.push(queuedMessage);

		// Limit queue size to prevent memory issues
		if (userQueue.length > 100) {
			userQueue.shift(); // Remove oldest message
		}
	}

	/**
	 * Process queued messages for a reconnected user
	 */
	private processQueuedMessages(socketId: string): void {
		const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
		if (!socket) return;

		const userQueue = this.messageQueue.get(socket.userId);
		if (!userQueue || userQueue.length === 0) return;

		const validMessages = userQueue.filter(msg => msg.expiresAt > new Date());

		validMessages.forEach(queuedMessage => {
			if (queuedMessage.payload.roomId) {
				socket.emit('message_received', queuedMessage.payload);
			} else {
				socket.emit('direct_message_received', queuedMessage.payload);
			}
		});

		// Clear processed messages
		this.messageQueue.set(socket.userId, []);

		if (validMessages.length > 0) {
			socket.emit('queued_messages_delivered', {
				count: validMessages.length,
				timestamp: new Date(),
			});
		}
	}

	/**
	 * Find socket for a specific user
	 */
	private async findUserSocket(userId: string): Promise<AuthenticatedSocket | null> {
		for (const [socketId, socket] of this.io.sockets.sockets) {
			const authSocket = socket as AuthenticatedSocket;
			if (authSocket.userId === userId && authSocket.connected) {
				return authSocket;
			}
		}
		return null;
	}

	/**
	 * Setup reconnection interval for Starlink optimization
	 */
	private setupReconnectionInterval(socket: AuthenticatedSocket): void {
		const interval = setInterval(() => {
			// Clean up after 5 minutes if no reconnection
			clearInterval(interval);
			this.reconnectIntervals.delete(socket.userId);
		}, 300000);

		this.reconnectIntervals.set(socket.userId, interval);
	}

	/**
	 * Attempt socket recovery for connection issues
	 */
	private attemptSocketRecovery(socket: AuthenticatedSocket): void {
		setTimeout(() => {
			if (!socket.connected) {
				socket.emit('reconnect_suggested', {
					reason: 'Connection recovery needed',
					timestamp: new Date(),
				});
			}
		}, 5000);
	}

	/**
	 * Adjust ping intervals based on overall connection quality
	 */
	private adjustPingIntervals(): void {
		const avgLatency = this.calculateAverageLatency();

		// Log the latency adjustment for monitoring
		this.logger.debug(`Adjusting ping intervals for average latency: ${avgLatency}ms`);

		// Socket.io v4+ doesn't allow direct manipulation of ping intervals at runtime
		// This is handled during server initialization via configuration
		// We'll log the adjustment for monitoring purposes
		if (avgLatency > 2000) {
			this.logger.info('High latency detected - consider adjusting server configuration');
		} else if (avgLatency > 1000) {
			this.logger.info('Moderate latency detected - monitoring connection quality');
		}
	}

	/**
	 * Calculate average latency across all connections
	 */
	private calculateAverageLatency(): number {
		const metrics = Array.from(this.connectionMetrics.values());
		if (metrics.length === 0) return 0;

		const totalLatency = metrics.reduce((sum, metric) => sum + metric.latency, 0);
		return totalLatency / metrics.length;
	}

	/**
	 * Clean up expired messages from queue
	 */
	private cleanupExpiredMessages(): void {
		const now = new Date();

		for (const [userId, messages] of this.messageQueue) {
			const validMessages = messages.filter(msg => msg.expiresAt > now);

			if (validMessages.length !== messages.length) {
				this.messageQueue.set(userId, validMessages);
			}

			if (validMessages.length === 0) {
				this.messageQueue.delete(userId);
			}
		}
	}

	/**
	 * Monitor connection health and handle poor connections
	 */
	private monitorConnectionHealth(): void {
		const now = new Date();
		const staleThreshold = 60000; // 1 minute

		for (const [socketId, metrics] of this.connectionMetrics) {
			const timeSinceLastPing = now.getTime() - metrics.lastPing.getTime();

			if (timeSinceLastPing > staleThreshold) {
				const socket = this.io.sockets.sockets.get(socketId);
				if (socket && socket.connected) {
					socket.emit('connection_health_check', { timestamp: now });
				}
			}
		}
	}

	/**
	 * Get server statistics
	 */
	public getServerStats(): any {
		return {
			connectedClients: this.io.engine.clientsCount,
			activeRooms: Array.from(this.rooms.values()).filter(room => room.isActive).length,
			queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
			averageLatency: this.calculateAverageLatency(),
			uptime: process.uptime(),
		};
	}

	/**
	 * Graceful shutdown
	 */
	public async shutdown(): Promise<void> {
		this.logger.info('Shutting down WebSocket server...');

		// Clear all intervals
		for (const interval of this.reconnectIntervals.values()) {
			clearInterval(interval);
		}

		// Close all connections
		this.io.disconnectSockets();

		// Close Redis connection
		if (this.redisClient) {
			await this.redisClient.quit();
		}

		this.logger.info('WebSocket server shutdown complete');
	}
}

export default WebSocketServer;

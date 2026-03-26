'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	AlertTriangle,
	MessageCircle,
	Eye,
	Wifi,
	WifiOff,
	Bell,
	Users
} from 'lucide-react';

// Type definitions for AR overlay data structures
interface CouncilMember {
	id: string;
	name: string;
	avatar?: string;
	role: string;
	isOnline: boolean;
	lastSeen: Date;
}

interface NotificationIcon {
	id: string;
	memberId: string;
	type: 'message' | 'alert' | 'status' | 'emergency';
	content: string;
	timestamp: Date;
	position: {
		x: number;
		y: number;
		z: number;
	};
	priority: 'low' | 'medium' | 'high' | 'critical';
	isRead: boolean;
}

interface TextOverlay {
	id: string;
	content: string;
	position: {
		x: number;
		y: number;
	};
	duration: number;
	type: 'command' | 'response' | 'instruction';
	fontSize: 'sm' | 'md' | 'lg' | 'xl';
}

interface EmergencyAlert {
	id: string;
	title: string;
	message: string;
	severity: 'warning' | 'danger' | 'critical';
	timestamp: Date;
	acknowledged: boolean;
	source: string;
}

interface WebSocketMessage {
	type: 'notification' | 'text_overlay' | 'emergency' | 'member_update' | 'heartbeat';
	payload: any;
	timestamp: string;
}

interface AROverlayProps {
	unityInstanceRef?: React.RefObject<any>;
	memberList: CouncilMember[];
	onNotificationClick?: (notification: NotificationIcon) => void;
	onEmergencyAcknowledge?: (alertId: string) => void;
	websocketUrl: string;
	isXrealConnected: boolean;
	className?: string;
}

// WebSocket connection status enum
enum ConnectionStatus {
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected',
	ERROR = 'error',
	RECONNECTING = 'reconnecting'
}

const AROverlay: React.FC<AROverlayProps> = ({
	unityInstanceRef,
	memberList,
	onNotificationClick,
	onEmergencyAcknowledge,
	websocketUrl,
	isXrealConnected,
	className
}) => {
	// State management for AR overlay components
	const [notifications, setNotifications] = useState<NotificationIcon[]>([]);
	const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
	const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
	const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	// Refs for WebSocket and timers
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const overlayContainerRef = useRef<HTMLDivElement>(null);

	// Constants for configuration
	const MAX_RETRY_ATTEMPTS = 5;
	const RETRY_DELAY_BASE = 1000;
	const HEARTBEAT_INTERVAL = 30000;
	const TEXT_OVERLAY_AUTO_DISMISS = 5000;

	// Refs to hold callback functions for breaking circular dependencies
	const handleWebSocketMessageRef = useRef<((message: WebSocketMessage) => void) | undefined>(undefined);
	const handleReconnectionRef = useRef<(() => void) | undefined>(undefined);

	// WebSocket connection management
	const connectWebSocket = useCallback((): void => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return;
		}

		setConnectionStatus(ConnectionStatus.CONNECTING);

		try {
			const ws = new WebSocket(websocketUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				setConnectionStatus(ConnectionStatus.CONNECTED);
				setRetryCount(0);
				setLastHeartbeat(new Date());

				// Send initial handshake
				ws.send(JSON.stringify({
					type: 'handshake',
					payload: {
						deviceType: 'xreal_glasses',
						timestamp: new Date().toISOString()
					}
				}));
			};

			ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					handleWebSocketMessageRef.current?.(message);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};

			ws.onclose = () => {
				setConnectionStatus(ConnectionStatus.DISCONNECTED);
				handleReconnectionRef.current?.();
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				setConnectionStatus(ConnectionStatus.ERROR);
			};

		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			setConnectionStatus(ConnectionStatus.ERROR);
			handleReconnectionRef.current?.();
		}
	}, [websocketUrl]);

	// Handle incoming WebSocket messages
	const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
		switch (message.type) {
			case 'notification':
				setNotifications(prev => [...prev, message.payload as NotificationIcon]);
				break;

			case 'text_overlay':
				const textOverlay = message.payload as TextOverlay;
				setTextOverlays(prev => [...prev, textOverlay]);

				// Auto-dismiss text overlay after specified duration
				setTimeout(() => {
					setTextOverlays(prev => prev.filter(overlay => overlay.id !== textOverlay.id));
				}, textOverlay.duration || TEXT_OVERLAY_AUTO_DISMISS);
				break;

			case 'emergency':
				const emergencyAlert = message.payload as EmergencyAlert;
				setEmergencyAlerts(prev => [...prev, emergencyAlert]);

				// Send emergency alert to Unity if available
				if (unityInstanceRef?.current) {
					unityInstanceRef.current.SendMessage(
						'ARManager',
						'OnEmergencyAlert',
						JSON.stringify(emergencyAlert)
					);
				}
				break;

			case 'member_update':
				// Handle member status updates
				break;

			case 'heartbeat':
				setLastHeartbeat(new Date());
				break;

			default:
				console.warn('Unknown message type:', message.type);
		}
	}, [unityInstanceRef]);

	// Handle WebSocket reconnection with exponential backoff
	const handleReconnection = useCallback((): void => {
		if (retryCount >= MAX_RETRY_ATTEMPTS) {
			setConnectionStatus(ConnectionStatus.ERROR);
			return;
		}

		setConnectionStatus(ConnectionStatus.RECONNECTING);
		const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);

		reconnectTimeoutRef.current = setTimeout(() => {
			setRetryCount(prev => prev + 1);
			connectWebSocket();
		}, delay);
	}, [retryCount, connectWebSocket]);

	// Update refs when callbacks change
	handleWebSocketMessageRef.current = handleWebSocketMessage;
	handleReconnectionRef.current = handleReconnection;

	// Initialize WebSocket connection
	useEffect(() => {
		connectWebSocket();

		const reconnectTimer = reconnectTimeoutRef.current;
		const heartbeatTimer = heartbeatTimeoutRef.current;
		const ws = wsRef.current;

		return () => {
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
			}
			if (heartbeatTimer) {
				clearTimeout(heartbeatTimer);
			}
			if (ws) {
				ws.close();
			}
		};
	}, [connectWebSocket]);

	// Handle notification click events
	const handleNotificationClick = useCallback((notification: NotificationIcon) => {
		// Mark notification as read
		setNotifications(prev =>
			prev.map(n =>
				n.id === notification.id
					? { ...n, isRead: true }
					: n
			)
		);

		// Send interaction to Unity
		if (unityInstanceRef?.current) {
			unityInstanceRef.current.SendMessage(
				'NotificationManager',
				'OnNotificationInteraction',
				JSON.stringify(notification)
			);
		}

		onNotificationClick?.(notification);
	}, [onNotificationClick, unityInstanceRef]);

	// Handle emergency alert acknowledgment
	const handleEmergencyAcknowledge = useCallback((alertId: string) => {
		setEmergencyAlerts(prev =>
			prev.map(alert =>
				alert.id === alertId
					? { ...alert, acknowledged: true }
					: alert
			)
		);

		// Send acknowledgment via WebSocket
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({
				type: 'emergency_ack',
				payload: { alertId, timestamp: new Date().toISOString() }
			}));
		}

		onEmergencyAcknowledge?.(alertId);
	}, [onEmergencyAcknowledge]);

	// Get member visual identifier based on role and status
	const getMemberIdentifier = useCallback((member: CouncilMember) => {
		const colors = {
			admin: 'bg-red-500',
			moderator: 'bg-blue-500',
			member: 'bg-green-500',
			guest: 'bg-gray-500'
		};

		return colors[member.role as keyof typeof colors] || colors.guest;
	}, []);

	// Get notification icon based on type and priority
	const getNotificationIcon = useCallback((notification: NotificationIcon) => {
		const iconMap = {
			message: MessageCircle,
			alert: Bell,
			status: Users,
			emergency: AlertTriangle
		};

		return iconMap[notification.type] || MessageCircle;
	}, []);

	// Memoized unread notifications count
	const unreadCount = useMemo(() =>
		notifications.filter(n => !n.isRead).length,
		[notifications]
	);

	// Memoized active emergency alerts
	const activeEmergencyAlerts = useMemo(() =>
		emergencyAlerts.filter(alert => !alert.acknowledged),
		[emergencyAlerts]
	);

	return (
		<div
			ref={overlayContainerRef}
			className={cn(
				'fixed inset-0 pointer-events-none z-50',
				'flex flex-col',
				!isXrealConnected && 'opacity-50',
				className
			)}
			role="region"
			aria-label="AR Overlay Interface"
		>
			{/* Connection Status Indicator */}
			<div className="absolute top-4 right-4 pointer-events-auto">
				<Badge
					variant={connectionStatus === ConnectionStatus.CONNECTED ? 'default' : 'destructive'}
					className="flex items-center gap-2"
				>
					{connectionStatus === ConnectionStatus.CONNECTED ? (
						<Wifi className="w-3 h-3" />
					) : (
						<WifiOff className="w-3 h-3" />
					)}
					<span className="sr-only">Connection status: </span>
					{connectionStatus}
				</Badge>
			</div>

			{/* Emergency Alerts - Critical positioning at top center */}
			{activeEmergencyAlerts.length > 0 && (
				<div className="absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-auto">
					<div className="space-y-2 max-w-md">
						{activeEmergencyAlerts.map(alert => (
							<Alert
								key={alert.id}
								className={cn(
									'border-2 animate-pulse',
									alert.severity === 'critical' && 'border-red-600 bg-red-50',
									alert.severity === 'danger' && 'border-orange-600 bg-orange-50',
									alert.severity === 'warning' && 'border-yellow-600 bg-yellow-50'
								)}
							>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription className="font-medium">
									<div className="flex justify-between items-start">
										<div>
											<div className="font-semibold">{alert.title}</div>
											<div className="text-sm">{alert.message}</div>
											<div className="text-xs text-muted-foreground">
												From: {alert.source}
											</div>
										</div>
										<button
											onClick={() => handleEmergencyAcknowledge(alert.id)}
											className="ml-2 px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50"
											aria-label={`Acknowledge emergency alert: ${alert.title}`}
										>
											ACK
										</button>
									</div>
								</AlertDescription>
							</Alert>
						))}
					</div>
				</div>
			)}

			{/* Member Notification Icons - Left side positioning */}
			<div className="absolute left-4 top-1/4 pointer-events-auto">
				<div className="space-y-3">
					{notifications.slice(-5).map(notification => {
						const member = memberList.find(m => m.id === notification.memberId);
						const IconComponent = getNotificationIcon(notification);

						if (!member) return null;

						return (
							<button
								key={notification.id}
								onClick={() => handleNotificationClick(notification)}
								className={cn(
									'relative flex items-center gap-2 p-2 rounded-lg',
									'bg-white/90 backdrop-blur-sm border shadow-sm',
									'hover:bg-white transition-colors',
									'focus:outline-none focus:ring-2 focus:ring-blue-500',
									!notification.isRead && 'ring-2 ring-blue-400'
								)}
								aria-label={`Notification from ${member.name}: ${notification.content}`}
							>
								<div className="relative">
									<Avatar className="w-8 h-8">
										<AvatarImage src={member.avatar} alt={member.name} />
										<AvatarFallback className={getMemberIdentifier(member)}>
											{member.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>

									{/* Notification type indicator */}
									<div className={cn(
										'absolute -top-1 -right-1 w-4 h-4 rounded-full',
										'flex items-center justify-center',
										notification.priority === 'critical' && 'bg-red-500',
										notification.priority === 'high' && 'bg-orange-500',
										notification.priority === 'medium' && 'bg-blue-500',
										notification.priority === 'low' && 'bg-gray-500'
									)}>
										<IconComponent className="w-2 h-2 text-white" />
									</div>
								</div>

								<div className="text-left min-w-0">
									<div className="font-medium text-sm truncate">
										{member.name}
									</div>
									<div className="text-xs text-muted-foreground truncate max-w-32">
										{notification.content}
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{/* Unread count indicator */}
				{unreadCount > 0 && (
					<Badge
						className="mt-2 bg-red-500 text-white"
						aria-label={`${unreadCount} unread notifications`}
					>
						{unreadCount} unread
					</Badge>
				)}
			</div>

			{/* Text Overlays - Dynamic positioning for 'show me' commands */}
			{textOverlays.map(overlay => (
				<div
					key={overlay.id}
					className="absolute pointer-events-none"
					style={{
						left: `${overlay.position.x}%`,
						top: `${overlay.position.y}%`,
						transform: 'translate(-50%, -50%)'
					}}
				>
					<div className={cn(
						'px-3 py-2 bg-black/80 text-white rounded-lg',
						'backdrop-blur-sm border border-white/20',
						'animate-in fade-in-0 zoom-in-95 duration-300',
						overlay.fontSize === 'sm' && 'text-sm',
						overlay.fontSize === 'md' && 'text-base',
						overlay.fontSize === 'lg' && 'text-lg',
						overlay.fontSize === 'xl' && 'text-xl'
					)}
						role="status"
						aria-live="polite"
					>
						{overlay.type === 'command' && (
							<Eye className="inline w-4 h-4 mr-2" aria-hidden="true" />
						)}
						{overlay.content}
					</div>
				</div>
      ))}

					{/* Unity WebGL Container Integration Point */}
					{isXrealConnected && (
						<div
							className="absolute inset-0 pointer-events-none"
							id="unity-ar-integration"
							aria-hidden="true"
						/>
					)}
				</div>
			);
};

			export default AROverlay;
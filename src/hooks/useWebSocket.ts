import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
	enabled?: boolean;
	reconnect?: boolean;
	reconnectInterval?: number;
	reconnectAttempts?: number;
	onOpen?: (event: Event) => void;
	onClose?: (event: CloseEvent) => void;
	onError?: (event: Event) => void;
	onMessage?: (data: any) => void;
	protocols?: string | string[];
}

interface UseWebSocketReturn {
	sendMessage: (message: any) => void;
	lastMessage: any;
	readyState: number;
	isConnected: boolean;
	isConnecting: boolean;
	isDisconnected: boolean;
	reconnect: () => void;
	disconnect: () => void;
}

const ReadyState = {
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3,
} as const;

/**
 * Custom hook for managing WebSocket connections.
 * Provides automatic reconnection, message queuing, and connection state management.
 * 
 * @param url - WebSocket URL
 * @param options - Configuration options
 */
export function useWebSocket(
	url: string,
	options: UseWebSocketOptions = {}
): UseWebSocketReturn {
	const {
		enabled = true,
		reconnect = true,
		reconnectInterval = 3000,
		reconnectAttempts = 5,
		onOpen,
		onClose,
		onError,
		onMessage,
		protocols
	} = options;

	const [lastMessage, setLastMessage] = useState<any>(null);
	const [readyState, setReadyState] = useState<number>(ReadyState.CLOSED);
	const [reconnectCount, setReconnectCount] = useState(0);

	const ws = useRef<WebSocket | null>(null);
	const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
	const messageQueue = useRef<any[]>([]);
	const mounted = useRef(true);

	// Connection state helpers
	const isConnected = readyState === ReadyState.OPEN;
	const isConnecting = readyState === ReadyState.CONNECTING;
	const isDisconnected = readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING;

	// Clear reconnect timeout
	const clearReconnectTimeout = useCallback(() => {
		if (reconnectTimeout.current) {
			clearTimeout(reconnectTimeout.current);
			reconnectTimeout.current = null;
		}
	}, []);

	// Send queued messages
	const sendQueuedMessages = useCallback(() => {
		if (ws.current?.readyState === ReadyState.OPEN) {
			const queue = [...messageQueue.current];
			messageQueue.current = [];

			queue.forEach(message => {
				try {
					ws.current?.send(JSON.stringify(message));
				} catch (error) {
					console.error('Failed to send queued message:', error);
				}
			});
		}
	}, []);

	// Connect to WebSocket
	const connect = useCallback(() => {
		if (!enabled || !url || !mounted.current) return;

		try {
			clearReconnectTimeout();

			// Close existing connection
			if (ws.current) {
				ws.current.close();
			}

			// Create new WebSocket connection
			ws.current = new WebSocket(url, protocols);
			setReadyState(ReadyState.CONNECTING);

			// Handle connection open
			ws.current.onopen = (event) => {
				if (!mounted.current) return;

				console.log('WebSocket connected:', url);
				setReadyState(ReadyState.OPEN);
				setReconnectCount(0);
				sendQueuedMessages();
				onOpen?.(event);
			};

			// Handle messages
			ws.current.onmessage = (event) => {
				if (!mounted.current) return;

				try {
					const data = JSON.parse(event.data);
					setLastMessage(data);
					onMessage?.(data);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
					setLastMessage(event.data);
					onMessage?.(event.data);
				}
			};

			// Handle errors
			ws.current.onerror = (event) => {
				if (!mounted.current) return;

				console.error('WebSocket error:', event);
				onError?.(event);
			};

			// Handle connection close
			ws.current.onclose = (event) => {
				if (!mounted.current) return;

				console.log('WebSocket closed:', event.code, event.reason);
				setReadyState(ReadyState.CLOSED);
				onClose?.(event);

				// Attempt reconnection
				if (reconnect && reconnectCount < reconnectAttempts && mounted.current) {
					const timeout = reconnectInterval * Math.pow(2, reconnectCount); // Exponential backoff
					console.log(`Reconnecting in ${timeout}ms... (attempt ${reconnectCount + 1}/${reconnectAttempts})`);

					reconnectTimeout.current = setTimeout(() => {
						if (mounted.current) {
							setReconnectCount(prev => prev + 1);
							connect();
						}
					}, timeout);
				}
			};
		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			setReadyState(ReadyState.CLOSED);
		}
	}, [url, enabled, protocols, reconnect, reconnectInterval, reconnectAttempts, reconnectCount, onOpen, onClose, onError, onMessage, sendQueuedMessages, clearReconnectTimeout]);

	// Send message
	const sendMessage = useCallback((message: any) => {
		if (ws.current?.readyState === ReadyState.OPEN) {
			try {
				ws.current.send(JSON.stringify(message));
			} catch (error) {
				console.error('Failed to send message:', error);
				messageQueue.current.push(message);
			}
		} else {
			// Queue message if not connected
			messageQueue.current.push(message);

			// Attempt to connect if disconnected
			if (readyState === ReadyState.CLOSED && enabled) {
				connect();
			}
		}
	}, [readyState, enabled, connect]);

	// Manual reconnect
	const reconnectManual = useCallback(() => {
		setReconnectCount(0);
		connect();
	}, [connect]);

	// Disconnect
	const disconnect = useCallback(() => {
		clearReconnectTimeout();

		if (ws.current) {
			ws.current.close();
			ws.current = null;
		}

		setReadyState(ReadyState.CLOSED);
		messageQueue.current = [];
	}, [clearReconnectTimeout]);

	// Initialize connection
	useEffect(() => {
		mounted.current = true;

		if (enabled && url) {
			connect();
		}

		return () => {
			mounted.current = false;
			clearReconnectTimeout();

			if (ws.current) {
				ws.current.close();
			}
		};
	}, [url, enabled, connect, clearReconnectTimeout]); // Only reconnect on URL or enabled change

	// Update ready state
	useEffect(() => {
		if (ws.current) {
			const interval = setInterval(() => {
				if (mounted.current && ws.current) {
					setReadyState(ws.current.readyState);
				}
			}, 100);

			return () => clearInterval(interval);
		}
		return undefined;
	}, []);

	return {
		sendMessage,
		lastMessage,
		readyState,
		isConnected,
		isConnecting,
		isDisconnected,
		reconnect: reconnectManual,
		disconnect
	};
}

/**
 * Hook for subscribing to specific WebSocket message types.
 * 
 * @example
 * useWebSocketSubscription(ws, 'notification_update', (data) => {
 *   console.log('Notification updated:', data);
 * });
 */
export function useWebSocketSubscription(
	ws: UseWebSocketReturn,
	messageType: string,
	handler: (data: any) => void
) {
	useEffect(() => {
		if (ws.lastMessage?.type === messageType) {
			handler(ws.lastMessage);
		}
	}, [ws.lastMessage, messageType, handler]);
}

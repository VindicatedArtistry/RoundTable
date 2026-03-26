'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// SpeechRecognition interface for browsers that don't have it declared
interface ISpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	onaudioend: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onaudiostart: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
	onnomatch: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
	onsoundend: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onsoundstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onspeechend: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onspeechstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
	onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
	abort(): void;
	start(): void;
	stop(): void;
}

interface ISpeechRecognitionConstructor {
	new(): ISpeechRecognition;
	prototype: ISpeechRecognition;
}

// Extend Window interface for Speech Recognition APIs
declare global {
	interface Window {
		SpeechRecognition: ISpeechRecognitionConstructor;
		webkitSpeechRecognition: ISpeechRecognitionConstructor;
		webkitAudioContext: typeof AudioContext;
	}
}

// SpeechRecognition event types
interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message?: string;
}
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useThrottle } from '@/hooks/useThrottle';
import Image from 'next/image';
import {
	Mic,
	MicOff,
	Volume2,
	VolumeX,
	Loader2,
	AlertCircle,
	Eye,
	Settings,
	Wifi,
	WifiOff,
	Activity,
	ChevronRight,
	Keyboard,
	Info,
	Users
} from 'lucide-react';

// Extended interfaces for better type safety
interface VoiceActivityData {
	level: number;
	frequency: number;
	timestamp: number;
	bands: number[]; // Frequency bands for better visualization
}

interface Speaker {
	id: string;
	name: string;
	avatar?: string;
	isActive: boolean;
	volume?: number;
	lastActiveTime?: number;
}

interface VoiceInterfaceProps {
	isEnabled?: boolean;
	onTogglePersistentMode?: (enabled: boolean) => void;
	onVoiceCommand?: (command: string, confidence: number) => void;
	onShowMeCommand?: (text: string) => void;
	onSpeechStart?: () => void;
	onSpeechEnd?: () => void;
	onError?: (error: Error) => void;
	speakers?: Speaker[];
	currentSpeaker?: Speaker | null;
	className?: string;
	arMode?: boolean;
	webrtcConfig?: RTCConfiguration;
}

interface AudioState {
	isRecording: boolean;
	isPlaying: boolean;
	isMuted: boolean;
	error: string | null;
	isConnecting: boolean;
	connectionQuality: 'excellent' | 'good' | 'poor' | 'none';
	permissionStatus: 'granted' | 'denied' | 'prompt' | 'checking';
}

interface WebRTCConnection {
	peerConnection: RTCPeerConnection | null;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	dataChannel: RTCDataChannel | null;
	stats: RTCStatsReport | null;
}

interface VoiceSettings {
	persistentMode: boolean;
	visualizationType: 'waveform' | 'bars' | 'circle';
	sensitivity: number;
	language: string;
	autoInterrupt: boolean;
}

// Default settings
const defaultSettings: VoiceSettings = {
	persistentMode: false,
	visualizationType: 'waveform',
	sensitivity: 50,
	language: 'en-US',
	autoInterrupt: true
};

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
	toggleVoice: 'Space',
	mute: 'm',
	showMe: 's',
	interrupt: 'Escape'
};

// Canvas configuration for responsive rendering
const CANVAS_CONFIG = {
	mobile: { width: 280, height: 100 },
	tablet: { width: 320, height: 120 },
	desktop: { width: 400, height: 140 }
};

const VoiceInterface = memo<VoiceInterfaceProps>(({
	isEnabled = false,
	onTogglePersistentMode,
	onVoiceCommand,
	onShowMeCommand,
	onSpeechStart,
	onSpeechEnd,
	onError,
	speakers = [],
	currentSpeaker = null,
	className,
	arMode = false,
	webrtcConfig
}) => {
	// Responsive design hooks
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
	const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	// Settings persistence
	const [settings, setSettings] = useLocalStorage<VoiceSettings>('voice-settings', defaultSettings);

	// State management
	const [audioState, setAudioState] = useState<AudioState>({
		isRecording: false,
		isPlaying: false,
		isMuted: false,
		error: null,
		isConnecting: false,
		connectionQuality: 'none',
		permissionStatus: 'checking'
	});

	const [voiceActivity, setVoiceActivity] = useState<VoiceActivityData[]>([]);
	const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);
	const [webrtcConnection, setWebrtcConnection] = useState<WebRTCConnection>({
		peerConnection: null,
		localStream: null,
		remoteStream: null,
		dataChannel: null,
		stats: null
	});
	const [showSettings, setShowSettings] = useState(false);
	const [isSupported, setIsSupported] = useState(true);

	// Refs
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const interruptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const liveRegionRef = useRef<HTMLDivElement>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Throttled waveform drawing for performance
	const throttledDrawWaveform = useThrottle((dataArray: Uint8Array) => {
		drawWaveform(dataArray);
	}, 16); // ~60fps max

	// Check browser support
	useEffect(() => {
		const checkSupport = () => {
			const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
			const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
			const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);

			setIsSupported(hasWebRTC && hasSpeechRecognition && hasAudioContext);
		};

		checkSupport();
	}, []);

	// Check microphone permissions
	const checkMicrophonePermission = useCallback(async () => {
		try {
			const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			setAudioState(prev => ({ ...prev, permissionStatus: result.state as any }));

			result.addEventListener('change', () => {
				setAudioState(prev => ({ ...prev, permissionStatus: result.state as any }));
			});
		} catch (error) {
			// Fallback for browsers that don't support permissions API
			setAudioState(prev => ({ ...prev, permissionStatus: 'prompt' }));
		}
	}, []);

	// Announce status changes to screen readers
	const announceStatus = useCallback((message: string) => {
		if (liveRegionRef.current) {
			liveRegionRef.current.textContent = message;
		}
	}, []);

	// Initialize speech recognition with error handling
	const initializeSpeechRecognition = useCallback(() => {
		if (typeof window === 'undefined') return null;

		try {
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			if (!SpeechRecognition) {
				throw new Error('Speech recognition not supported');
			}

			const recognition = new SpeechRecognition();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = settings.language;
			recognition.maxAlternatives = 3;

			recognition.onstart = () => {
				setAudioState(prev => ({ ...prev, isRecording: true, error: null }));
				announceStatus('Voice recognition started');
				onSpeechStart?.();
			};

			recognition.onend = () => {
				setAudioState(prev => ({ ...prev, isRecording: false }));
				announceStatus('Voice recognition stopped');
				onSpeechEnd?.();

				// Restart recognition if in persistent mode
				if (settings.persistentMode && !audioState.error) {
					setTimeout(() => {
						try {
							recognition.start();
						} catch (error) {
							console.error('Failed to restart recognition:', error);
						}
					}, 100);
				}
			};

			recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
				const errorMessage = `Speech recognition error: ${event.error}`;
				setAudioState(prev => ({
					...prev,
					error: errorMessage,
					isRecording: false
				}));
				announceStatus(errorMessage);
				onError?.(new Error(errorMessage));

				// Handle specific errors
				if (event.error === 'no-speech') {
					// Restart if in persistent mode
					if (settings.persistentMode) {
						setTimeout(() => recognition.start(), 1000);
					}
				}
			};

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				const lastResult = event.results[event.results.length - 1];
				const transcript = lastResult[0].transcript.trim();
				const confidence = lastResult[0].confidence;

				if (lastResult.isFinal) {
					const lowerTranscript = transcript.toLowerCase();

					// Handle 'show me' command specifically
					if (lowerTranscript.startsWith('show me')) {
						const textToShow = transcript.substring(8).trim();
						onShowMeCommand?.(textToShow);
						announceStatus(`Showing: ${textToShow}`);
					} else {
						onVoiceCommand?.(transcript, confidence);
					}

					// Handle interruption commands
					if (settings.autoInterrupt && (lowerTranscript.includes('stop') || lowerTranscript.includes('pause'))) {
						handleInterruption();
					}
				}
			};

			return recognition;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to initialize speech recognition';
			setAudioState(prev => ({ ...prev, error: errorMessage }));
			onError?.(error instanceof Error ? error : new Error(errorMessage));
			return null;
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settings.persistentMode, settings.language, settings.autoInterrupt, audioState.error, onSpeechStart, onSpeechEnd, onVoiceCommand, onShowMeCommand, onError, announceStatus]);

	// Initialize WebRTC with retry logic
	const initializeWebRTC = useCallback(async (retryCount = 0) => {
		const MAX_RETRIES = 3;
		const RETRY_DELAY = 1000 * Math.pow(2, retryCount); // Exponential backoff

		try {
			setAudioState(prev => ({ ...prev, isConnecting: true }));

			const config = webrtcConfig || {
				iceServers: [
					{ urls: 'stun:stun.l.google.com:19302' },
					{ urls: 'stun:stun1.l.google.com:19302' }
				]
			};

			const peerConnection = new RTCPeerConnection(config);

			// Request microphone with optimal settings
			const localStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 48000,
					channelCount: 1
				}
			});

			localStream.getTracks().forEach(track => {
				peerConnection.addTrack(track, localStream);
			});

			const dataChannel = peerConnection.createDataChannel('voice-commands', {
				ordered: true,
				maxRetransmits: 3
			});

			dataChannel.onopen = () => {
				console.log('WebRTC data channel opened');
				setAudioState(prev => ({ ...prev, connectionQuality: 'excellent' }));
				announceStatus('Voice connection established');
			};

			dataChannel.onclose = () => {
				setAudioState(prev => ({ ...prev, connectionQuality: 'none' }));
				announceStatus('Voice connection lost');
			};

			dataChannel.onerror = (error) => {
				console.error('Data channel error:', error);
				setAudioState(prev => ({ ...prev, connectionQuality: 'poor' }));
			};

			dataChannel.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === 'voice-command') {
						onVoiceCommand?.(data.command, data.confidence);
					} else if (data.type === 'connection-quality') {
						setAudioState(prev => ({ ...prev, connectionQuality: data.quality }));
					}
				} catch (error) {
					console.error('Error parsing WebRTC message:', error);
				}
			};

			peerConnection.oniceconnectionstatechange = () => {
				const state = peerConnection.iceConnectionState;
				if (state === 'failed' || state === 'disconnected') {
					handleConnectionFailure();
				}
			};

			peerConnection.ontrack = (event) => {
				const [remoteStream] = event.streams;
				setWebrtcConnection(prev => ({ ...prev, remoteStream }));
			};

			// Start monitoring connection stats
			startConnectionStatsMonitoring(peerConnection);

			setWebrtcConnection({
				peerConnection,
				localStream,
				remoteStream: null,
				dataChannel,
				stats: null
			});

			setAudioState(prev => ({ ...prev, isConnecting: false, error: null }));

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to initialize WebRTC';
			setAudioState(prev => ({
				...prev,
				error: errorMessage,
				isConnecting: false,
				connectionQuality: 'none'
			}));
			onError?.(error instanceof Error ? error : new Error(errorMessage));

			// Retry with exponential backoff
			if (retryCount < MAX_RETRIES) {
				reconnectTimeoutRef.current = setTimeout(() => {
					initializeWebRTC(retryCount + 1);
				}, RETRY_DELAY);
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [webrtcConfig, onVoiceCommand, onError, announceStatus]);

	// Monitor WebRTC connection quality
	const startConnectionStatsMonitoring = useCallback((peerConnection: RTCPeerConnection) => {
		const checkStats = async () => {
			try {
				const stats = await peerConnection.getStats();
				let audioLevel = 0;
				let packetLoss = 0;

				stats.forEach(report => {
					if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
						audioLevel = report.audioLevel || 0;
						packetLoss = report.packetsLost || 0;
					}
				});

				// Update connection quality based on stats
				let quality: AudioState['connectionQuality'] = 'excellent';
				if (packetLoss > 5) quality = 'poor';
				else if (packetLoss > 1) quality = 'good';

				setAudioState(prev => ({ ...prev, connectionQuality: quality }));
				setWebrtcConnection(prev => ({ ...prev, stats }));

			} catch (error) {
				console.error('Error getting WebRTC stats:', error);
			}
		};

		statsIntervalRef.current = setInterval(checkStats, 1000);
	}, []);

	// Handle connection failures with recovery
	const handleConnectionFailure = useCallback(() => {
		announceStatus('Connection lost, attempting to reconnect...');

		// Clean up current connection
		if (webrtcConnection.peerConnection) {
			webrtcConnection.peerConnection.close();
		}

		// Attempt reconnection
		reconnectTimeoutRef.current = setTimeout(() => {
			initializeWebRTC();
		}, 2000);
	}, [webrtcConnection.peerConnection, initializeWebRTC, announceStatus]);

	// Initialize audio analysis with performance optimization
	const initializeAudioAnalysis = useCallback(async () => {
		try {
			if (!webrtcConnection.localStream) return;

			audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
			analyserRef.current = audioContextRef.current.createAnalyser();

			// Optimize for different visualization types
			if (settings.visualizationType === 'bars') {
				analyserRef.current.fftSize = 128; // Lower for bar visualization
			} else {
				analyserRef.current.fftSize = 256;
			}

			analyserRef.current.smoothingTimeConstant = 0.8;
			analyserRef.current.minDecibels = -90;
			analyserRef.current.maxDecibels = -10;

			microphoneRef.current = audioContextRef.current.createMediaStreamSource(
				webrtcConnection.localStream
			);
			microphoneRef.current.connect(analyserRef.current);

			if (!prefersReducedMotion) {
				startVoiceActivityAnalysis();
			}
		} catch (error) {
			console.error('Error initializing audio analysis:', error);
			onError?.(error instanceof Error ? error : new Error('Failed to initialize audio analysis'));
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [webrtcConnection.localStream, settings.visualizationType, prefersReducedMotion, onError]);

	// Optimized voice activity analysis
	const startVoiceActivityAnalysis = useCallback(() => {
		if (!analyserRef.current) return;

		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		const frequencyBands = new Uint8Array(8); // 8 frequency bands for visualization

		const analyze = () => {
			if (!analyserRef.current || !audioContextRef.current) return;

			analyserRef.current.getByteFrequencyData(dataArray);

			// Calculate frequency bands
			const bandSize = Math.floor(bufferLength / 8);
			for (let i = 0; i < 8; i++) {
				let sum = 0;
				for (let j = i * bandSize; j < (i + 1) * bandSize; j++) {
					sum += dataArray[j];
				}
				frequencyBands[i] = sum / bandSize;
			}

			// Calculate average volume level
			const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
			const normalizedLevel = average / 255;

			// Calculate dominant frequency
			const maxIndex = dataArray.indexOf(Math.max(...dataArray));
			const frequency = (maxIndex * audioContextRef.current.sampleRate) / (2 * bufferLength);

			// Apply sensitivity adjustment
			const adjustedLevel = normalizedLevel * (settings.sensitivity / 50);

			const activityData: VoiceActivityData = {
				level: Math.min(adjustedLevel, 1),
				frequency,
				timestamp: Date.now(),
				bands: Array.from(frequencyBands).map(b => b / 255)
			};

			setVoiceActivity(prev => {
				const newActivity = [...prev, activityData];
				// Keep only last 100 data points for performance
				return newActivity.slice(-100);
			});

			throttledDrawWaveform(dataArray);
			animationFrameRef.current = requestAnimationFrame(analyze);
		};

		analyze();
	}, [settings.sensitivity, throttledDrawWaveform]);

	// Waveform visualization
	const drawWaveformVisualization = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
		const gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, arMode ? 'rgba(147, 51, 234, 0.8)' : 'rgba(59, 130, 246, 0.8)');
		gradient.addColorStop(1, arMode ? 'rgba(236, 72, 153, 0.8)' : 'rgba(147, 51, 234, 0.8)');

		ctx.beginPath();
		ctx.strokeStyle = gradient;
		ctx.lineWidth = 2;

		const sliceWidth = width / dataArray.length;
		let x = 0;

		for (let i = 0; i < dataArray.length; i++) {
			const v = dataArray[i] / 255;
			const y = height - (v * height);

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		ctx.stroke();
	}, [arMode]);

	// Bars visualization
	const drawBarsVisualization = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
		const barCount = 32;
		const barWidth = width / barCount;
		const barGap = 2;

		for (let i = 0; i < barCount; i++) {
			const dataIndex = Math.floor((i / barCount) * dataArray.length);
			const barHeight = (dataArray[dataIndex] / 255) * height;

			const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
			gradient.addColorStop(0, arMode ? 'rgba(147, 51, 234, 0.8)' : 'rgba(59, 130, 246, 0.8)');
			gradient.addColorStop(1, arMode ? 'rgba(236, 72, 153, 0.8)' : 'rgba(147, 51, 234, 0.8)');

			ctx.fillStyle = gradient;
			ctx.fillRect(i * barWidth + barGap / 2, height - barHeight, barWidth - barGap, barHeight);
		}
	}, [arMode]);

	// Circle visualization
	const drawCircleVisualization = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(width, height) / 3;

		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

		const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
		const scale = 1 + (average / 255) * 0.5;

		const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * scale);
		gradient.addColorStop(0, arMode ? 'rgba(147, 51, 234, 0.8)' : 'rgba(59, 130, 246, 0.8)');
		gradient.addColorStop(1, 'transparent');

		ctx.fillStyle = gradient;
		ctx.fill();
	}, [arMode]);

	// Responsive canvas drawing with multiple visualization types
	const drawWaveform = useCallback((dataArray: Uint8Array) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		if (settings.visualizationType === 'waveform') {
			drawWaveformVisualization(ctx, dataArray, width, height);
		} else if (settings.visualizationType === 'bars') {
			drawBarsVisualization(ctx, dataArray, width, height);
		} else if (settings.visualizationType === 'circle') {
			drawCircleVisualization(ctx, dataArray, width, height);
		}
	}, [settings.visualizationType, drawWaveformVisualization, drawBarsVisualization, drawCircleVisualization]);

	// Handle speech interruption
	const handleInterruption = useCallback(() => {
		if (window.speechSynthesis && window.speechSynthesis.speaking) {
			window.speechSynthesis.cancel();
		}

		if (interruptionTimeoutRef.current) {
			clearTimeout(interruptionTimeoutRef.current);
		}

		setAudioState(prev => ({ ...prev, isPlaying: false }));
		announceStatus('Speech interrupted');

		// Resume listening after brief pause
		if (settings.persistentMode && recognition) {
			interruptionTimeoutRef.current = setTimeout(() => {
				try {
					recognition.start();
				} catch (error) {
					console.error('Failed to resume recognition:', error);
				}
			}, 500);
		}
	}, [recognition, settings.persistentMode, announceStatus]);

	// Toggle persistent voice mode
	const togglePersistentMode = useCallback(() => {
		const newMode = !settings.persistentMode;
		setSettings(prev => ({ ...prev, persistentMode: newMode }));
		onTogglePersistentMode?.(newMode);
		announceStatus(newMode ? 'Persistent voice mode enabled' : 'Persistent voice mode disabled');

		if (newMode && recognition && !audioState.isRecording) {
			try {
				recognition.start();
			} catch (error) {
				console.error('Failed to start recognition:', error);
			}
		} else if (!newMode && recognition && audioState.isRecording) {
			recognition.stop();
		}
	}, [settings.persistentMode, recognition, audioState.isRecording, onTogglePersistentMode, setSettings, announceStatus]);

	// Toggle microphone mute
	const toggleMute = useCallback(() => {
		if (webrtcConnection.localStream) {
			const audioTracks = webrtcConnection.localStream.getAudioTracks();
			const newMuteState = !audioState.isMuted;

			audioTracks.forEach(track => {
				track.enabled = !newMuteState;
			});

			setAudioState(prev => ({ ...prev, isMuted: newMuteState }));
			announceStatus(newMuteState ? 'Microphone muted' : 'Microphone unmuted');
		}
	}, [webrtcConnection.localStream, audioState.isMuted, announceStatus]);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// Don't trigger if user is typing in an input
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (event.key) {
				case KEYBOARD_SHORTCUTS.toggleVoice:
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						togglePersistentMode();
					}
					break;
				case KEYBOARD_SHORTCUTS.mute:
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						toggleMute();
					}
					break;
				case KEYBOARD_SHORTCUTS.showMe:
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						onShowMeCommand?.('current view');
					}
					break;
				case KEYBOARD_SHORTCUTS.interrupt:
					event.preventDefault();
					handleInterruption();
					break;
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [togglePersistentMode, toggleMute, onShowMeCommand, handleInterruption]);

	// Calculate voice activity metrics
	const voiceMetrics = useMemo(() => {
		if (voiceActivity.length === 0) return { level: 0, speaking: false, quality: 'none' as const };

		const recent = voiceActivity.slice(-10);
		const avgLevel = recent.reduce((sum, activity) => sum + activity.level, 0) / recent.length;
		const speaking = avgLevel > 0.1;

		let quality: 'excellent' | 'good' | 'poor' | 'none' = 'none';
		if (avgLevel > 0.7) quality = 'excellent';
		else if (avgLevel > 0.4) quality = 'good';
		else if (avgLevel > 0.1) quality = 'poor';

		return { level: avgLevel, speaking, quality };
	}, [voiceActivity]);

	// Get canvas dimensions based on device
	const canvasDimensions = useMemo(() => {
		if (isMobile) return CANVAS_CONFIG.mobile;
		if (isTablet) return CANVAS_CONFIG.tablet;
		return CANVAS_CONFIG.desktop;
	}, [isMobile, isTablet]);

	// Initialize components on mount
	useEffect(() => {
		checkMicrophonePermission();

		if (isSupported) {
			const speechRecognition = initializeSpeechRecognition();
			setRecognition(speechRecognition);

			if (settings.persistentMode && speechRecognition) {
				try {
					speechRecognition.start();
				} catch (error) {
					console.error('Failed to start recognition on mount:', error);
				}
			}

			initializeWebRTC();
		}

		return () => {
			// Cleanup
			if (recognition) {
				recognition.stop();
			}
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
				audioContextRef.current.close();
			}
			if (webrtcConnection.localStream) {
				webrtcConnection.localStream.getTracks().forEach(track => track.stop());
			}
			if (webrtcConnection.peerConnection) {
				webrtcConnection.peerConnection.close();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (interruptionTimeoutRef.current) {
				clearTimeout(interruptionTimeoutRef.current);
			}
			if (statsIntervalRef.current) {
				clearInterval(statsIntervalRef.current);
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Initialize audio analysis when stream is ready
	useEffect(() => {
		if (webrtcConnection.localStream && isSupported) {
			initializeAudioAnalysis();
		}
	}, [webrtcConnection.localStream, isSupported, initializeAudioAnalysis]);

	// Update recognition language when settings change
	useEffect(() => {
		if (recognition && settings.language !== recognition.lang) {
			recognition.lang = settings.language;
			if (audioState.isRecording) {
				recognition.stop();
				setTimeout(() => {
					try {
						recognition.start();
					} catch (error) {
						console.error('Failed to restart with new language:', error);
					}
				}, 100);
			}
		}
	}, [recognition, settings.language, audioState.isRecording]);

	// Render error state for unsupported browsers
	if (!isSupported) {
		return (
			<Card className={cn('w-full max-w-md mx-auto', className)}>
				<CardContent className="p-6">
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Browser Not Supported</AlertTitle>
						<AlertDescription>
							Your browser does not support the required features for voice interaction.
							Please use a modern browser like Chrome, Firefox, or Edge.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	// Render permission prompt
	if (audioState.permissionStatus === 'prompt' || audioState.permissionStatus === 'denied') {
		return (
			<Card className={cn('w-full max-w-md mx-auto', className)}>
				<CardContent className="p-6 space-y-4">
					<Alert>
						<Info className="h-4 w-4" />
						<AlertTitle>Microphone Permission Required</AlertTitle>
						<AlertDescription>
							{audioState.permissionStatus === 'denied'
								? 'Microphone access was denied. Please enable it in your browser settings.'
								: 'Please allow microphone access to use voice features.'}
						</AlertDescription>
					</Alert>
					{audioState.permissionStatus === 'prompt' && (
						<Button
							onClick={() => initializeWebRTC()}
							className="w-full"
						>
							Enable Microphone
						</Button>
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card className={cn('w-full max-w-md mx-auto', className, arMode && 'bg-background/80 backdrop-blur-md')}>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							Voice Interface
							{currentSpeaker && (
								<Badge variant="secondary" className="text-xs">
									{currentSpeaker.name}
								</Badge>
							)}
						</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowSettings(!showSettings)}
							aria-label="Voice settings"
							aria-expanded={showSettings}
						>
							<Settings className={cn("h-4 w-4 transition-transform", showSettings && "rotate-90")} />
						</Button>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Live region for screen reader announcements */}
					<div
						ref={liveRegionRef}
						className="sr-only"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					/>

					{/* Connection status */}
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							{audioState.connectionQuality === 'none' ? (
								<WifiOff className="h-4 w-4 text-muted-foreground" />
							) : (
								<Wifi className={cn(
									"h-4 w-4",
									audioState.connectionQuality === 'excellent' && "text-green-500",
									audioState.connectionQuality === 'good' && "text-yellow-500",
									audioState.connectionQuality === 'poor' && "text-red-500"
								)} />
							)}
							<span className="text-muted-foreground capitalize">
								{audioState.connectionQuality} Connection
							</span>
						</div>

						{voiceMetrics.speaking && (
							<div className="flex items-center gap-1">
								<Activity className="h-3 w-3 text-green-500 animate-pulse" />
								<span className="text-xs text-muted-foreground">Speaking</span>
							</div>
						)}
					</div>

					{/* Error display */}
					{audioState.error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{audioState.error}</AlertDescription>
						</Alert>
					)}

					{/* Voice activity visualization */}
					<div className={cn(
						"relative rounded-lg overflow-hidden",
						"bg-gradient-to-b from-muted/50 to-muted",
						arMode && "from-purple-900/20 to-pink-900/20"
					)}>
						<canvas
							ref={canvasRef}
							width={canvasDimensions.width}
							height={canvasDimensions.height}
							className="w-full h-full"
							aria-label="Voice activity visualization"
							role="img"
						/>

						{/* Alternative text for screen readers */}
						<span className="sr-only">
							Voice activity level: {Math.round(voiceMetrics.level * 100)}%
						</span>

						{/* Voice level indicator overlay */}
						<div className="absolute top-2 right-2 flex items-center gap-2">
							<div
								className={cn(
									'w-3 h-3 rounded-full transition-all duration-200',
									voiceMetrics.speaking
										? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
										: 'bg-gray-400'
								)}
								aria-hidden="true"
							/>

							{/* Audio level meter */}
							<Progress
								value={voiceMetrics.level * 100}
								className="w-16 h-2"
								aria-label={`Audio level: ${Math.round(voiceMetrics.level * 100)}%`}
							/>
						</div>

						{/* Speaking animation overlay */}
						{audioState.isPlaying && !prefersReducedMotion && (
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<div className="bg-blue-500/20 rounded-full p-4 animate-pulse">
									<Volume2 className="h-8 w-8 text-blue-500" />
								</div>
							</div>
						)}
					</div>

					{/* Settings panel */}
					{showSettings && (
						<>
							<Separator />
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="visualization-type" className="text-sm">
										Visualization Type
									</Label>
									<select
										id="visualization-type"
										value={settings.visualizationType}
										onChange={(e) => setSettings(prev => ({
											...prev,
											visualizationType: e.target.value as VoiceSettings['visualizationType']
										}))}
										className="w-full p-2 rounded-md border bg-background"
									>
										<option value="waveform">Waveform</option>
										<option value="bars">Frequency Bars</option>
										<option value="circle">Circle</option>
									</select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="sensitivity" className="text-sm">
										Sensitivity: {settings.sensitivity}%
									</Label>
									<input
										id="sensitivity"
										type="range"
										min="0"
										max="100"
										value={settings.sensitivity}
										onChange={(e) => setSettings(prev => ({
											...prev,
											sensitivity: parseInt(e.target.value)
										}))}
										className="w-full"
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="auto-interrupt" className="text-sm">
										Auto Interrupt
									</Label>
									<Switch
										id="auto-interrupt"
										checked={settings.autoInterrupt}
										onCheckedChange={(checked) => setSettings(prev => ({
											...prev,
											autoInterrupt: checked
										}))}
									/>
								</div>
							</div>
						</>
					)}

					{/* Control buttons */}
					<div className="flex justify-center gap-2">
						{/* Persistent mode toggle */}
						<Button
							onClick={togglePersistentMode}
							disabled={audioState.isConnecting || !recognition}
							variant={settings.persistentMode ? "default" : "outline"}
							size={isMobile ? "default" : "lg"}
							className="flex-1"
							aria-label={settings.persistentMode ? "Disable persistent voice mode" : "Enable persistent voice mode"}
							aria-pressed={settings.persistentMode}
						>
							{audioState.isConnecting ? (
								<Loader2 className="h-5 w-5 animate-spin mr-2" />
							) : audioState.isRecording ? (
								<Mic className="h-5 w-5 mr-2 text-red-500 animate-pulse" />
							) : (
								<MicOff className="h-5 w-5 mr-2" />
							)}
							<span className="hidden sm:inline">
								{settings.persistentMode ? 'Active' : 'Inactive'}
							</span>
						</Button>

						{/* Mute toggle */}
						<Button
							onClick={toggleMute}
							disabled={!webrtcConnection.localStream}
							variant="outline"
							size={isMobile ? "icon" : "default"}
							aria-label={audioState.isMuted ? "Unmute microphone" : "Mute microphone"}
							aria-pressed={audioState.isMuted}
						>
							{audioState.isMuted ? (
								<VolumeX className="h-5 w-5" />
							) : (
								<Volume2 className="h-5 w-5" />
							)}
						</Button>

						{/* Show me command button */}
						<Button
							onClick={() => {
								onShowMeCommand?.('current view');
								announceStatus('Activating AR display');
							}}
							variant="outline"
							size={isMobile ? "icon" : "default"}
							aria-label="Activate show me command for AR display"
							className={cn(arMode && "ring-2 ring-purple-500")}
						>
							<Eye className="h-5 w-5" />
						</Button>
					</div>

					{/* Keyboard shortcuts help */}
					<div className="text-xs text-muted-foreground space-y-1">
						<div className="flex items-center gap-2">
							<Keyboard className="h-3 w-3" />
							<span>Keyboard Shortcuts:</span>
						</div>
						<div className="ml-5 space-y-0.5">
							<div>Ctrl+Space: Toggle Voice</div>
							<div>Ctrl+M: Mute/Unmute</div>
							<div>Ctrl+S: Show Me</div>
							<div>Esc: Interrupt</div>
						</div>
					</div>

					{/* Speaker list */}
					{speakers.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Users className="h-4 w-4" />
								Active Speakers ({speakers.filter(s => s.isActive).length})
							</h4>
							<div className="space-y-1 max-h-32 overflow-y-auto">
								{speakers.map(speaker => (
									<div
										key={speaker.id}
										className={cn(
											'flex items-center gap-2 p-2 rounded-md transition-all',
											speaker.isActive
												? 'bg-primary/10 border border-primary/20'
												: 'bg-muted/50 opacity-60'
										)}
									>
										{speaker.avatar && (
											<Image
													src={speaker.avatar}
													alt=""
													className="w-6 h-6 rounded-full"
													aria-hidden="true"
													width={24}
													height={24}
												/>
										)}
										<span className="text-sm font-medium flex-1">{speaker.name}</span>
										{speaker.isActive && (
											<>
												<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
												{speaker.volume !== undefined && (
													<Progress
														value={speaker.volume}
														className="w-12 h-1"
														aria-label={`${speaker.name} volume: ${speaker.volume}%`}
													/>
												)}
											</>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Status summary */}
					<div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
						<span className="flex items-center gap-1">
							{settings.persistentMode ? (
								<>
									<ChevronRight className="h-3 w-3" />
									Persistent Mode
								</>
							) : (
								'Manual Mode'
							)}
						</span>
						<span>
							{audioState.isRecording ? 'Listening...' : 'Ready'}
						</span>
					</div>
				</CardContent>
			</Card>
		</>
	);
});

VoiceInterface.displayName = 'VoiceInterface';

export default VoiceInterface;

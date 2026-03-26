'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/UseDebounce';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
	User,
	Crown,
	Shield,
	Sword,
	Book,
	Scale,
	Heart,
	Coins,
	Globe,
	Circle,
	Clock,
	MessageCircle,
	AlertCircle,
	Loader2,
	Brain,
	Code,
	DollarSign,
	Mic,
	Package,
	CheckCircle,
	Server,
	Calendar,
	Zap,
	Settings,
	Network,
	Leaf,
	Droplets,
	Cloud,
	ShieldCheck,
	Lightbulb,
	TrendingUp,
	Hammer,
	Users,
	Sparkles,
	Cog,
	BarChart3,
	Palette
} from 'lucide-react';
import Image from 'next/image';

// Type definitions for council members and user data
export interface CouncilMember {
	id: string;
	name: string;
	role: string;
	status: 'online' | 'away' | 'busy' | 'offline';
	avatar?: string;
	pendingItems: number;
	lastActivity: string;
	isUser: boolean;
	isHuman?: boolean; // Distinguishes between human and AI council members
}

interface WebSocketMessage {
	type: 'status_update' | 'activity_update' | 'pending_items_update';
	memberId: string;
	data: Partial<CouncilMember>;
}

interface RoundTableProps {
	members: CouncilMember[];
	onMemberClick: (member: CouncilMember) => void;
	onGraphPortalClick?: () => void;
	wsUrl?: string;
	className?: string;
}

// Status indicator color mapping
const statusColors = {
	online: 'bg-green-500',
	away: 'bg-yellow-500',
	busy: 'bg-red-500',
	offline: 'bg-gray-400'
} as const;

// Role icon mapping for visual representation
const roleIcons = {
	// Original fantasy roles
	'King': Crown,
	'Knight': Shield,
	'Warrior': Sword,
	'Scholar': Book,
	'Judge': Scale,
	'Healer': Heart,
	'Merchant': Coins,
	'Ambassador': Globe,
	'User': User,

	// AI Council Member roles
	'Chief Advisor & Strategist': Brain,
	'Lead Software Architect': Code,
	'AI Chief Financial Officer': DollarSign,
	'Chief Communications & Narrative Officer': Mic,
	'Chief Synergy Officer': Package,
	'Chief Ethics & Alignment Officer': CheckCircle,
	'Chief Technology & Infrastructure Officer': Server,
	'Executive Assistant & Operations Coordinator': Calendar,
	'Analysis & Intelligence Engineer': BarChart3,
	'Implementation & Integration Specialist': Zap,
	'Creative & Innovation Catalyst': Sparkles,
	'Chief Operations Officer': Settings,
	'Chief Communications Officer': Mic,
	'Founder & Architect': Crown,

	// Human Council Member roles
	'Chief Integration Officer': Cog,
	'Chief Network Engineer': Network,
	'Chief Environmental Steward': Leaf,
	'Lead Systems Engineer, Caelumetrics': Droplets,
	'Cloud & Edge Infrastructure Specialist': Cloud,
	'Personal Security & Operational Integrity Lead': ShieldCheck,
	'Chief Electrical Systems Consultant': Lightbulb,
	'Chief Growth & Narrative Officer': TrendingUp,
	'Chief Financial Officer': DollarSign,
	'Master Builder (CEO Vitruvian Industries)': Hammer,
	'Co-Founder': Users,

	// Short role names for easier matching
	'Strategist': Brain,
	'Architect': Code,
	'CFO': DollarSign,
	'Communications': Mic,
	'Synergy': Package,
	'Ethics': CheckCircle,
	'Infrastructure': Server,
	'Assistant': Calendar,
	'Intelligence': Brain,
	'Implementation': Zap,
	'Founder': Crown,
	'Integration': Cog,
	'Network': Network,
	'Environmental': Leaf,
	'Systems': Droplets,
	'Security': ShieldCheck,
	'Electrical': Lightbulb,
	'Growth': TrendingUp,
	'Builder': Hammer,
	'Creative': Sparkles
} as const;

// Pre-defined layout for all 24 council members evenly spaced around the center logo
const memberLayout = {
	'large': Array.from({ length: 24 }, (_, i) => ({
		angle: (i * 360) / 24, // 15 degrees apart for 24 members
		radius: 288 // Increased by 20% from 240
	})),
	'tablet': Array.from({ length: 24 }, (_, i) => ({
		angle: (i * 360) / 24,
		radius: 216 // Increased by 20% from 180
	})),
	'mobile': Array.from({ length: 24 }, (_, i) => ({
		angle: (i * 360) / 24,
		radius: 144 // Increased by 20% from 120
	})),
};

// Retry configuration for WebSocket
const WS_RETRY_CONFIG = {
	maxRetries: 5,
	baseDelay: 1000,
	maxDelay: 30000,
	factor: 2
};

// Member card component for better performance
const MemberCard = memo(({
	member,
	position,
	onMemberClick,
	isLoading
}: {
	member: CouncilMember;
	position: { angle: number; radius: number };
	onMemberClick: (member: CouncilMember) => void;
	isLoading: boolean;
}) => {
	const [isInteracting, setIsInteracting] = useState(false);
	const IconComponent = roleIcons[member.role as keyof typeof roleIcons] || User;

	const formatLastActivity = (lastActivity: string) => {
		const date = new Date(lastActivity);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		return `${Math.floor(diffMins / 1440)}d ago`;
	};

	const handleClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsInteracting(true);
		try {
			await onMemberClick(member);
		} finally {
			setIsInteracting(false);
		}
	};

	return (
		<div
			className="absolute transition-transform duration-300"
			style={{
				left: '50%',
				top: '50%',
				transform: `translate(-50%, -50%) rotate(${position.angle}deg) translateY(-${position.radius}px) rotate(-${position.angle}deg)`
			}}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer transition-all duration-300",
							"hover:scale-110 transform-gpu touch-manipulation",
							"rounded-full p-4 flex flex-col items-center justify-center",
							member.isUser && "ring-2 ring-blue-500 ring-opacity-50",
							isInteracting && "opacity-75"
						)}
						onClick={handleClick}
						role="button"
						tabIndex={0}
						aria-label={`Interact with ${member.name}, ${member.role}. Status: ${member.status}. ${member.pendingItems} pending items.`}
						aria-pressed={isInteracting}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								e.stopPropagation();
								handleClick(e as any);
							}
						}}
					>
						<div className="relative flex flex-col items-center">
							{/* Main Icon */}
							<IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-1" />

							{/* Status Indicator & Pending Items */}
							<div className="flex items-center space-x-2 my-1">
								<div
									className={cn(
										"w-3 h-3 rounded-full border-2 border-background",
										statusColors[member.status]
									)}
									aria-label={`Status: ${member.status}`}
								/>
								{member.pendingItems > 0 && (
									<Badge
										variant="destructive"
										className="h-5 min-w-5 flex items-center justify-center rounded-full text-xs p-0"
										aria-label={`${member.pendingItems} pending items`}
									>
										{member.pendingItems > 9 ? '9+' : member.pendingItems}
									</Badge>
								)}
							</div>

							{/* Member Name */}
							<span className="text-xs font-medium text-center leading-tight">
								{member.name}
							</span>

							{/* Interaction pulse effect */}
							{isInteracting && (
								<div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" />
							)}
						</div>
					</div>
				</TooltipTrigger>

				<TooltipContent side="top" className="max-w-xs">
					<div className="space-y-1">
						<p className="font-medium">{member.name}</p>
						<p className="text-sm">{member.role}</p>
						<p className="text-xs text-muted-foreground">
							Last active: {formatLastActivity(member.lastActivity)}
						</p>
						{member.pendingItems > 0 && (
							<p className="text-xs text-orange-600">
								{member.pendingItems} pending items
							</p>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</div>
	);
});

MemberCard.displayName = 'MemberCard';

// Connection Status Indicator Component
const ConnectionStatusIndicator = memo(({
	state,
	error
}: {
	state: 'connecting' | 'connected' | 'disconnected' | 'error';
	error: string | null;
}) => {
	const getStatusColor = () => {
		switch (state) {
			case 'connected': return 'bg-green-500';
			case 'connecting': return 'bg-yellow-500';
			case 'disconnected': return 'bg-gray-500';
			case 'error': return 'bg-red-500';
			default: return 'bg-gray-500';
		}
	};

	const getStatusIcon = () => {
		switch (state) {
			case 'connected': return <CheckCircle className="w-3 h-3" />;
			case 'connecting': return <Loader2 className="w-3 h-3 animate-spin" />;
			case 'disconnected': return <Circle className="w-3 h-3" />;
			case 'error': return <AlertCircle className="w-3 h-3" />;
			default: return <Circle className="w-3 h-3" />;
		}
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={cn(
					"w-6 h-6 rounded-full flex items-center justify-center text-white",
					getStatusColor()
				)}>
					{getStatusIcon()}
				</div>
			</TooltipTrigger>
			<TooltipContent side="left">
				<div className="space-y-1">
					<p className="font-medium">Connection Status: {state}</p>
					{error && <p className="text-xs text-red-400">{error}</p>}
				</div>
			</TooltipContent>
		</Tooltip>
	);
});

ConnectionStatusIndicator.displayName = 'ConnectionStatusIndicator';

function RoundTable({
	members,
	onMemberClick,
	onGraphPortalClick,
	wsUrl,
	className
}: RoundTableProps) {
	const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>(members);
	const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
	const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [wsRetryCount, setWsRetryCount] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);
	const liveRegionRef = useRef<HTMLDivElement>(null);
	const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Use a ref to hold the WebSocket message handler to avoid dependency issues
	const handleWebSocketMessageRef = useRef<((message: WebSocketMessage) => void) | undefined>(undefined);

	// Media queries for responsive design
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
	const isFoldable = useMediaQuery('(max-width: 523px)'); // Pixel 9 Pro Fold folded width

	// Use focus trap for keyboard navigation
	useFocusTrap(containerRef as React.RefObject<HTMLElement>, true);

	// Debounce WebSocket updates to prevent rapid re-renders
	const debouncedSetCouncilMembers = useDebounce(setCouncilMembers, 100);

	// Calculate retry delay with exponential backoff
	const getRetryDelay = useCallback((attemptNumber: number) => {
		const delay = Math.min(
			WS_RETRY_CONFIG.baseDelay * Math.pow(WS_RETRY_CONFIG.factor, attemptNumber),
			WS_RETRY_CONFIG.maxDelay
		);
		return delay;
	}, []);

	// Announce updates to screen readers
	const announceUpdate = useCallback((message: string) => {
		if (liveRegionRef.current) {
			liveRegionRef.current.textContent = message;
		}
	}, []);

	// Handle incoming WebSocket messages for real-time updates
	const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
		debouncedSetCouncilMembers(prevMembers =>
			prevMembers.map(member =>
				member.id === message.memberId
					? { ...member, ...message.data }
					: member
			)
		);

		// Announce important updates
		const member = councilMembers.find(m => m.id === message.memberId);
		if (member) {
			if (message.type === 'status_update') {
				announceUpdate(`${member.name} is now ${message.data.status}`);
			} else if (message.type === 'pending_items_update' && message.data.pendingItems) {
				announceUpdate(`${member.name} has ${message.data.pendingItems} pending items`);
			}
		}
	}, [councilMembers, debouncedSetCouncilMembers, announceUpdate]);

	// Keep the ref updated with the latest handler
	useEffect(() => {
		handleWebSocketMessageRef.current = handleWebSocketMessage;
	}, [handleWebSocketMessage]);

	// WebSocket connection management with retry logic
	const connectWebSocket = useCallback(() => {
		if (!wsUrl || wsConnection?.readyState === WebSocket.OPEN) return;

		if (wsRetryCount >= WS_RETRY_CONFIG.maxRetries) {
			setConnectionState('error');
			setConnectionError('Maximum retry attempts reached. Please refresh the page.');
			return;
		}

		setConnectionState('connecting');
		setConnectionError(null);

		try {
			const ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				console.log('WebSocket connected to Round Table updates');
				setConnectionState('connected');
				setWsConnection(ws);
				setWsRetryCount(0);
				announceUpdate('Connected to live updates');
			};

			ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					handleWebSocketMessageRef.current?.(message);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				setConnectionError('Connection failed');
				setConnectionState('error');
			};

			ws.onclose = () => {
				console.log('WebSocket connection closed');
				setWsConnection(null);
				setConnectionState('disconnected');

				// Retry with exponential backoff
				const delay = getRetryDelay(wsRetryCount);
				setWsRetryCount(prev => prev + 1);

				announceUpdate(`Connection lost. Retrying in ${Math.round(delay / 1000)} seconds`);

				retryTimeoutRef.current = setTimeout(() => {
					if (wsUrl) connectWebSocket();
				}, delay);
			};

		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			setConnectionError('Failed to connect');
			setConnectionState('error');
		}
	}, [wsUrl, wsConnection, wsRetryCount, getRetryDelay, announceUpdate]);

	// Initialize WebSocket connection on component mount
	useEffect(() => {
		if (wsUrl) {
			connectWebSocket();
		}

		return () => {
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}
			if (wsConnection) {
				wsConnection.close();
			}
		};
	}, [wsUrl, connectWebSocket, wsConnection]);

	// Update local state when props change
	useEffect(() => {
		setCouncilMembers(members);
	}, [members]);

	// Memoized member cards for performance
	const memoizedMemberCards = useMemo(() => {
		const layout = isTablet ? memberLayout.tablet : isMobile ? memberLayout.mobile : memberLayout.large;
		const membersToRender = isLoading ? Array(councilMembers.length).fill(null) : councilMembers;

		return membersToRender.map((member, index) => {
			const position = layout[index] || { angle: (index * 360) / 24, radius: 288 }; // Dynamic fallback for 24 members

			return (
				<MemberCard
					key={member?.id || index}
					member={member || { id: `skel-${index}`, name: '', role: '', status: 'offline', pendingItems: 0, lastActivity: '', isUser: false }}
					position={position}
					onMemberClick={onMemberClick}
					isLoading={isLoading}
				/>
			);
		});
	}, [councilMembers, isLoading, isMobile, isTablet, onMemberClick]);

	return (
		<TooltipProvider>
			<div
				ref={containerRef}
				className={cn(
					'relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px]',
					'flex items-center justify-center transition-all duration-500',
					className
				)}
				role="region"
				aria-label="AI Council Round Table"
			>
				{/* Emblem Image */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<Image
						src="/images/RoundTable.png"
						alt="Round Table Emblem"
						width={400}
						height={400}
						className="w-2/3 h-2/3 object-contain"
						priority
					/>
				</div>

				{/* Central Portal Button - Temporarily Disabled */}
				{/* {onGraphPortalClick && (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={onGraphPortalClick}
								className={cn(
									'absolute z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40',
									'rounded-full bg-background/50 backdrop-blur-sm border border-primary/20',
									'flex items-center justify-center text-primary/70 hover:text-primary hover:bg-primary/10',
									'transition-all duration-300 scale-100 hover:scale-105 active:scale-95'
								)}
								aria-label="Open Consciousness Graph Portal"
							>
								<Brain className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p>Explore the Council's Consciousness</p>
						</TooltipContent>
					</Tooltip>
				)} */}

				{/* Member Cards */}
				{memoizedMemberCards}

				{/* Live region for screen reader announcements */}
				<div ref={liveRegionRef} className="sr-only" aria-live="polite" aria-atomic="true" />

				{/* Connection Status Indicator */}
				{wsUrl && (
					<div className="absolute bottom-0 right-0">
						<ConnectionStatusIndicator state={connectionState} error={connectionError} />
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}

export default memo(RoundTable);

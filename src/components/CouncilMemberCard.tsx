'use client';

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
	User,
	MessageCircle,
	Activity,
	Settings,
	Clock,
	AlertCircle,
	CheckCircle,
	Mic,
	MicOff,
	Wifi,
	WifiOff,
	FileText,
	Users,
	Calendar,
	Zap,
	Volume2,
	Shield,
	Crown,
	Sword,
	Book,
	Scale,
	Heart,
	Coins,
	Globe
} from 'lucide-react';

// Type definitions for component props
interface MemberData {
	id: string;
	name: string;
	role: string;
	genesisFile: string;
	currentStatus: 'idle' | 'active' | 'speaking' | 'offline';
	avatar?: string;
	lastSeen?: Date;
	audioLevel?: number; // 0-100 for speaking status
	connectionQuality?: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface Notification {
	id: string;
	message: string;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	timestamp: Date;
	read: boolean;
}

interface ActivityItem {
	id: string;
	type: 'message' | 'action' | 'status_change' | 'meeting' | 'decision' | 'alert';
	description: string;
	timestamp: Date;
	priority?: 'low' | 'medium' | 'high';
	metadata?: Record<string, unknown>;
}

interface CouncilMemberCardProps {
	memberData: MemberData;
	notifications: Notification[];
	recentActivity: ActivityItem[];
	isActive: boolean;
	onCardClick?: (memberId: string) => void;
	onWorkspaceAccess?: (memberId: string) => void;
	className?: string;
	loading?: boolean;
	error?: string | null;
}

// Role icon mapping
const roleIcons: Record<string, React.FC<{ className?: string }>> = {
	'King': Crown,
	'Knight': Shield,
	'Warrior': Sword,
	'Scholar': Book,
	'Judge': Scale,
	'Healer': Heart,
	'Merchant': Coins,
	'Ambassador': Globe,
	'User': User
};

// Activity type icons
const activityIcons = {
	message: MessageCircle,
	action: Zap,
	status_change: Activity,
	meeting: Users,
	decision: Scale,
	alert: AlertCircle
} as const;

// Priority colors
const priorityColors = {
	low: 'text-blue-500 bg-blue-50',
	medium: 'text-yellow-600 bg-yellow-50',
	high: 'text-orange-600 bg-orange-50',
	urgent: 'text-red-600 bg-red-50'
} as const;

// Memoized activity item component
const ActivityListItem = memo(({
	activity,
	formatTimestamp
}: {
	activity: ActivityItem;
	formatTimestamp: (date: Date) => string;
}) => {
	const Icon = activityIcons[activity.type] || Activity;
	const priorityClass = activity.priority ? priorityColors[activity.priority] : '';

	return (
		<div
			className="flex items-start gap-2 text-xs group hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
			role="listitem"
		>
			<div className={cn(
				"mt-1 shrink-0 p-0.5 rounded",
				priorityClass || "text-muted-foreground"
			)}>
				<Icon className="h-3 w-3" aria-hidden="true" />
			</div>
			<div className="flex-1 min-w-0">
				<p
					className="truncate text-foreground/80 group-hover:text-foreground transition-colors"
					title={activity.description}
				>
					{activity.description}
				</p>
				<p className="text-muted-foreground/70">
					{formatTimestamp(activity.timestamp)}
				</p>
			</div>
		</div>
	);
});

ActivityListItem.displayName = 'ActivityListItem';

const CouncilMemberCard = memo<CouncilMemberCardProps>(({
	memberData,
	notifications,
	recentActivity,
	isActive,
	onCardClick,
	onWorkspaceAccess,
	className,
	loading = false,
	error = null
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [imageError, setImageError] = useState(false);
	const liveRegionRef = useRef<HTMLDivElement>(null);
	const prevStatusRef = useRef(memberData.currentStatus);

	// Media queries
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

	// Announce status changes to screen readers
	useEffect(() => {
		if (prevStatusRef.current !== memberData.currentStatus && liveRegionRef.current) {
			liveRegionRef.current.textContent = `${memberData.name} is now ${memberData.currentStatus}`;
			prevStatusRef.current = memberData.currentStatus;
		}
	}, [memberData.currentStatus, memberData.name]);

	// Get priority notification count by level
	const notificationCounts = useMemo(() => {
		const unreadNotifications = notifications.filter(n => !n.read);
		return {
			total: unreadNotifications.length,
			urgent: unreadNotifications.filter(n => n.priority === 'urgent').length,
			high: unreadNotifications.filter(n => n.priority === 'high').length,
			medium: unreadNotifications.filter(n => n.priority === 'medium').length
		};
	}, [notifications]);

	// Get status indicator configuration
	const statusIndicator = useMemo(() => {
		const configs = {
			speaking: {
				color: 'bg-red-500',
				icon: Mic,
				label: 'Speaking',
				pulse: true,
				showAudioLevel: true
			},
			active: {
				color: 'bg-green-500',
				icon: CheckCircle,
				label: 'Active',
				pulse: false,
				showAudioLevel: false
			},
			idle: {
				color: 'bg-yellow-500',
				icon: Clock,
				label: 'Idle',
				pulse: false,
				showAudioLevel: false
			},
			offline: {
				color: 'bg-gray-400',
				icon: MicOff,
				label: 'Offline',
				pulse: false,
				showAudioLevel: false
			}
		};

		return configs[memberData.currentStatus] || configs.offline;
	}, [memberData.currentStatus]);

	// Format timestamp for activity items
	const formatTimestamp = useCallback((timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return timestamp.toLocaleDateString();
	}, []);

	// Handle card click with proper event handling
	const handleCardClick = useCallback((event: React.MouseEvent) => {
		if ((event.target as HTMLElement).closest('button')) {
			return;
		}
		onCardClick?.(memberData.id);
	}, [onCardClick, memberData.id]);

	// Handle workspace access button click
	const handleWorkspaceClick = useCallback((event: React.MouseEvent) => {
		event.stopPropagation();
		onWorkspaceAccess?.(memberData.id);
	}, [onWorkspaceAccess, memberData.id]);

	const StatusIcon = statusIndicator.icon;
	const RoleIcon = roleIcons[memberData.role] || User;

	// Get initials for avatar fallback
	const initials = useMemo(() => {
		return memberData.name
			.split(' ')
			.map(part => part.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}, [memberData.name]);

	// Connection quality indicator
	const connectionIndicator = useMemo(() => {
		if (!memberData.connectionQuality || memberData.currentStatus === 'offline') return null;

		const configs = {
			excellent: { icon: Wifi, color: 'text-green-500', label: 'Excellent connection' },
			good: { icon: Wifi, color: 'text-yellow-500', label: 'Good connection' },
			poor: { icon: Wifi, color: 'text-orange-500', label: 'Poor connection' },
			disconnected: { icon: WifiOff, color: 'text-red-500', label: 'Disconnected' }
		};

		return configs[memberData.connectionQuality];
	}, [memberData.connectionQuality, memberData.currentStatus]);

	// Loading state
	if (loading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="h-12 w-12 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
						</div>
						<Skeleton className="h-8 w-8 rounded" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-4/5" />
						<Skeleton className="h-8 w-full mt-4" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// Error state
	if (error) {
		return (
			<Card className={cn("border-destructive", className)}>
				<CardContent className="flex items-center justify-center p-6">
					<div className="text-center space-y-2">
						<AlertCircle className="h-8 w-8 text-destructive mx-auto" />
						<p className="text-sm text-muted-foreground">{error}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<TooltipProvider>
			<Card
				className={cn(
					'relative cursor-pointer transition-all duration-200',
					'border-2 hover:border-primary/50 hover:shadow-lg',
					'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
					isActive && 'ring-2 ring-primary ring-offset-2',
					isHovered && 'scale-[1.02]',
					className
				)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={handleCardClick}
				role="button"
				tabIndex={0}
				aria-label={`Council member ${memberData.name}, ${memberData.role}, currently ${statusIndicator.label.toLowerCase()}. ${notificationCounts.total} unread notifications.`}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleCardClick(e as any);
					}
				}}
			>
				{/* Live region for status announcements */}
				<div
					ref={liveRegionRef}
					className="sr-only"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				/>

				{/* Notification badges */}
				{notificationCounts.total > 0 && (
					<div className="absolute -top-2 -right-2 z-10 flex gap-1">
						{notificationCounts.urgent > 0 && (
							<Badge
								variant="destructive"
								className="h-5 min-w-5 sm:h-6 sm:min-w-6 text-xs animate-pulse"
								aria-label={`${notificationCounts.urgent} urgent notifications`}
							>
								{notificationCounts.urgent}
							</Badge>
						)}
						{notificationCounts.high > 0 && (
							<Badge
								className="h-5 min-w-5 sm:h-6 sm:min-w-6 text-xs bg-orange-500 hover:bg-orange-600 text-white"
								aria-label={`${notificationCounts.high} high priority notifications`}
							>
								{notificationCounts.high}
							</Badge>
						)}
						{notificationCounts.medium > 0 && (
							<Badge
								variant="secondary"
								className="h-5 min-w-5 sm:h-6 sm:min-w-6 text-xs"
								aria-label={`${notificationCounts.medium} medium priority notifications`}
							>
								{notificationCounts.medium}
							</Badge>
						)}
					</div>
				)}

				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-2">
						{/* Avatar and basic info */}
						<div className="flex items-center gap-2 sm:gap-3 min-w-0">
							<div className="relative shrink-0">
								<Avatar className="h-10 w-10 sm:h-12 sm:w-12">
									{!imageError && memberData.avatar ? (
										<AvatarImage
											src={memberData.avatar}
											alt={`${memberData.name} avatar`}
											onError={() => setImageError(true)}
										/>
									) : (
										<AvatarFallback className="bg-primary/10 text-primary font-semibold">
											{initials}
										</AvatarFallback>
									)}
								</Avatar>

								{/* Status indicator with audio level */}
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="absolute -bottom-1 -right-1">
											<div
												className={cn(
													'h-4 w-4 rounded-full border-2 border-background flex items-center justify-center',
													statusIndicator.color,
													statusIndicator.pulse && 'animate-pulse'
												)}
												aria-label={`Status: ${statusIndicator.label}`}
											>
												<StatusIcon className="h-2 w-2 text-white" />
											</div>

											{/* Audio level indicator for speaking status */}
											{statusIndicator.showAudioLevel && memberData.audioLevel !== undefined && (
												<div
													className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
													style={{
														background: `conic-gradient(rgba(239, 68, 68, ${memberData.audioLevel / 100}) ${memberData.audioLevel * 3.6}deg, transparent 0deg)`
													}}
													aria-label={`Audio level: ${memberData.audioLevel}%`}
												/>
											)}
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<div className="space-y-1">
											<p>{statusIndicator.label}</p>
											{statusIndicator.showAudioLevel && memberData.audioLevel !== undefined && (
												<p className="text-xs">Audio: {memberData.audioLevel}%</p>
											)}
										</div>
									</TooltipContent>
								</Tooltip>

								{/* Connection quality indicator */}
								{connectionIndicator && (
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="absolute -top-1 -left-1">
												<connectionIndicator.icon
													className={cn("h-3 w-3", connectionIndicator.color)}
													aria-hidden="true"
												/>
											</div>
										</TooltipTrigger>
										<TooltipContent>
											<p>{connectionIndicator.label}</p>
										</TooltipContent>
									</Tooltip>
								)}
							</div>

							<div className="flex-1 min-w-0 space-y-0.5">
								<div className="flex items-center gap-2">
									<h3 className="font-semibold text-sm sm:text-base truncate" title={memberData.name}>
										{memberData.name}
									</h3>
									<RoleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" aria-hidden="true" />
								</div>
								<p className="text-xs sm:text-sm text-muted-foreground truncate" title={memberData.role}>
									{memberData.role}
								</p>
								<Tooltip>
									<TooltipTrigger asChild>
										<p className="text-xs text-muted-foreground/70 truncate flex items-center gap-1" title={memberData.genesisFile}>
											<FileText className="h-3 w-3" aria-hidden="true" />
											{memberData.genesisFile}
										</p>
									</TooltipTrigger>
									<TooltipContent>
										<p>Genesis File: {memberData.genesisFile}</p>
									</TooltipContent>
								</Tooltip>
							</div>
						</div>

						{/* Workspace access button */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size={isMobile ? "icon" : "sm"}
									className={cn(
										"shrink-0",
										isMobile ? "h-10 w-10" : "h-8 w-8 sm:h-9 sm:w-9"
									)}
									onClick={handleWorkspaceClick}
									aria-label={`Access ${memberData.name}'s private workspace`}
								>
									<Settings className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Private Workspace</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					{/* Recent activity feed */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
								<Activity className="h-3 w-3" />
								Recent Activity
							</div>
							{recentActivity.length > 3 && (
								<span className="text-xs text-muted-foreground">
									{recentActivity.length} total
								</span>
							)}
						</div>

						{recentActivity.length > 0 ? (
							<div
								className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
								role="list"
								aria-label="Recent activities"
							>
								{recentActivity.slice(0, 5).map((activity) => (
									<ActivityListItem
										key={activity.id}
										activity={activity}
										formatTimestamp={formatTimestamp}
									/>
								))}
							</div>
						) : (
							<p className="text-xs text-muted-foreground/70 italic py-2">
								No recent activity
							</p>
						)}
					</div>

					{/* Communication button */}
					<div className="mt-4 pt-3 border-t">
						<Button
							variant="outline"
							size="sm"
							className="w-full text-xs sm:text-sm h-8 sm:h-9"
							onClick={handleCardClick}
							aria-label={`Open communication interface with ${memberData.name}`}
						>
							<MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
							Open Communication
						</Button>
					</div>
				</CardContent>

				{/* Last seen indicator for offline members */}
				{memberData.currentStatus === 'offline' && memberData.lastSeen && (
					<div className="absolute bottom-2 right-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="text-xs text-muted-foreground/70 flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{formatTimestamp(memberData.lastSeen)}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>Last seen: {memberData.lastSeen.toLocaleString()}</p>
							</TooltipContent>
						</Tooltip>
					</div>
				)}
			</Card>
		</TooltipProvider>
	);
});

CouncilMemberCard.displayName = 'CouncilMemberCard';

export default CouncilMemberCard;

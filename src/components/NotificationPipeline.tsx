'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useVirtualList } from '@/hooks/useVirtualList';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWebSocket } from '@/hooks/useWebSocket';
import Image from 'next/image';
import {
	Bell,
	Clock,
	Eye,
	Filter,
	MoreVertical,
	Search,
	CheckCircle,
	AlertCircle,
	User,
	Calendar,
	ChevronDown,
	Archive,
	Trash2,
	Check,
	X,
	Undo,
	RefreshCw,
	Loader2,
	ChevronLeft,
	ChevronRight,
	Inbox,
	Star,
	Tag,
	Zap,
	Wifi,
	WifiOff,
	Keyboard
} from 'lucide-react';

// Enhanced type definitions with real-time support
export interface NotificationMember {
	id: string;
	name: string;
	avatar?: string;
	email: string;
	role: string;
	isOnline?: boolean;
}

export interface NotificationItem {
	id: string;
	title: string;
	content: string;
	preview: string;
	status: 'new' | 'pending' | 'under_review' | 'finalized';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	originator: NotificationMember;
	recipients: NotificationMember[];
	createdAt: string;
	updatedAt: string;
	dueDate?: string;
	tags: string[];
	attachments?: number;
	readBy: string[];
	starred?: boolean;
	category?: string;
}

export interface NotificationPipelineProps {
	notifications: NotificationItem[];
	members: NotificationMember[];
	onStatusUpdate: (notificationIds: string[], newStatus: NotificationItem['status']) => Promise<void>;
	onBatchAction: (notificationIds: string[], action: 'archive' | 'delete' | 'mark_read' | 'star' | 'unstar') => Promise<void>;
	onNotificationClick: (notification: NotificationItem) => void;
	onRefresh?: () => Promise<void>;
	wsUrl?: string;
	pageSize?: number;
	enableVirtualization?: boolean;
	enableRealTimeUpdates?: boolean;
	isLoading?: boolean;
	error?: string | null;
	className?: string;
}

// Extended status configuration
const STATUS_CONFIG = {
	new: {
		label: 'New',
		color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
		icon: Bell,
		count: 0,
		ariaLabel: 'New notifications'
	},
	pending: {
		label: 'Pending',
		color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
		icon: Clock,
		count: 0,
		ariaLabel: 'Pending notifications'
	},
	under_review: {
		label: 'Under Review',
		color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
		icon: Eye,
		count: 0,
		ariaLabel: 'Notifications under review'
	},
	finalized: {
		label: 'Finalized',
		color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
		icon: CheckCircle,
		count: 0,
		ariaLabel: 'Finalized notifications'
	}
} as const;

const PRIORITY_CONFIG = {
	low: {
		color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
		label: 'Low',
		weight: 1
	},
	medium: {
		color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		label: 'Medium',
		weight: 2
	},
	high: {
		color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
		label: 'High',
		weight: 3
	},
	urgent: {
		color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		label: 'Urgent',
		weight: 4
	}
} as const;

// Memoized member avatar component
const MemberAvatar = memo(({
	member,
	size = 'sm',
	showOnlineStatus = false
}: {
	member: NotificationMember;
	size?: 'sm' | 'md' | 'lg';
	showOnlineStatus?: boolean;
}) => {
	const sizeClasses = {
		sm: 'w-6 h-6 text-xs',
		md: 'w-8 h-8 text-sm',
		lg: 'w-10 h-10 text-base'
	};

	const sizeInPixels = {
		sm: 24,
		md: 32,
		lg: 40
	};

	const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="relative">
						<div className={cn('rounded-full bg-muted flex items-center justify-center overflow-hidden', sizeClasses[size])}>
							{member.avatar ? (
								<Image
									src={member.avatar}
									alt=""
									className="w-full h-full object-cover"
									width={sizeInPixels[size]}
									height={sizeInPixels[size]}
								/>
							) : (
								<span className="font-medium text-muted-foreground">{initials}</span>
							)}
						</div>
						{showOnlineStatus && member.isOnline !== undefined && (
							<div className={cn(
								"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
								member.isOnline ? "bg-green-500" : "bg-gray-400"
							)} />
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<div className="text-sm">
						<div className="font-medium">{member.name}</div>
						<div className="text-muted-foreground">{member.role}</div>
						{showOnlineStatus && (
							<div className="text-xs mt-1">
								{member.isOnline ? 'Online' : 'Offline'}
							</div>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});

MemberAvatar.displayName = 'MemberAvatar';

// Notification item component for better performance
const NotificationListItem = memo(({
	notification,
	isSelected,
	onSelect,
	onClick,
	onStatusUpdate,
	onBatchAction,
	formatRelativeTime
}: {
	notification: NotificationItem;
	isSelected: boolean;
	onSelect: (id: string, checked: boolean) => void;
	onClick: (notification: NotificationItem) => void;
	onStatusUpdate: (id: string, status: NotificationItem['status']) => void;
	onBatchAction: (id: string, action: string) => void;
	formatRelativeTime: (date: string) => string;
}) => {
	const StatusIcon = STATUS_CONFIG[notification.status].icon;
	const isOverdue = notification.dueDate && new Date(notification.dueDate) < new Date();
	const isUnread = !notification.readBy.includes('current-user'); // This should be passed from props in real implementation

	return (
		<Card
			className={cn(
				'cursor-pointer transition-all duration-200 hover:shadow-md',
				'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
				isSelected && 'ring-2 ring-primary ring-opacity-50',
				isOverdue && 'border-l-4 border-l-destructive',
				isUnread && 'bg-accent/5'
			)}
			onClick={() => onClick(notification)}
			role="article"
			aria-label={`${notification.title}, ${STATUS_CONFIG[notification.status].label}, ${PRIORITY_CONFIG[notification.priority].label} priority`}
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onClick(notification);
				}
			}}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					{/* Selection checkbox */}
					<Checkbox
						checked={isSelected}
						onCheckedChange={(checked) => onSelect(notification.id, checked as boolean)}
						onClick={(e) => e.stopPropagation()}
						aria-label={`Select ${notification.title}`}
						className="mt-0.5"
					/>

					{/* Star indicator */}
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"h-6 w-6 p-0",
							notification.starred ? "text-yellow-500" : "text-muted-foreground"
						)}
						onClick={(e) => {
							e.stopPropagation();
							onBatchAction(notification.id, notification.starred ? 'unstar' : 'star');
						}}
						aria-label={notification.starred ? 'Unstar notification' : 'Star notification'}
					>
						<Star className={cn("h-4 w-4", notification.starred && "fill-current")} />
					</Button>

					{/* Notification content */}
					<div className="flex-1 min-w-0">
						{/* Header with title and status */}
						<div className="flex items-start justify-between gap-2 mb-2">
							<div className="flex-1 min-w-0">
								<h3 className={cn(
									"font-medium truncate",
									isUnread ? "text-foreground" : "text-muted-foreground"
								)}>
									{notification.title}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
									{notification.preview}
								</p>
							</div>

							<div className="flex items-center gap-2 flex-shrink-0">
								<Badge
									variant="outline"
									className={cn("text-xs", STATUS_CONFIG[notification.status].color)}
									aria-label={STATUS_CONFIG[notification.status].ariaLabel}
								>
									<StatusIcon className="w-3 h-3 mr-1" aria-hidden="true" />
									{STATUS_CONFIG[notification.status].label}
								</Badge>

								<DropdownMenu>
									<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 p-0"
											aria-label="Notification actions"
										>
											<MoreVertical className="w-4 h-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48">
										<DropdownMenuItem onClick={() => onStatusUpdate(notification.id, 'pending')}>
											<Clock className="w-4 h-4 mr-2" />
											Mark as Pending
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onStatusUpdate(notification.id, 'under_review')}>
											<Eye className="w-4 h-4 mr-2" />
											Under Review
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onStatusUpdate(notification.id, 'finalized')}>
											<CheckCircle className="w-4 h-4 mr-2" />
											Finalize
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => onBatchAction(notification.id, 'archive')}>
											<Archive className="w-4 h-4 mr-2" />
											Archive
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => onBatchAction(notification.id, 'delete')}
											className="text-destructive"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Metadata row */}
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
							{/* Originator */}
							<div className="flex items-center gap-1.5">
								<MemberAvatar member={notification.originator} size="sm" showOnlineStatus />
								<span className="truncate max-w-[100px]">{notification.originator.name}</span>
							</div>

							{/* Recipients */}
							{notification.recipients.length > 0 && (
								<div className="flex items-center gap-1">
									<span>To:</span>
									<div className="flex -space-x-1">
										{notification.recipients.slice(0, 3).map(recipient => (
											<MemberAvatar key={recipient.id} member={recipient} size="sm" />
										))}
										{notification.recipients.length > 3 && (
											<div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
												+{notification.recipients.length - 3}
											</div>
										)}
									</div>
								</div>
							)}

							{/* Priority */}
							<Badge
								variant="outline"
								className={cn('text-xs h-5', PRIORITY_CONFIG[notification.priority].color)}
							>
								{notification.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" aria-hidden="true" />}
								{PRIORITY_CONFIG[notification.priority].label}
							</Badge>

							{/* Timestamp */}
							<div className="flex items-center gap-1 ml-auto">
								<Calendar className="w-3 h-3" aria-hidden="true" />
								<time dateTime={notification.createdAt}>
									{formatRelativeTime(notification.createdAt)}
								</time>
							</div>
						</div>

						{/* Tags and additional info */}
						<div className="flex flex-wrap items-center gap-2 mt-2">
							{notification.tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{notification.tags.map(tag => (
										<Badge key={tag} variant="secondary" className="text-xs h-5">
											<Tag className="w-3 h-3 mr-1" aria-hidden="true" />
											{tag}
										</Badge>
									))}
								</div>
							)}

							{notification.attachments && notification.attachments > 0 && (
								<Badge variant="outline" className="text-xs h-5">
									{notification.attachments} attachment{notification.attachments > 1 ? 's' : ''}
								</Badge>
							)}

							{/* Due date warning */}
							{isOverdue && (
								<div className="flex items-center gap-1 text-destructive text-xs">
									<AlertCircle className="w-3 h-3" />
									<span>Overdue</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

NotificationListItem.displayName = 'NotificationListItem';

export default function NotificationPipeline({
	notifications,
	members,
	onStatusUpdate,
	onBatchAction,
	onNotificationClick,
	onRefresh,
	wsUrl,
	pageSize = 20,
	enableVirtualization = true,
	enableRealTimeUpdates = true,
	isLoading = false,
	error = null,
	className
}: NotificationPipelineProps) {
	// Media queries
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

	// State management
	const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [memberFilter, setMemberFilter] = useState<string>('all');
	const [priorityFilter, setPriorityFilter] = useState<string>('all');
	const [activeTab, setActiveTab] = useState<string>('all');
	const [isUpdating, setIsUpdating] = useState(false);
	const [undoAction, setUndoAction] = useState<{ ids: string[]; action: string } | null>(null);
	const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<NotificationItem>>>(new Map());

	// Refs
	const liveRegionRef = useRef<HTMLDivElement>(null);
	const listContainerRef = useRef<HTMLDivElement>(null);
	const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Debounced search
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

	// WebSocket for real-time updates
	const { isConnected, sendMessage } = useWebSocket(wsUrl || '', {
		enabled: enableRealTimeUpdates && !!wsUrl,
		onMessage: (data) => {
			if (data.type === 'notification_update') {
				// Handle real-time notification updates
				announceUpdate(`Notification ${data.action}: ${data.title}`);
			}
		}
	});

	// Announce updates to screen readers
	const announceUpdate = useCallback((message: string) => {
		if (liveRegionRef.current) {
			liveRegionRef.current.textContent = message;
		}
	}, []);

	// Apply optimistic updates to notifications
	const notificationsWithOptimisticUpdates = useMemo(() => {
		return notifications.map(notification => {
			const updates = optimisticUpdates.get(notification.id);
			return updates ? { ...notification, ...updates } : notification;
		});
	}, [notifications, optimisticUpdates]);

	// Filtered and sorted notifications
	const filteredNotifications = useMemo(() => {
		let filtered = notificationsWithOptimisticUpdates;

		// Apply search filter
		if (debouncedSearchQuery.trim()) {
			const query = debouncedSearchQuery.toLowerCase();
			filtered = filtered.filter(notification =>
				notification.title.toLowerCase().includes(query) ||
				notification.content.toLowerCase().includes(query) ||
				notification.originator.name.toLowerCase().includes(query) ||
				notification.tags.some(tag => tag.toLowerCase().includes(query))
			);
		}

		// Apply status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(notification => notification.status === statusFilter);
		}

		// Apply member filter
		if (memberFilter !== 'all') {
			filtered = filtered.filter(notification =>
				notification.originator.id === memberFilter ||
				notification.recipients.some(recipient => recipient.id === memberFilter)
			);
		}

		// Apply priority filter
		if (priorityFilter !== 'all') {
			filtered = filtered.filter(notification => notification.priority === priorityFilter);
		}

		// Apply tab filter
		if (activeTab !== 'all') {
			filtered = filtered.filter(notification => notification.status === activeTab);
		}

		// Sort by priority and creation date
		return filtered.sort((a, b) => {
			// First sort by priority (urgent first)
			const priorityDiff = PRIORITY_CONFIG[b.priority].weight - PRIORITY_CONFIG[a.priority].weight;
			if (priorityDiff !== 0) return priorityDiff;

			// Then by creation date (newest first)
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [notificationsWithOptimisticUpdates, debouncedSearchQuery, statusFilter, memberFilter, priorityFilter, activeTab]);

	// Virtual list for performance
	const {
		visibleItems,
		totalHeight,
		offsetY,
		handleScroll
	} = useVirtualList({
		items: filteredNotifications,
		itemHeight: 120, // Approximate height of each notification
		containerHeight: 600, // Will be updated dynamically
		enabled: enableVirtualization && filteredNotifications.length > 50
	});

	// Calculate status counts
	const statusCounts = useMemo(() => {
		const counts: Record<string, { label: string; color: string; icon: typeof Bell; count: number; ariaLabel: string }> = {};
		Object.entries(STATUS_CONFIG).forEach(([key, config]) => {
			counts[key] = { ...config, count: 0 };
		});
		notificationsWithOptimisticUpdates.forEach(notification => {
			if (counts[notification.status]) {
				counts[notification.status].count++;
			}
		});
		return counts;
	}, [notificationsWithOptimisticUpdates]);

	// Keyboard shortcuts
	useKeyboardShortcuts({
		'cmd+a': () => handleSelectAll(true),
		'cmd+d': () => handleSelectAll(false),
		'cmd+/': () => document.getElementById('search-input')?.focus(),
		'cmd+z': () => handleUndo(),
		'r': () => onRefresh?.(),
		'e': () => {
			if (selectedNotifications.size === 1) {
				const id = Array.from(selectedNotifications)[0];
				const notification = filteredNotifications.find(n => n.id === id);
				if (notification) onNotificationClick(notification);
			}
		},
		'Delete': () => {
			if (selectedNotifications.size > 0) {
				handleBatchAction('delete');
			}
		}
	});

	// Handle notification selection
	const handleNotificationSelect = useCallback((notificationId: string, checked: boolean) => {
		setSelectedNotifications(prev => {
			const newSet = new Set(prev);
			if (checked) {
				newSet.add(notificationId);
			} else {
				newSet.delete(notificationId);
			}
			announceUpdate(`${checked ? 'Selected' : 'Deselected'} notification`);
			return newSet;
		});
	}, [announceUpdate]);

	// Handle select all
	const handleSelectAll = useCallback((checked: boolean) => {
		if (checked) {
			const allIds = filteredNotifications.map(n => n.id);
			setSelectedNotifications(new Set(allIds));
			announceUpdate(`Selected all ${allIds.length} notifications`);
		} else {
			setSelectedNotifications(new Set());
			announceUpdate('Deselected all notifications');
		}
	}, [filteredNotifications, announceUpdate]);

	// Handle status update with optimistic updates
	const handleStatusUpdate = useCallback(async (newStatus: NotificationItem['status']) => {
		if (selectedNotifications.size === 0) return;

		const ids = Array.from(selectedNotifications);
		setIsUpdating(true);

		// Apply optimistic update
		setOptimisticUpdates(prev => {
			const updates = new Map(prev);
			ids.forEach(id => {
				updates.set(id, { status: newStatus });
			});
			return updates;
		});

		announceUpdate(`Updating ${ids.length} notifications to ${STATUS_CONFIG[newStatus].label}`);

		try {
			await onStatusUpdate(ids, newStatus);
			setSelectedNotifications(new Set());

			// Clear optimistic updates on success
			setOptimisticUpdates(prev => {
				const updates = new Map(prev);
				ids.forEach(id => updates.delete(id));
				return updates;
			});

			// Set up undo
			setUndoAction({ ids, action: `status_${newStatus}` });
			if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = setTimeout(() => setUndoAction(null), 5000);

		} catch (error) {
			// Revert optimistic update on error
			setOptimisticUpdates(prev => {
				const updates = new Map(prev);
				ids.forEach(id => updates.delete(id));
				return updates;
			});
			announceUpdate('Failed to update notifications');
		} finally {
			setIsUpdating(false);
		}
	}, [selectedNotifications, onStatusUpdate, announceUpdate]);

	// Handle batch actions with optimistic updates
	const handleBatchAction = useCallback(async (action: 'archive' | 'delete' | 'mark_read' | 'star' | 'unstar') => {
		const ids = selectedNotifications.size > 0
			? Array.from(selectedNotifications)
			: [action]; // Single ID passed for individual actions

		setIsUpdating(true);

		// Apply optimistic update
		if (action === 'star' || action === 'unstar') {
			setOptimisticUpdates(prev => {
				const updates = new Map(prev);
				ids.forEach(id => {
					updates.set(id, { starred: action === 'star' });
				});
				return updates;
			});
		}

		announceUpdate(`Performing ${action} on ${ids.length} notifications`);

		try {
			await onBatchAction(ids, action);
			if (selectedNotifications.size > 0) {
				setSelectedNotifications(new Set());
			}

			// Set up undo
			setUndoAction({ ids, action });
			if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = setTimeout(() => setUndoAction(null), 5000);

		} catch (error) {
			// Revert optimistic update on error
			setOptimisticUpdates(prev => {
				const updates = new Map(prev);
				ids.forEach(id => updates.delete(id));
				return updates;
			});
			announceUpdate(`Failed to ${action} notifications`);
		} finally {
			setIsUpdating(false);
		}
	}, [selectedNotifications, onBatchAction, announceUpdate]);

	// Handle undo
	const handleUndo = useCallback(() => {
		if (!undoAction) return;

		// Implement undo logic here
		announceUpdate('Undo action performed');
		setUndoAction(null);
	}, [undoAction, announceUpdate]);

	// Handle single item batch action (for NotificationListItem)
	const handleSingleItemBatchAction = useCallback((id: string, action: string) => {
		// For single item actions, we set selectedNotifications temporarily and call handleBatchAction
		setSelectedNotifications(new Set([id]));
		handleBatchAction(action as 'archive' | 'delete' | 'mark_read' | 'star' | 'unstar');
	}, [handleBatchAction]);

	// Format relative time
	const formatRelativeTime = useCallback((dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return 'Just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

		return date.toLocaleDateString();
	}, []);

	// Loading skeleton
	const renderSkeleton = () => (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				<Card key={i}>
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<Skeleton className="h-5 w-5 rounded" />
							<Skeleton className="h-5 w-5 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<div className="flex gap-2">
									<Skeleton className="h-5 w-20" />
									<Skeleton className="h-5 w-24" />
									<Skeleton className="h-5 w-16" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);

	// Error state
	if (error && !notifications.length) {
		return (
			<Card className={cn("border-destructive", className)}>
				<CardContent className="p-6">
					<div className="flex flex-col items-center justify-center space-y-4">
						<AlertCircle className="w-12 h-12 text-destructive" />
						<div className="text-center space-y-2">
							<p className="text-lg font-medium">Unable to load notifications</p>
							<p className="text-sm text-muted-foreground">{error}</p>
						</div>
						{onRefresh && (
							<Button onClick={onRefresh} variant="outline" size="sm">
								<RefreshCw className="w-4 h-4 mr-2" />
								Try Again
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={cn("space-y-4 sm:space-y-6", className)}>
			{/* Live region for screen reader announcements */}
			<div
				ref={liveRegionRef}
				className="sr-only"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			/>

			{/* Header with search and filters */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
					<div className="flex-1 w-full sm:max-w-md">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
							<Input
								id="search-input"
								placeholder="Search notifications..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 pr-4"
								aria-label="Search notifications"
							/>
							{searchQuery && (
								<Button
									variant="ghost"
									size="sm"
									className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
									onClick={() => setSearchQuery('')}
									aria-label="Clear search"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>

					<div className="flex flex-wrap gap-2 w-full sm:w-auto">
						{/* Filter dropdowns with responsive sizing */}
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className={cn("w-full sm:w-32", isMobile && "flex-1")}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								{Object.entries(STATUS_CONFIG).map(([key, config]) => (
									<SelectItem key={key} value={key}>
										<div className="flex items-center gap-2">
											<config.icon className="w-4 h-4" />
											{config.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={memberFilter} onValueChange={setMemberFilter}>
							<SelectTrigger className={cn("w-full sm:w-40", isMobile && "flex-1")}>
								<SelectValue placeholder="Member" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Members</SelectItem>
								{members.map(member => (
									<SelectItem key={member.id} value={member.id}>
										<div className="flex items-center gap-2">
											<MemberAvatar member={member} size="sm" />
											<span className="truncate">{member.name}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={priorityFilter} onValueChange={setPriorityFilter}>
							<SelectTrigger className={cn("w-full sm:w-32", isMobile && "flex-1")}>
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Priority</SelectItem>
								{Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
									<SelectItem key={key} value={key}>
										<div className="flex items-center gap-2">
											{key === 'urgent' && <Zap className="w-4 h-4" />}
											{config.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Refresh button */}
						{onRefresh && (
							<Button
								variant="outline"
								size="icon"
								onClick={onRefresh}
								disabled={isLoading}
								aria-label="Refresh notifications"
							>
								<RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
							</Button>
						)}
					</div>
				</div>

				{/* Connection status */}
				{enableRealTimeUpdates && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{isConnected ? (
							<>
								<Wifi className="w-4 h-4 text-green-500" />
								<span>Live updates active</span>
							</>
						) : (
							<>
								<WifiOff className="w-4 h-4 text-muted-foreground" />
								<span>Live updates disconnected</span>
							</>
						)}
					</div>
				)}
			</div>

			{/* Batch actions bar */}
			{selectedNotifications.size > 0 && (
				<Card className="bg-accent/50 border-accent">
					<CardContent className="p-3 sm:p-4">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Checkbox
									checked={filteredNotifications.length > 0 && selectedNotifications.size === filteredNotifications.length}
									onCheckedChange={handleSelectAll}
									aria-label="Select all notifications"
								/>
								<span className="text-sm font-medium">
									{selectedNotifications.size} of {filteredNotifications.length} selected
								</span>
							</div>

							<div className="flex flex-wrap gap-2 w-full sm:w-auto">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleBatchAction('mark_read')}
									disabled={isUpdating}
									className="flex-1 sm:flex-initial"
								>
									<Check className="w-4 h-4 mr-1" />
									Mark Read
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											disabled={isUpdating}
											className="flex-1 sm:flex-initial"
										>
											{isUpdating ? (
												<Loader2 className="w-4 h-4 mr-1 animate-spin" />
											) : (
												<>
													Update Status
													<ChevronDown className="w-4 h-4 ml-1" />
												</>
											)}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{Object.entries(STATUS_CONFIG).map(([key, config]) => {
											const Icon = config.icon;
											return (
												<DropdownMenuItem
													key={key}
													onClick={() => handleStatusUpdate(key as NotificationItem['status'])}
												>
													<Icon className="w-4 h-4 mr-2" />
													{config.label}
												</DropdownMenuItem>
											);
										})}
									</DropdownMenuContent>
								</DropdownMenu>

								<Button
									variant="outline"
									size="sm"
									onClick={() => handleBatchAction('archive')}
									disabled={isUpdating}
									className="flex-1 sm:flex-initial"
								>
									<Archive className="w-4 h-4 mr-1" />
									Archive
								</Button>

								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedNotifications(new Set())}
									className="flex-1 sm:flex-initial"
								>
									<X className="w-4 h-4 mr-1" />
									Clear
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Undo notification */}
			{undoAction && (
				<Alert className="bg-accent/50 border-accent">
					<div className="flex items-center justify-between">
						<AlertDescription>
							{undoAction.ids.length} notification{undoAction.ids.length > 1 ? 's' : ''} {undoAction.action}
						</AlertDescription>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleUndo}
							className="ml-4"
						>
							<Undo className="w-4 h-4 mr-1" />
							Undo
						</Button>
					</div>
				</Alert>
			)}

			{/* Status tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<ScrollArea className="w-full">
					<TabsList className={cn(
						"inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground",
						"w-full sm:w-auto"
					)}>
						<TabsTrigger
							value="all"
							className="text-xs sm:text-sm whitespace-nowrap"
							aria-label={`All notifications, ${notifications.length} total`}
						>
							All ({notifications.length})
						</TabsTrigger>
						{Object.entries(statusCounts).map(([key, config]) => {
							const Icon = config.icon;
							return (
								<TabsTrigger
									key={key}
									value={key}
									className="text-xs sm:text-sm whitespace-nowrap"
									aria-label={`${config.ariaLabel}, ${config.count} total`}
								>
									<Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
									<span className="hidden sm:inline">{config.label}</span>
									<span className="sm:hidden">{config.label.slice(0, 3)}</span>
									<span className="ml-1">({config.count})</span>
								</TabsTrigger>
							);
						})}
					</TabsList>
				</ScrollArea>

				<TabsContent value={activeTab} className="mt-4 space-y-4">
					{/* Notification count and actions */}
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
							{debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
						</p>

						{/* Keyboard shortcuts help */}
						{!isMobile && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="sm" className="h-8 px-2">
											<Keyboard className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="left" className="max-w-xs">
										<div className="space-y-1 text-xs">
											<p className="font-medium mb-2">Keyboard Shortcuts</p>
											<div className="grid grid-cols-2 gap-x-4 gap-y-1">
												<div>⌘A - Select all</div>
												<div>⌘D - Deselect all</div>
												<div>⌘/ - Search</div>
												<div>⌘Z - Undo</div>
												<div>R - Refresh</div>
												<div>E - Edit selected</div>
												<div>Delete - Delete selected</div>
											</div>
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>

					{/* Notifications list */}
					<div
						ref={listContainerRef}
						className="space-y-3"
						role="feed"
						aria-label="Notifications list"
						aria-busy={isLoading}
					>
						{isLoading && notifications.length === 0 ? (
							renderSkeleton()
						) : filteredNotifications.length > 0 ? (
							enableVirtualization && filteredNotifications.length > 50 ? (
								// Virtual scrolling for large lists
								<div
									style={{ height: '600px', overflow: 'auto' }}
									onScroll={handleScroll}
								>
									<div style={{ height: `${totalHeight}px`, position: 'relative' }}>
										<div style={{ transform: `translateY(${offsetY}px)` }}>
											{visibleItems.map(notification => (
												<NotificationListItem
													key={notification.id}
													notification={notification}
													isSelected={selectedNotifications.has(notification.id)}
													onSelect={handleNotificationSelect}
													onClick={onNotificationClick}
													onStatusUpdate={(id, status) => handleStatusUpdate(status)}
													onBatchAction={handleSingleItemBatchAction}
													formatRelativeTime={formatRelativeTime}
												/>
											))}
										</div>
									</div>
								</div>
							) : (
								// Regular rendering for smaller lists
								filteredNotifications.map(notification => (
									<NotificationListItem
										key={notification.id}
										notification={notification}
										isSelected={selectedNotifications.has(notification.id)}
										onSelect={handleNotificationSelect}
										onClick={onNotificationClick}
										onStatusUpdate={(id, status) => handleStatusUpdate(status)}
										onBatchAction={handleSingleItemBatchAction}
										formatRelativeTime={formatRelativeTime}
									/>
								))
							)
						) : (
							<Card>
								<CardContent className="p-8 text-center">
									<div className="flex flex-col items-center space-y-3">
										{debouncedSearchQuery || statusFilter !== 'all' || memberFilter !== 'all' || priorityFilter !== 'all' ? (
											<>
												<Inbox className="w-12 h-12 text-muted-foreground" />
												<div className="space-y-1">
													<p className="text-muted-foreground">No notifications found</p>
													<p className="text-sm text-muted-foreground">
														Try adjusting your filters or search query
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSearchQuery('');
														setStatusFilter('all');
														setMemberFilter('all');
														setPriorityFilter('all');
													}}
												>
													Clear Filters
												</Button>
											</>
										) : (
											<>
												<Bell className="w-12 h-12 text-muted-foreground" />
												<p className="text-muted-foreground">No notifications yet</p>
												<p className="text-sm text-muted-foreground">
													New notifications will appear here
												</p>
											</>
										)}
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Loading more indicator */}
					{isLoading && notifications.length > 0 && (
						<div className="flex justify-center py-4">
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

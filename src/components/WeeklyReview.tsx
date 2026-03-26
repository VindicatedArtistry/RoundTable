'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
	AlertTriangle,
	CheckCircle,
	XCircle,
	TrendingUp,
	Download,
	Calendar,
	Database,
	Clock,
	Target,
	Award,
	AlertCircle
} from 'lucide-react';

interface Activity {
	id: string;
	title: string;
	description: string;
	type: 'task' | 'meeting' | 'decision' | 'learning';
	status: 'completed' | 'failed' | 'partial';
	timestamp: Date;
	tags: string[];
	impact: 'high' | 'medium' | 'low';
	duration?: number;
}

interface Decision {
	id: string;
	title: string;
	description: string;
	rationale: string;
	outcome: 'positive' | 'negative' | 'neutral';
	impact: 'high' | 'medium' | 'low';
	timestamp: Date;
	stakeholders: string[];
	followUpRequired: boolean;
}

interface CacheItem {
	key: string;
	type: 'api' | 'component' | 'static' | 'database';
	size: number;
	hitRate: number;
	lastAccessed: Date;
	expiresAt?: Date;
	shouldCache: boolean;
	canRemove: boolean;
	recommendation: string;
}

interface Improvement {
	id: string;
	category: 'process' | 'technical' | 'team' | 'product';
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
	estimatedEffort: string;
	expectedImpact: string;
	assignee?: string;
	dueDate?: Date;
}

interface WeeklyReviewData {
	weekStart: Date;
	weekEnd: Date;
	activities: Activity[];
	decisions: Decision[];
	accomplishments: string[];
	failures: string[];
	improvements: Improvement[];
	cacheReport: CacheItem[];
	metrics: {
		totalTasks: number;
		completedTasks: number;
		totalDecisions: number;
		cacheHitRate: number;
		productivityScore: number;
	};
}

interface WeeklyReviewProps {
	data: WeeklyReviewData;
	onExport: (format: 'pdf' | 'json' | 'csv') => void;
	isLoading?: boolean;
	error?: string;
}

const WeeklyReview: React.FC<WeeklyReviewProps> = ({
	data,
	onExport,
	isLoading = false,
	error
}) => {
	const [activeTab, setActiveTab] = useState('overview');
	const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');

	// Format date range for display
	const dateRange = useMemo(() => {
		const start = data.weekStart.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
		const end = data.weekEnd.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		return `${start} - ${end}`;
	}, [data.weekStart, data.weekEnd]);

	// Calculate completion rate
	const completionRate = useMemo(() => {
		if (data.metrics.totalTasks === 0) return 0;
		return Math.round((data.metrics.completedTasks / data.metrics.totalTasks) * 100);
	}, [data.metrics.totalTasks, data.metrics.completedTasks]);

	// Group activities by status
	const activityStats = useMemo(() => {
		const stats = data.activities.reduce(
			(acc, activity) => {
				acc[activity.status]++;
				return acc;
			},
			{ completed: 0, failed: 0, partial: 0 }
		);
		return stats;
	}, [data.activities]);

	// Group cache items by recommendation
	const cacheStats = useMemo(() => {
		const totalSize = data.cacheReport.reduce((sum, item) => sum + item.size, 0);
		const canRemoveSize = data.cacheReport
			.filter(item => item.canRemove)
			.reduce((sum, item) => sum + item.size, 0);
		const shouldCacheCount = data.cacheReport.filter(item => item.shouldCache && !item.key).length;

		return {
			totalSize: totalSize / (1024 * 1024), // Convert to MB
			canRemoveSize: canRemoveSize / (1024 * 1024),
			shouldCacheCount,
			avgHitRate: data.cacheReport.reduce((sum, item) => sum + item.hitRate, 0) / data.cacheReport.length
		};
	}, [data.cacheReport]);

	// Get status icon and color for activities
	const getStatusIcon = (status: Activity['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" aria-label="Completed" />;
			case 'failed':
				return <XCircle className="h-4 w-4 text-red-500" aria-label="Failed" />;
			case 'partial':
				return <AlertCircle className="h-4 w-4 text-yellow-500" aria-label="Partial" />;
		}
	};

	// Get impact badge variant
	const getImpactVariant = (impact: 'high' | 'medium' | 'low') => {
		switch (impact) {
			case 'high':
				return 'destructive';
			case 'medium':
				return 'default';
			case 'low':
				return 'secondary';
		}
	};

	// Handle export functionality
	const handleExport = () => {
		onExport(exportFormat);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64" role="status" aria-label="Loading weekly review">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (error) {
		return (
			<Card className="border-red-200 bg-red-50">
				<CardContent className="p-6">
					<div className="flex items-center gap-2 text-red-700">
						<AlertTriangle className="h-5 w-5" />
						<span>Error loading weekly review: {error}</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Weekly Review</h1>
					<div className="flex items-center gap-2 text-muted-foreground mt-1">
						<Calendar className="h-4 w-4" />
						<span>{dateRange}</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<select
						value={exportFormat}
						onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'json' | 'csv')}
						className="px-3 py-2 border border-input rounded-md text-sm bg-background"
						aria-label="Export format"
					>
						<option value="pdf">PDF</option>
						<option value="json">JSON</option>
						<option value="csv">CSV</option>
					</select>
					<Button onClick={handleExport} className="gap-2">
						<Download className="h-4 w-4" />
						Export
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Task Completion</p>
								<p className="text-2xl font-bold">{completionRate}%</p>
							</div>
							<Target className="h-8 w-8 text-blue-500" />
						</div>
						<Progress value={completionRate} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Decisions Made</p>
								<p className="text-2xl font-bold">{data.metrics.totalDecisions}</p>
							</div>
							<CheckCircle className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
								<p className="text-2xl font-bold">{Math.round(data.metrics.cacheHitRate)}%</p>
							</div>
							<Database className="h-8 w-8 text-purple-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
								<p className="text-2xl font-bold">{data.metrics.productivityScore}/100</p>
							</div>
							<TrendingUp className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Review Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="activities">Activities</TabsTrigger>
					<TabsTrigger value="decisions">Decisions</TabsTrigger>
					<TabsTrigger value="cache">Cache Report</TabsTrigger>
					<TabsTrigger value="improvements">Improvements</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Accomplishments */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Award className="h-5 w-5 text-green-500" />
									Accomplishments
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-40">
									<ul className="space-y-2">
										{data.accomplishments.map((accomplishment, index) => (
											<li key={index} className="flex items-start gap-2 text-sm">
												<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
												<span>{accomplishment}</span>
											</li>
										))}
									</ul>
								</ScrollArea>
							</CardContent>
						</Card>

						{/* Failures & Lessons */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-red-500" />
									Failures & Lessons
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-40">
									<ul className="space-y-2">
										{data.failures.map((failure, index) => (
											<li key={index} className="flex items-start gap-2 text-sm">
												<XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
												<span>{failure}</span>
											</li>
										))}
									</ul>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>

					{/* Activity Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Activity Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-4 text-center">
								<div>
									<p className="text-2xl font-bold text-green-600">{activityStats.completed}</p>
									<p className="text-sm text-muted-foreground">Completed</p>
								</div>
								<div>
									<p className="text-2xl font-bold text-yellow-600">{activityStats.partial}</p>
									<p className="text-sm text-muted-foreground">Partial</p>
								</div>
								<div>
									<p className="text-2xl font-bold text-red-600">{activityStats.failed}</p>
									<p className="text-sm text-muted-foreground">Failed</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="activities" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Weekly Activities</CardTitle>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{data.activities.map((activity) => (
										<div key={activity.id} className="border rounded-lg p-4 space-y-2">
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2">
													{getStatusIcon(activity.status)}
													<h4 className="font-medium">{activity.title}</h4>
												</div>
												<div className="flex items-center gap-2">
													<Badge variant={getImpactVariant(activity.impact)}>
														{activity.impact}
													</Badge>
													<Badge variant="outline">{activity.type}</Badge>
												</div>
											</div>
											<p className="text-sm text-muted-foreground">{activity.description}</p>
											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<div className="flex items-center gap-2">
													<Clock className="h-3 w-3" />
													<span>{activity.timestamp.toLocaleDateString()}</span>
												</div>
												{activity.duration && (
													<span>{activity.duration} minutes</span>
												)}
											</div>
											{activity.tags.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{activity.tags.map((tag, index) => (
														<Badge key={index} variant="secondary" className="text-xs">
															{tag}
														</Badge>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="decisions" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Key Decisions</CardTitle>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{data.decisions.map((decision) => (
										<div key={decision.id} className="border rounded-lg p-4 space-y-3">
											<div className="flex items-start justify-between">
												<h4 className="font-medium">{decision.title}</h4>
												<div className="flex items-center gap-2">
													<Badge variant={getImpactVariant(decision.impact)}>
														{decision.impact}
													</Badge>
													<Badge
														variant={decision.outcome === 'positive' ? 'default' :
															decision.outcome === 'negative' ? 'destructive' : 'secondary'}
													>
														{decision.outcome}
													</Badge>
												</div>
											</div>
											<p className="text-sm text-muted-foreground">{decision.description}</p>
											<div className="space-y-2">
												<div>
													<p className="text-xs font-medium text-muted-foreground">Rationale:</p>
													<p className="text-sm">{decision.rationale}</p>
												</div>
												{decision.stakeholders.length > 0 && (
													<div>
														<p className="text-xs font-medium text-muted-foreground">Stakeholders:</p>
														<div className="flex flex-wrap gap-1 mt-1">
															{decision.stakeholders.map((stakeholder, index) => (
																<Badge key={index} variant="outline" className="text-xs">
																	{stakeholder}
																</Badge>
															))}
														</div>
													</div>
												)}
												{decision.followUpRequired && (
													<Badge variant="destructive" className="text-xs">
														Follow-up Required
													</Badge>
												)}
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="cache" className="space-y-4">
					{/* Cache Overview */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="text-center">
									<p className="text-2xl font-bold">{cacheStats.totalSize.toFixed(1)} MB</p>
									<p className="text-sm text-muted-foreground">Total Cache Size</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-6">
								<div className="text-center">
									<p className="text-2xl font-bold text-red-600">{cacheStats.canRemoveSize.toFixed(1)} MB</p>
									<p className="text-sm text-muted-foreground">Can Be Removed</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-6">
								<div className="text-center">
									<p className="text-2xl font-bold text-green-600">{cacheStats.shouldCacheCount}</p>
									<p className="text-sm text-muted-foreground">Should Cache</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Detailed Cache Report */}
					<Card>
						<CardHeader>
							<CardTitle>Cache Analysis</CardTitle>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-96">
								<div className="space-y-3">
									{data.cacheReport.map((item, index) => (
										<div key={index} className="border rounded-lg p-3 space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Badge variant="outline">{item.type}</Badge>
													<span className="font-mono text-sm">{item.key || 'New Item'}</span>
												</div>
												<div className="flex items-center gap-2">
													{item.canRemove && (
														<Badge variant="destructive" className="text-xs">Remove</Badge>
													)}
													{item.shouldCache && (
														<Badge variant="default" className="text-xs">Should Cache</Badge>
													)}
												</div>
											</div>
											<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
												<div>Size: {(item.size / 1024).toFixed(1)} KB</div>
												<div>Hit Rate: {item.hitRate.toFixed(1)}%</div>
												<div>Last Accessed: {item.lastAccessed.toLocaleDateString()}</div>
												{item.expiresAt && (
													<div>Expires: {item.expiresAt.toLocaleDateString()}</div>
												)}
											</div>
											<p className="text-sm">{item.recommendation}</p>
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="improvements" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Improvement Suggestions</CardTitle>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{data.improvements.map((improvement) => (
										<div key={improvement.id} className="border rounded-lg p-4 space-y-3">
											<div className="flex items-start justify-between">
												<h4 className="font-medium">{improvement.title}</h4>
												<div className="flex items-center gap-2">
													<Badge variant={getImpactVariant(improvement.priority)}>
														{improvement.priority}
													</Badge>
													<Badge variant="outline">{improvement.category}</Badge>
												</div>
											</div>
											<p className="text-sm text-muted-foreground">{improvement.description}</p>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
												<div>
													<p className="font-medium text-muted-foreground">Estimated Effort:</p>
													<p>{improvement.estimatedEffort}</p>
												</div>
												<div>
													<p className="font-medium text-muted-foreground">Expected Impact:</p>
													<p>{improvement.expectedImpact}</p>
												</div>
											</div>
											{(improvement.assignee || improvement.dueDate) && (
												<Separator />
											)}
											<div className="flex items-center justify-between text-sm">
												{improvement.assignee && (
													<span>Assignee: {improvement.assignee}</span>
												)}
												{improvement.dueDate && (
													<span>Due: {improvement.dueDate.toLocaleDateString()}</span>
												)}
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default WeeklyReview;
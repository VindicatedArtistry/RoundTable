import { EventEmitter } from 'events';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import cron from 'node-cron';
import { surrealDBService } from '../services/surrealdb-service';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';


interface GraphUsageMetrics {
	totalQueries: number;
	avgResponseTime: number;
	errorRate: number;
	peakUsageHour: number;
	topEndpoints: Array<{
		endpoint: string;
		count: number;
		avgTime: number;
	}>;
	memoryUsage: {
		heap: number;
		external: number;
		rss: number;
	};
}

interface CachePerformanceMetrics {
	hitRate: number;
	missRate: number;
	evictionRate: number;
	avgAccessTime: number;
	totalCacheSize: number;
	topMissedKeys: string[];
	cacheEfficiencyScore: number;
}

interface CouncilEfficiencyMetrics {
	totalDecisions: number;
	avgDecisionTime: number;
	consensusRate: number;
	participationRate: number;
	nodeReliability: Array<{
		nodeId: string;
		uptime: number;
		responseTime: number;
		reliability: number;
	}>;
	governanceScore: number;
}

interface OptimizationReport {
	id: string;
	timestamp: Date;
	graphMetrics: GraphUsageMetrics;
	cacheMetrics: CachePerformanceMetrics;
	councilMetrics: CouncilEfficiencyMetrics;
	insights: OptimizationInsight[];
	recommendations: Recommendation[];
	performanceScore: number;
	reportHash: string;
}

interface OptimizationInsight {
	category: 'performance' | 'efficiency' | 'reliability' | 'governance';
	severity: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	impact: string;
	metrics: Record<string, number>;
}

interface Recommendation {
	priority: 'low' | 'medium' | 'high';
	category: string;
	action: string;
	expectedImpact: string;
	implementationComplexity: 'low' | 'medium' | 'high';
	estimatedTimeToComplete: string;
}

interface NotificationChannel {
	type: 'email' | 'slack' | 'webhook' | 'database';
	config: Record<string, any>;
	enabled: boolean;
}

const OptimizationConfigSchema = z.object({
	enabled: z.boolean().default(true),
	cronSchedule: z.string().default('0 0 * * 5'), // Every Friday at midnight
	retentionDays: z.number().min(1).max(365).default(30),
	thresholds: z.object({
		responseTimeWarning: z.number().default(1000),
		errorRateWarning: z.number().default(0.05),
		cacheHitRateWarning: z.number().default(0.8),
		uptimeWarning: z.number().default(0.95)
	}),
	notifications: z.array(z.object({
		type: z.enum(['email', 'slack', 'webhook', 'database']),
		config: z.record(z.string(), z.any()),
		enabled: z.boolean()
	})).default([])
});

type OptimizationConfig = z.infer<typeof OptimizationConfigSchema>;

class WeeklyOptimizer extends EventEmitter {
	private surrealDBService = surrealDBService;
	private config: OptimizationConfig;
	private cronJob: cron.ScheduledTask | null = null;
	private isRunning: boolean = false;
	private reportDirectory: string;

	constructor(config: Partial<OptimizationConfig> = {}) {
		super();
		this.config = OptimizationConfigSchema.parse(config);
		this.reportDirectory = process.env.REPORTS_DIR || './reports/weekly-optimization';
		this.initialize();
	}

	/**
	 * Initialize the weekly optimizer with cron scheduling
	 */
	private async initialize(): Promise<void> {
		try {
			await mkdir(this.reportDirectory, { recursive: true });

			if (this.config.enabled) {
				this.scheduleOptimization();
			}

			this.emit('initialized', {
				schedule: this.config.cronSchedule,
				enabled: this.config.enabled
			});
		} catch (error) {
			this.emit('error', {
				phase: 'initialization',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Schedule the weekly optimization run using cron
	 */
	private scheduleOptimization(): void {
		if (this.cronJob) {
			this.cronJob.stop();
		}

		this.cronJob = cron.schedule(this.config.cronSchedule, async () => {
			try {
				await this.runOptimization();
			} catch (error) {
				this.emit('error', {
					phase: 'scheduled-run',
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}, {
			scheduled: true,
			timezone: process.env.TZ || 'UTC'
		});

		console.log(`Weekly optimization scheduled: ${this.config.cronSchedule}`);
	}

	/**
	 * Run the complete optimization analysis
	 */
	public async runOptimization(): Promise<OptimizationReport> {
		if (this.isRunning) {
			throw new Error('Optimization is already running');
		}

		this.isRunning = true;
		const startTime = performance.now();

		try {
			this.emit('started', { timestamp: new Date() });

			const reportId = this.generateReportId();
			const timestamp = new Date();

			// Collect metrics in parallel for better performance
			const [graphMetrics, cacheMetrics, councilMetrics] = await Promise.all([
				this.collectGraphMetrics(),
				this.collectCacheMetrics(),
				this.collectCouncilMetrics()
			]);

			// Generate insights and recommendations
			const insights = this.generateInsights(graphMetrics, cacheMetrics, councilMetrics);
			const recommendations = this.generateRecommendations(insights);
			const performanceScore = this.calculatePerformanceScore(graphMetrics, cacheMetrics, councilMetrics);

			const report: OptimizationReport = {
				id: reportId,
				timestamp,
				graphMetrics,
				cacheMetrics,
				councilMetrics,
				insights,
				recommendations,
				performanceScore,
				reportHash: this.generateReportHash({
					graphMetrics,
					cacheMetrics,
					councilMetrics,
					performanceScore
				})
			};

			// Save report and notify
			await this.saveReport(report);
			await this.notifyCompletion(report);
			await this.cleanupOldReports();

			const duration = performance.now() - startTime;
			this.emit('completed', {
				reportId,
				duration: Math.round(duration),
				performanceScore
			});

			return report;
		} catch (error) {
			this.emit('error', {
				phase: 'optimization-run',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Collect graph usage metrics from Redis and system monitoring
	 */
	private async collectGraphMetrics(): Promise<GraphUsageMetrics> {
		try {
			const weeklyKey = `graph:metrics:weekly:${this.getWeekKey()}`;
			const endpointKey = `graph:endpoints:weekly:${this.getWeekKey()}`;

			const [
				totalQueries,
				totalResponseTime,
				totalErrors,
				hourlyData,
				endpointData,
				memoryInfo
			] = await Promise.all([
				this.surrealDBService.getCache(`${weeklyKey}:queries`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:response_time`).then(val => parseFloat(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:errors`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:hourly`).then(val => val || {}),
				this.surrealDBService.getCache(`${endpointKey}:count`).then(val => val || []),
				this.getMemoryUsage()
			]);

			const avgResponseTime = totalQueries > 0 ? totalResponseTime / totalQueries : 0;
			const errorRate = totalQueries > 0 ? totalErrors / totalQueries : 0;

			// Find peak usage hour
			const peakUsageHour = this.findPeakHour(hourlyData);

			// Process top endpoints
			const topEndpoints = await this.processTopEndpoints(endpointData);

			return {
				totalQueries,
				avgResponseTime,
				errorRate,
				peakUsageHour,
				topEndpoints,
				memoryUsage: memoryInfo
			};
		} catch (error) {
			throw new Error(`Failed to collect graph metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Collect cache performance metrics
	 */
	private async collectCacheMetrics(): Promise<CachePerformanceMetrics> {
		try {
			const weeklyKey = `cache:metrics:weekly:${this.getWeekKey()}`;

			const [
				hits,
				misses,
				evictions,
				totalAccessTime,
				totalAccesses,
				memoryInfo,
				missedKeys
			] = await Promise.all([
				this.surrealDBService.getCache(`${weeklyKey}:hits`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:misses`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:evictions`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:access_time`).then(val => parseFloat(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:accesses`).then(val => parseInt(val || '0')),
				this.getMemoryUsage(),
				this.surrealDBService.getCache(`${weeklyKey}:missed_keys`).then(val => val || [])
			]);

			const totalCacheOps = hits + misses;
			const hitRate = totalCacheOps > 0 ? hits / totalCacheOps : 0;
			const missRate = totalCacheOps > 0 ? misses / totalCacheOps : 0;
			const evictionRate = totalCacheOps > 0 ? evictions / totalCacheOps : 0;
			const avgAccessTime = totalAccesses > 0 ? totalAccessTime / totalAccesses : 0;

			// Get cache size from memory info
			const cacheSize = memoryInfo.heap + memoryInfo.external;
			const cacheEfficiencyScore = this.calculateCacheEfficiency(hitRate, avgAccessTime, evictionRate);

			return {
				hitRate,
				missRate,
				evictionRate,
				avgAccessTime,
				totalCacheSize: cacheSize,
				topMissedKeys: missedKeys,
				cacheEfficiencyScore
			};
		} catch (error) {
			throw new Error(`Failed to collect cache metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Collect council efficiency metrics
	 */
	private async collectCouncilMetrics(): Promise<CouncilEfficiencyMetrics> {
		try {
			const weeklyKey = `council:metrics:weekly:${this.getWeekKey()}`;

			const [
				totalDecisions,
				totalDecisionTime,
				consensusDecisions,
				participationData,
				nodeData
			] = await Promise.all([
				this.surrealDBService.getCache(`${weeklyKey}:decisions`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:decision_time`).then(val => parseFloat(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:consensus`).then(val => parseInt(val || '0')),
				this.surrealDBService.getCache(`${weeklyKey}:participation`).then(val => val || {}),
				this.surrealDBService.getCache(`${weeklyKey}:nodes`).then(val => val || {})
			]);

			const avgDecisionTime = totalDecisions > 0 ? totalDecisionTime / totalDecisions : 0;
			const consensusRate = totalDecisions > 0 ? consensusDecisions / totalDecisions : 0;
			const participationRate = this.calculateParticipationRate(participationData);
			const nodeReliability = await this.calculateNodeReliability(nodeData);
			const governanceScore = this.calculateGovernanceScore(consensusRate, participationRate, nodeReliability);

			return {
				totalDecisions,
				avgDecisionTime,
				consensusRate,
				participationRate,
				nodeReliability,
				governanceScore
			};
		} catch (error) {
			throw new Error(`Failed to collect council metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Generate actionable insights based on collected metrics
	 */
	private generateInsights(
		graphMetrics: GraphUsageMetrics,
		cacheMetrics: CachePerformanceMetrics,
		councilMetrics: CouncilEfficiencyMetrics
	): OptimizationInsight[] {
		const insights: OptimizationInsight[] = [];

		// Graph performance insights
		if (graphMetrics.avgResponseTime > this.config.thresholds.responseTimeWarning) {
			insights.push({
				category: 'performance',
				severity: graphMetrics.avgResponseTime > this.config.thresholds.responseTimeWarning * 2 ? 'high' : 'medium',
				title: 'High Graph Response Times',
				description: `Average response time of ${Math.round(graphMetrics.avgResponseTime)}ms exceeds recommended threshold`,
				impact: 'User experience degradation and potential timeout issues',
				metrics: {
					currentResponseTime: graphMetrics.avgResponseTime,
					threshold: this.config.thresholds.responseTimeWarning
				}
			});
		}

		if (graphMetrics.errorRate > this.config.thresholds.errorRateWarning) {
			insights.push({
				category: 'reliability',
				severity: graphMetrics.errorRate > this.config.thresholds.errorRateWarning * 2 ? 'critical' : 'high',
				title: 'High Error Rate',
				description: `Error rate of ${(graphMetrics.errorRate * 100).toFixed(2)}% indicates system reliability issues`,
				impact: 'Service availability and user trust concerns',
				metrics: {
					currentErrorRate: graphMetrics.errorRate,
					threshold: this.config.thresholds.errorRateWarning
				}
			});
		}

		// Cache performance insights
		if (cacheMetrics.hitRate < this.config.thresholds.cacheHitRateWarning) {
			insights.push({
				category: 'efficiency',
				severity: cacheMetrics.hitRate < this.config.thresholds.cacheHitRateWarning * 0.5 ? 'high' : 'medium',
				title: 'Low Cache Hit Rate',
				description: `Cache hit rate of ${(cacheMetrics.hitRate * 100).toFixed(2)}% suggests inefficient caching strategy`,
				impact: 'Increased database load and slower response times',
				metrics: {
					currentHitRate: cacheMetrics.hitRate,
					threshold: this.config.thresholds.cacheHitRateWarning
				}
			});
		}

		// Council governance insights
		const avgNodeUptime = councilMetrics.nodeReliability.reduce((sum, node) => sum + node.uptime, 0) / councilMetrics.nodeReliability.length;
		if (avgNodeUptime < this.config.thresholds.uptimeWarning) {
			insights.push({
				category: 'governance',
				severity: avgNodeUptime < this.config.thresholds.uptimeWarning * 0.9 ? 'critical' : 'high',
				title: 'Low Node Reliability',
				description: `Average node uptime of ${(avgNodeUptime * 100).toFixed(2)}% affects consensus reliability`,
				impact: 'Governance instability and potential decision delays',
				metrics: {
					currentUptime: avgNodeUptime,
					threshold: this.config.thresholds.uptimeWarning
				}
			});
		}

		return insights;
	}

	/**
	 * Generate recommendations based on insights
	 */
	private generateRecommendations(insights: OptimizationInsight[]): Recommendation[] {
		const recommendations: Recommendation[] = [];

		insights.forEach(insight => {
			switch (insight.category) {
				case 'performance':
					if (insight.title.includes('Response Times')) {
						recommendations.push({
							priority: insight.severity === 'high' ? 'high' : 'medium',
							category: 'Performance Optimization',
							action: 'Implement query optimization and consider adding database indexes for frequently accessed data',
							expectedImpact: 'Reduce response times by 30-50%',
							implementationComplexity: 'medium',
							estimatedTimeToComplete: '1-2 weeks'
						});
					}
					break;

				case 'efficiency':
					if (insight.title.includes('Cache Hit Rate')) {
						recommendations.push({
							priority: 'high',
							category: 'Cache Strategy',
							action: 'Review cache TTL settings and implement preemptive caching for popular queries',
							expectedImpact: 'Improve cache hit rate to 85%+',
							implementationComplexity: 'low',
							estimatedTimeToComplete: '3-5 days'
						});
					}
					break;

				case 'reliability':
					recommendations.push({
						priority: 'high',
						category: 'System Reliability',
						action: 'Implement circuit breakers and improve error handling mechanisms',
						expectedImpact: 'Reduce error rate by 60-80%',
						implementationComplexity: 'medium',
						estimatedTimeToComplete: '1-2 weeks'
					});
					break;

				case 'governance':
					recommendations.push({
						priority: 'high',
						category: 'Infrastructure',
						action: 'Upgrade node infrastructure and implement automated failover mechanisms',
						expectedImpact: 'Improve node reliability to 99%+',
						implementationComplexity: 'high',
						estimatedTimeToComplete: '2-4 weeks'
					});
					break;
			}
		});

		return recommendations;
	}

	/**
	 * Calculate overall performance score
	 */
	private calculatePerformanceScore(
		graphMetrics: GraphUsageMetrics,
		cacheMetrics: CachePerformanceMetrics,
		councilMetrics: CouncilEfficiencyMetrics
	): number {
		const responseTimeScore = Math.max(0, 100 - (graphMetrics.avgResponseTime / this.config.thresholds.responseTimeWarning) * 50);
		const errorRateScore = Math.max(0, 100 - (graphMetrics.errorRate / this.config.thresholds.errorRateWarning) * 100);
		const cacheScore = cacheMetrics.hitRate * 100;
		const governanceScore = councilMetrics.governanceScore;

		return Math.round((responseTimeScore + errorRateScore + cacheScore + governanceScore) / 4);
	}

	/**
	 * Save optimization report to file system and Redis
	 */
	private async saveReport(report: OptimizationReport): Promise<void> {
		try {
			const fileName = `optimization-report-${report.id}.json`;
			const filePath = join(this.reportDirectory, fileName);

			// Save to file system
			await writeFile(filePath, JSON.stringify(report, null, 2));

			// Save metadata to SurrealDB cache for quick access
			const metadataKey = `optimization:reports:${report.id}`;
			await this.surrealDBService.setCache(metadataKey, {
				id: report.id,
				timestamp: report.timestamp,
				performanceScore: report.performanceScore,
				reportHash: report.reportHash,
				filePath
			}, 60 * 60 * 24 * this.config.retentionDays);

			// Add to timeline cache for chronological access
			const timeline = await this.surrealDBService.getCache('optimization:reports:timeline') || [];
			timeline.push({
				timestamp: report.timestamp.getTime(),
				id: report.id
			});
			await this.surrealDBService.setCache('optimization:reports:timeline', timeline);

		} catch (error) {
			throw new Error(`Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Notify configured channels about optimization completion
	 */
	private async notifyCompletion(report: OptimizationReport): Promise<void> {
		const notifications = this.config.notifications.filter(n => n.enabled);

		await Promise.allSettled(notifications.map(async (notification) => {
			try {
				switch (notification.type) {
					case 'webhook':
						await this.sendWebhookNotification(notification.config, report);
						break;
					case 'database':
						await this.saveDatabaseNotification(notification.config, report);
						break;
					case 'email':
						// Email notification would require additional email service integration
						console.log('Email notification configured but not implemented');
						break;
					case 'slack':
						// Slack notification would require Slack API integration
						console.log('Slack notification configured but not implemented');
						break;
				}
			} catch (error) {
				this.emit('error', {
					phase: 'notification',
					type: notification.type,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}));
	}

	/**
	 * Send webhook notification
	 */
	private async sendWebhookNotification(config: Record<string, any>, report: OptimizationReport): Promise<void> {
		if (!config.url) {
			throw new Error('Webhook URL not configured');
		}

		const payload = {
			type: 'optimization_report',
			reportId: report.id,
			timestamp: report.timestamp,
			performanceScore: report.performanceScore,
			summary: {
				totalInsights: report.insights.length,
				criticalIssues: report.insights.filter(i => i.severity === 'critical').length,
				recommendations: report.recommendations.length
			}
		};

		const response = await fetch(config.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(config.headers || {})
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			throw new Error(`Webhook notification failed: ${response.status} ${response.statusText}`);
		}
	}

	/**
	 * Save notification to database (Redis in this case)
	 */
	private async saveDatabaseNotification(config: Record<string, any>, report: OptimizationReport): Promise<void> {
		const notificationKey = `notifications:optimization:${report.id}`;

		await this.surrealDBService.setCache(notificationKey, {
			type: 'optimization_report',
			reportId: report.id,
			timestamp: report.timestamp,
			performanceScore: report.performanceScore,
			status: 'sent',
			summary: {
				totalInsights: report.insights.length,
				criticalIssues: report.insights.filter(i => i.severity === 'critical').length,
				recommendations: report.recommendations.length
			}
		}, 60 * 60 * 24 * 7); // 7 days TTL
	}

	/**
	 * Clean up old reports based on retention policy
	 */
	private async cleanupOldReports(): Promise<void> {
		try {
			const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);

			// Get timeline from cache
			const timeline = await this.surrealDBService.getCache<Array<{ timestamp: number; id: string }>>('optimization:reports:timeline') || [];

			// Filter out old reports
			const activeTimeline = timeline.filter(item => item.timestamp >= cutoffTime);
			const activeReportIds = new Set(activeTimeline.map(item => item.id));

			// Update timeline cache
			await this.surrealDBService.setCache('optimization:reports:timeline', activeTimeline);

			// Clean up orphaned metadata
			// Note: In SurrealDB, we can query for all optimization report cache entries
			const allReports = await this.surrealDBService.query<Array<{ key: string }>>(
				"SELECT key FROM cache WHERE key LIKE 'optimization:reports:%'"
			);

			if (allReports.success && allReports.data) {
				for (const report of allReports.data) {
					const reportId = report.key.split(':').pop();
					if (reportId && !activeReportIds.has(reportId)) {
						await this.surrealDBService.deleteCache(report.key);
					}
				}
			}

		} catch (error) {
			this.emit('error', {
				phase: 'cleanup',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	// Helper methods

	private generateReportId(): string {
		const timestamp = new Date().toISOString().split('T')[0];
		const random = Math.random().toString(36).substring(7);
		return `${timestamp}-${random}`;
	}

	private getWeekKey(): string {
		const now = new Date();
		const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
		return startOfWeek.toISOString().split('T')[0];
	}

	private generateReportHash(data: any): string {
		return createHash('sha256')
			.update(JSON.stringify(data))
			.digest('hex')
			.substring(0, 16);
	}

	private async getMemoryUsage(): Promise<{ heap: number; external: number; rss: number }> {
		const memUsage = process.memoryUsage();
		return {
			heap: memUsage.heapUsed,
			external: memUsage.external,
			rss: memUsage.rss
		};
	}

	private findPeakHour(hourlyData: Record<string, string>): number {
		let maxHour = 0;
		let maxValue = 0;

		Object.entries(hourlyData).forEach(([hour, value]) => {
			const numValue = parseInt(value);
			if (numValue > maxValue) {
				maxValue = numValue;
				maxHour = parseInt(hour);
			}
		});

		return maxHour;
	}

	private async processTopEndpoints(endpointData: string[]): Promise<Array<{ endpoint: string; count: number; avgTime: number }>> {
		const endpoints = [];

		for (let i = 0; i < endpointData.length; i += 2) {
			const endpoint = endpointData[i];
			const count = parseInt(endpointData[i + 1] || '0');

			// Get average time for this endpoint from cache
			const avgTimeKey = `graph:endpoints:weekly:${this.getWeekKey()}:${endpoint}:avg_time`;
			const avgTimeValue = await this.surrealDBService.getCache<string>(avgTimeKey);
			const avgTime = parseFloat(avgTimeValue || '0');

			endpoints.push({ endpoint, count, avgTime });
		}

		return endpoints;
	}

	private parseCacheSize(cacheInfo: string): number {
		const match = cacheInfo.match(/used_memory:(\d+)/);
		return match ? parseInt(match[1]) : 0;
	}

	private calculateCacheEfficiency(hitRate: number, avgAccessTime: number, evictionRate: number): number {
		const hitRateScore = hitRate * 100;
		const accessTimeScore = Math.max(0, 100 - avgAccessTime);
		const evictionScore = Math.max(0, 100 - (evictionRate * 1000));

		return Math.round((hitRateScore + accessTimeScore + evictionScore) / 3);
	}

	private calculateParticipationRate(participationData: Record<string, string>): number {
		if (Object.keys(participationData).length === 0) return 0;

		const totalParticipation = Object.values(participationData)
			.reduce((sum, value) => sum + parseFloat(value), 0);

		return totalParticipation / Object.keys(participationData).length;
	}

	private async calculateNodeReliability(nodeData: Record<string, string>): Promise<Array<{
		nodeId: string;
		uptime: number;
		responseTime: number;
		reliability: number;
	}>> {
		const reliability = [];

		for (const [nodeId, data] of Object.entries(nodeData)) {
			const nodeInfo = JSON.parse(data);
			const reliabilityScore = (nodeInfo.uptime * 0.6) + ((1 - Math.min(nodeInfo.responseTime / 1000, 1)) * 0.4);

			reliability.push({
				nodeId,
				uptime: nodeInfo.uptime,
				responseTime: nodeInfo.responseTime,
				reliability: reliabilityScore
			});
		}

		return reliability;
	}

	private calculateGovernanceScore(consensusRate: number, participationRate: number, nodeReliability: Array<{ reliability: number }>): number {
		const avgReliability = nodeReliability.length > 0
			? nodeReliability.reduce((sum, node) => sum + node.reliability, 0) / nodeReliability.length
			: 0;

		return Math.round((consensusRate * 40) + (participationRate * 30) + (avgReliability * 30));
	}

	/**
	 * Get the current optimization status
	 */
	public getStatus(): { isRunning: boolean; lastRun?: Date; nextRun?: Date } {
		return {
			isRunning: this.isRunning
			// node-cron doesn't provide next execution time, so nextRun is omitted
		};
	}

	/**
	 * Update optimizer configuration
	 */
	public updateConfig(newConfig: Partial<OptimizationConfig>): void {
		this.config = OptimizationConfigSchema.parse({ ...this.config, ...newConfig });

		if (newConfig.cronSchedule || newConfig.enabled !== undefined) {
			if (this.config.enabled) {
				this.scheduleOptimization();
			} else if (this.cronJob) {
				this.cronJob.stop();
				this.cronJob = null;
			}
		}

		this.emit('config-updated', this.config);
	}

	/**
	 * Manually trigger optimization (useful for testing or immediate analysis)
	 */
	public async triggerOptimization(): Promise<OptimizationReport> {
		return this.runOptimization();
	}

	/**
	 * Gracefully shutdown the optimizer
	 */
	public async shutdown(): Promise<void> {
		if (this.cronJob) {
			this.cronJob.stop();
			this.cronJob = null;
		}

		if (this.isRunning) {
			// Wait for current optimization to complete
			await new Promise(resolve => {
				const checkInterval = setInterval(() => {
					if (!this.isRunning) {
						clearInterval(checkInterval);
						resolve(void 0);
					}
				}, 1000);
			});
		}

		this.emit('shutdown');
	}
}

export {
	WeeklyOptimizer,
	type OptimizationReport,
	type OptimizationInsight,
	type Recommendation,
	type GraphUsageMetrics
};

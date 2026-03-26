/**
 * Metrics Service - Provides metrics collection and reporting for TheRoundTable
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsService');

export interface MetricEvent {
	name: string;
	value: number;
	timestamp: Date;
	labels: Record<string, string>;
}

export interface ProposalMetric {
	proposalId: string;
	stage: string;
	timestamp: Date;
	duration?: number;
}

export class MetricsService {
	private readonly metrics: MetricEvent[] = [];
	private readonly proposalMetrics: Map<string, ProposalMetric[]> = new Map();

	/**
	 * Record a generic metric
	 */
	record(name: string, value: number, labels: Record<string, string> = {}): void {
		const event: MetricEvent = {
			name,
			value,
			timestamp: new Date(),
			labels
		};
		this.metrics.push(event);
		logger.debug('Metric recorded', { name, value, labels });
	}

	/**
	 * Record proposal stage change
	 */
	async recordProposalStageChange(proposalId: string, previousStage: string, newStage: string): Promise<void> {
		const metric: ProposalMetric = {
			proposalId,
			stage: newStage,
			timestamp: new Date()
		};

		if (!this.proposalMetrics.has(proposalId)) {
			this.proposalMetrics.set(proposalId, []);
		}
		this.proposalMetrics.get(proposalId)!.push(metric);

		this.record('proposal.stage.change', 1, {
			proposalId,
			previousStage,
			newStage
		});

		logger.info('Proposal stage change recorded', { proposalId, previousStage, newStage });
	}

	/**
	 * Record collaboration activity
	 */
	async recordCollaborationActivity(proposalId: string, memberId: string): Promise<void> {
		this.record('proposal.collaboration.activity', 1, {
			proposalId,
			memberId
		});
		logger.debug('Collaboration activity recorded', { proposalId, memberId });
	}

	/**
	 * Record approval
	 */
	async recordApproval(proposalId: string, approverId: string, approved: boolean): Promise<void> {
		this.record('proposal.approval', approved ? 1 : 0, {
			proposalId,
			approverId,
			approved: String(approved)
		});
		logger.debug('Approval recorded', { proposalId, approverId, approved });
	}

	/**
	 * Get metrics for a time range
	 */
	getMetrics(startDate: Date, endDate: Date, name?: string): MetricEvent[] {
		return this.metrics.filter(m => {
			const inRange = m.timestamp >= startDate && m.timestamp <= endDate;
			const matchesName = !name || m.name === name;
			return inRange && matchesName;
		});
	}

	/**
	 * Get proposal metrics
	 */
	getProposalMetrics(proposalId: string): ProposalMetric[] {
		return this.proposalMetrics.get(proposalId) || [];
	}

	/**
	 * Calculate average duration between stages
	 */
	calculateAverageStageDuration(proposalId: string): Record<string, number> {
		const metrics = this.getProposalMetrics(proposalId);
		const durations: Record<string, number> = {};

		for (let i = 1; i < metrics.length; i++) {
			const stage = metrics[i - 1].stage;
			const duration = metrics[i].timestamp.getTime() - metrics[i - 1].timestamp.getTime();
			durations[stage] = duration;
		}

		return durations;
	}

	/**
	 * Get summary statistics
	 */
	getSummary(): {
		totalEvents: number;
		proposalsTracked: number;
		eventsByName: Record<string, number>;
	} {
		const eventsByName: Record<string, number> = {};
		this.metrics.forEach(m => {
			eventsByName[m.name] = (eventsByName[m.name] || 0) + 1;
		});

		return {
			totalEvents: this.metrics.length,
			proposalsTracked: this.proposalMetrics.size,
			eventsByName
		};
	}
}

export const metricsService = new MetricsService();

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import { createLogger, LoggerInterface } from '../utils/logger';
import { DatabaseService } from './database.service';
import { NotificationService } from './notification.service';
import { ValidationService } from './validation.service';
import { AuthService } from './auth.service';
import { MetricsService } from './metrics.service';

export interface ProposalMember {
	id: string;
	name: string;
	role: 'initiator' | 'collaborator' | 'reviewer' | 'approver';
	department: string;
	permissions: string[];
	joinedAt: Date;
}

export interface ProposalDocument {
	id: string;
	title: string;
	content: string;
	version: number;
	author: string;
	lastModified: Date;
	comments: ProposalComment[];
}

export interface ProposalComment {
	id: string;
	authorId: string;
	content: string;
	timestamp: Date;
	type: 'suggestion' | 'question' | 'approval' | 'rejection';
	resolved: boolean;
}

export interface ProposalMetrics {
	totalDuration: number;
	stageCompletionTimes: Record<ProposalStage, number>;
	collaboratorCount: number;
	revisionCount: number;
	approvalRate: number;
	qualityScore: number;
}

export type ProposalStage =
	| 'initiation'
	| 'research'
	| 'collaboration'
	| 'review'
	| 'approval'
	| 'finalization'
	| 'completed'
	| 'rejected';

export type ProposalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProposalWorkflow {
	stage: ProposalStage;
	requiredApprovals: number;
	currentApprovals: number;
	approvers: string[];
	blockers: string[];
	deadline?: Date;
	autoAdvance: boolean;
}

export interface Proposal {
	id: string;
	title: string;
	description: string;
	initiatorId: string;
	stage: ProposalStage;
	priority: ProposalPriority;
	workflow: ProposalWorkflow;
	members: ProposalMember[];
	documents: ProposalDocument[];
	tags: string[];
	metadata: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
	metrics: ProposalMetrics;
	version: number;
}

export interface ProposalHistoryEntry {
	id: string;
	proposalId: string;
	action: string;
	actorId: string;
	previousValue: any;
	newValue: any;
	timestamp: Date;
	metadata: Record<string, any>;
}

export interface ProposalSearchCriteria {
	stage?: ProposalStage;
	priority?: ProposalPriority;
	initiatorId?: string;
	tags?: string[];
	dateRange?: { start: Date; end: Date };
	keyword?: string;
}

export class ProposalOrchestratorService extends EventEmitter {
	private readonly logger: LoggerInterface;
	private readonly db: DatabaseService;
	private readonly notification: NotificationService;
	private readonly validation: ValidationService;
	private readonly auth: AuthService;
	private readonly metrics: MetricsService;
	private stageTransitions: Map<ProposalStage, ProposalStage[]>;
	private readonly workflowTimeouts: Map<string, NodeJS.Timeout>;

	constructor(
		logger: LoggerInterface,
		db: DatabaseService,
		notification: NotificationService,
		validation: ValidationService,
		auth: AuthService,
		metrics: MetricsService
	) {
		super();
		this.logger = logger;
		this.db = db;
		this.notification = notification;
		this.validation = validation;
		this.auth = auth;
		this.metrics = metrics;
		this.stageTransitions = new Map();
		this.workflowTimeouts = new Map();
		this.initializeStageTransitions();
		this.setupEventHandlers();
	}

	/**
	 * Initialize valid stage transitions for proposal workflow
	 */
	private initializeStageTransitions(): void {
		this.stageTransitions = new Map([
			['initiation', ['research', 'rejected']],
			['research', ['collaboration', 'initiation', 'rejected']],
			['collaboration', ['review', 'research', 'rejected']],
			['review', ['approval', 'collaboration', 'rejected']],
			['approval', ['finalization', 'review', 'rejected']],
			['finalization', ['completed', 'approval']],
			['completed', []],
			['rejected', ['initiation']]
		]);
	}

	/**
	 * Setup event handlers for proposal lifecycle events
	 */
	private setupEventHandlers(): void {
		this.on('proposal:stage-changed', this.handleStageChange.bind(this));
		this.on('proposal:member-added', this.handleMemberAdded.bind(this));
		this.on('proposal:approval-received', this.handleApprovalReceived.bind(this));
		this.on('proposal:deadline-approaching', this.handleDeadlineApproaching.bind(this));
	}

	/**
	 * Create a new proposal with initial configuration
	 */
	async createProposal(
		data: {
			title: string;
			description: string;
			priority: ProposalPriority;
			tags?: string[];
			deadline?: Date;
			metadata?: Record<string, any>;
		},
		initiatorId: string
	): Promise<Proposal> {
		try {
			// Validate input data
			this.validateProposalData(data);

			// Sanitize input
			const sanitizedData = this.sanitizeProposalInput(data);

			// Verify initiator permissions
			await this.auth.verifyPermission(initiatorId, 'proposal:create');

			const proposalId = uuidv4();
			const now = new Date();

			const proposal: Proposal = {
				id: proposalId,
				title: sanitizedData.title,
				description: sanitizedData.description,
				initiatorId,
				stage: 'initiation',
				priority: sanitizedData.priority,
				workflow: {
					stage: 'initiation',
					requiredApprovals: this.getRequiredApprovals(sanitizedData.priority),
					currentApprovals: 0,
					approvers: [],
					blockers: [],
					deadline: sanitizedData.deadline,
					autoAdvance: false
				},
				members: [{
					id: initiatorId,
					name: await this.getUserName(initiatorId),
					role: 'initiator',
					department: await this.getUserDepartment(initiatorId),
					permissions: ['read', 'write', 'invite', 'approve'],
					joinedAt: now
				}],
				documents: [],
				tags: sanitizedData.tags || [],
				metadata: sanitizedData.metadata || {},
				createdAt: now,
				updatedAt: now,
				metrics: {
					totalDuration: 0,
					stageCompletionTimes: {} as Record<ProposalStage, number>,
					collaboratorCount: 1,
					revisionCount: 0,
					approvalRate: 0,
					qualityScore: 0
				},
				version: 1
			};

			// Save to database
			await this.db.proposals.create(proposal);

			// Record history
			await this.recordHistory(proposalId, 'created', initiatorId, null, proposal);

			// Set up deadline monitoring if applicable
			if (sanitizedData.deadline) {
				this.scheduleDeadlineNotification(proposalId, sanitizedData.deadline);
			}

			// Emit creation event
			this.emit('proposal:created', proposal);

			this.logger.info(`Proposal created: ${proposalId}`, {
				proposalId,
				initiatorId,
				priority: sanitizedData.priority
			});

			return proposal;
		} catch (error) {
			this.logger.error('Failed to create proposal', { error, initiatorId });
			throw error;
		}
	}

	/**
	 * Add a member to a proposal with specific role and permissions
	 */
	async addMember(
		proposalId: string,
		memberId: string,
		role: ProposalMember['role'],
		actorId: string
	): Promise<void> {
		try {
			// Verify actor permissions
			await this.verifyProposalPermission(proposalId, actorId, 'invite');

			const proposal = await this.getProposal(proposalId);

			// Check if member already exists
			if (proposal.members.some(m => m.id === memberId)) {
				throw new Error('Member already exists in proposal');
			}

			const newMember: ProposalMember = {
				id: memberId,
				name: await this.getUserName(memberId),
				role,
				department: await this.getUserDepartment(memberId),
				permissions: this.getRolePermissions(role),
				joinedAt: new Date()
			};

			proposal.members.push(newMember);
			proposal.metrics.collaboratorCount = proposal.members.length;
			proposal.updatedAt = new Date();
			proposal.version++;

			await this.db.proposals.update(proposalId, proposal);
			await this.recordHistory(proposalId, 'member-added', actorId, null, newMember);

			// Notify the new member
			await this.notification.send({
				userId: memberId,
				type: 'proposal_invitation',
				title: 'Proposal Invitation',
				content: `You have been invited to collaborate on proposal: ${proposal.title}`,
				metadata: { proposalId, role }
			});

			this.emit('proposal:member-added', { proposal, member: newMember, actorId });

			this.logger.info(`Member added to proposal`, {
				proposalId,
				memberId,
				role,
				actorId
			});
		} catch (error) {
			this.logger.error('Failed to add member to proposal', {
				error,
				proposalId,
				memberId,
				actorId
			});
			throw error;
		}
	}

	/**
	 * Advance proposal to next stage in workflow
	 */
	async advanceStage(proposalId: string, actorId: string): Promise<void> {
		try {
			await this.verifyProposalPermission(proposalId, actorId, 'approve');

			const proposal = await this.getProposal(proposalId);
			const currentStage = proposal.stage;
			const validTransitions = this.stageTransitions.get(currentStage) || [];

			if (validTransitions.length === 0) {
				throw new Error(`Cannot advance from stage: ${currentStage}`);
			}

			// Determine next stage based on workflow logic
			const nextStage = this.determineNextStage(proposal, validTransitions);

			// Verify stage advancement requirements
			await this.verifyStageRequirements(proposal, nextStage);

			const previousStage = proposal.stage;
			proposal.stage = nextStage;
			proposal.workflow.stage = nextStage;
			proposal.updatedAt = new Date();
			proposal.version++;

			// Record stage completion time
			const stageStartTime = await this.getStageStartTime(proposalId, currentStage);
			const stageDuration = Date.now() - stageStartTime;
			proposal.metrics.stageCompletionTimes[currentStage] = stageDuration;

			// Reset workflow counters for new stage
			if (nextStage !== 'completed' && nextStage !== 'rejected') {
				proposal.workflow.currentApprovals = 0;
				proposal.workflow.approvers = [];
				proposal.workflow.requiredApprovals = this.getRequiredApprovals(proposal.priority, nextStage);
			}

			if (nextStage === 'completed') {
				proposal.completedAt = new Date();
				proposal.metrics.totalDuration = proposal.completedAt.getTime() - proposal.createdAt.getTime();
			}

			await this.db.proposals.update(proposalId, proposal);
			await this.recordHistory(proposalId, 'stage-advanced', actorId, previousStage, nextStage);

			this.emit('proposal:stage-changed', {
				proposal,
				previousStage,
				newStage: nextStage,
				actorId
			});

			this.logger.info(`Proposal stage advanced`, {
				proposalId,
				previousStage,
				newStage: nextStage,
				actorId
			});
		} catch (error) {
			this.logger.error('Failed to advance proposal stage', {
				error,
				proposalId,
				actorId
			});
			throw error;
		}
	}

	/**
	 * Submit approval for a proposal
	 */
	async submitApproval(
		proposalId: string,
		approverId: string,
		approved: boolean,
		comments?: string
	): Promise<void> {
		try {
			await this.verifyProposalPermission(proposalId, approverId, 'approve');

			const proposal = await this.getProposal(proposalId);

			// Check if already approved by this user
			if (proposal.workflow.approvers.includes(approverId)) {
				throw new Error('User has already submitted approval for this proposal');
			}

			if (approved) {
				proposal.workflow.approvers.push(approverId);
				proposal.workflow.currentApprovals++;
			} else {
				proposal.workflow.blockers.push(approverId);
			}

			proposal.updatedAt = new Date();
			proposal.version++;

			await this.db.proposals.update(proposalId, proposal);
			await this.recordHistory(proposalId, approved ? 'approved' : 'rejected', approverId, null, {
				approved,
				comments
			});

			// Add comment if provided
			if (comments) {
				await this.addComment(proposalId, approverId, comments, approved ? 'approval' : 'rejection');
			}

			// Check if proposal can auto-advance
			if (approved && proposal.workflow.currentApprovals >= proposal.workflow.requiredApprovals) {
				if (proposal.workflow.autoAdvance) {
					await this.advanceStage(proposalId, approverId);
				} else {
					// Notify that proposal is ready for advancement
					await this.notifyReadyForAdvancement(proposal);
				}
			}

			this.emit('proposal:approval-received', {
				proposal,
				approverId,
				approved,
				comments
			});

			this.logger.info(`Approval submitted for proposal`, {
				proposalId,
				approverId,
				approved
			});
		} catch (error) {
			this.logger.error('Failed to submit approval', {
				error,
				proposalId,
				approverId
			});
			throw error;
		}
	}

	/**
	 * Add a comment to a proposal
	 */
	async addComment(
		proposalId: string,
		authorId: string,
		content: string,
		type: ProposalComment['type'] = 'suggestion'
	): Promise<string> {
		try {
			await this.verifyProposalPermission(proposalId, authorId, 'read');

			const sanitizedContent = sanitizeHtml(content, {
				allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
				allowedAttributes: {}
			});

			const comment: ProposalComment = {
				id: uuidv4(),
				authorId,
				content: sanitizedContent,
				timestamp: new Date(),
				type,
				resolved: false
			};

			const proposal = await this.getProposal(proposalId);

			// Add comment to latest document or create a general comment
			if (proposal.documents.length > 0) {
				const latestDoc = proposal.documents[proposal.documents.length - 1];
				latestDoc.comments.push(comment);
			} else {
				// Handle general proposal comments
				if (!proposal.metadata.comments) {
					proposal.metadata.comments = [];
				}
				proposal.metadata.comments.push(comment);
			}

			proposal.updatedAt = new Date();
			proposal.version++;

			await this.db.proposals.update(proposalId, proposal);
			await this.recordHistory(proposalId, 'comment-added', authorId, null, comment);

			// Notify relevant members
			await this.notifyComment(proposal, comment);

			this.logger.info(`Comment added to proposal`, {
				proposalId,
				authorId,
				commentId: comment.id
			});

			return comment.id;
		} catch (error) {
			this.logger.error('Failed to add comment', {
				error,
				proposalId,
				authorId
			});
			throw error;
		}
	}

	/**
	 * Search proposals based on criteria
	 */
	async searchProposals(
		criteria: ProposalSearchCriteria,
		actorId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<{ proposals: Proposal[]; total: number }> {
		try {
			// Verify user can access proposals
			await this.auth.verifyPermission(actorId, 'proposal:read');

			// Build query based on criteria
			const query = this.buildSearchQuery(criteria, actorId);

			const [proposals, total] = await Promise.all([
				this.db.proposals.findMany(query, { limit, offset }),
				this.db.proposals.count(query)
			]);

			// Filter proposals based on user permissions
			const accessibleProposals = await this.filterByAccess(proposals, actorId);

			this.logger.info(`Proposals searched`, {
				actorId,
				criteriaCount: Object.keys(criteria).length,
				resultCount: accessibleProposals.length
			});

			return {
				proposals: accessibleProposals,
				total
			};
		} catch (error) {
			this.logger.error('Failed to search proposals', { error, actorId });
			throw error;
		}
	}

	/**
	 * Get proposal analytics and success metrics
	 */
	async getProposalAnalytics(
		dateRange: { start: Date; end: Date },
		actorId: string
	): Promise<{
		totalProposals: number;
		completedProposals: number;
		averageCompletionTime: number;
		stageAnalytics: Record<ProposalStage, number>;
		priorityAnalytics: Record<ProposalPriority, number>;
		successRate: number;
		topCollaborators: Array<{ userId: string; proposalCount: number }>;
	}> {
		try {
			await this.auth.verifyPermission(actorId, 'proposal:analytics');

			const proposals = await this.db.proposals.findByDateRange(
				dateRange.start,
				dateRange.end
			);

			const analytics = {
				totalProposals: proposals.length,
				completedProposals: proposals.filter((p: Proposal) => p.stage === 'completed').length,
				averageCompletionTime: this.calculateAverageCompletionTime(proposals),
				stageAnalytics: this.calculateStageAnalytics(proposals),
				priorityAnalytics: this.calculatePriorityAnalytics(proposals),
				successRate: this.calculateSuccessRate(proposals),
				topCollaborators: this.calculateTopCollaborators(proposals)
			};

			this.logger.info(`Analytics calculated`, {
				actorId,
				dateRange,
				totalProposals: analytics.totalProposals
			});

			return analytics;
		} catch (error) {
			this.logger.error('Failed to get proposal analytics', { error, actorId });
			throw error;
		}
	}

	/**
	 * Get proposal by ID with permission check
	 */
	async getProposal(proposalId: string, actorId?: string): Promise<Proposal> {
		if (!validator.isUUID(proposalId)) {
			throw new Error('Invalid proposal ID format');
		}

		const proposal = await this.db.proposals.findById(proposalId);
		if (!proposal) {
			throw new Error('Proposal not found');
		}

		if (actorId) {
			await this.verifyProposalAccess(proposalId, actorId);
		}

		return proposal;
	}

	/**
	 * Validate proposal input data
	 */
	private validateProposalData(data: any): void {
		if (!data.title || typeof data.title !== 'string' || data.title.length < 3) {
			throw new Error('Title must be at least 3 characters long');
		}

		if (!data.description || typeof data.description !== 'string' || data.description.length < 10) {
			throw new Error('Description must be at least 10 characters long');
		}

		if (!['low', 'medium', 'high', 'critical'].includes(data.priority)) {
			throw new Error('Invalid priority value');
		}

		if (data.deadline && (!(data.deadline instanceof Date) || data.deadline <= new Date())) {
			throw new Error('Deadline must be a future date');
		}

		if (data.tags && (!Array.isArray(data.tags) || data.tags.some((tag: unknown) => typeof tag !== 'string'))) {
			throw new Error('Tags must be an array of strings');
		}
	}

	/**
	 * Sanitize proposal input data
	 */
	private sanitizeProposalInput(data: any): any {
		return {
			title: sanitizeHtml(data.title.trim(), { allowedTags: [], allowedAttributes: {} }),
			description: sanitizeHtml(data.description.trim(), {
				allowedTags: ['p', 'br', 'strong', 'em'],
				allowedAttributes: {}
			}),
			priority: data.priority,
			tags: data.tags?.map((tag: string) => sanitizeHtml(tag.trim(), {
				allowedTags: [],
				allowedAttributes: {}
			})),
			deadline: data.deadline,
			metadata: data.metadata
		};
	}

	/**
	 * Verify user has specific permission for a proposal
	 */
	private async verifyProposalPermission(
		proposalId: string,
		userId: string,
		permission: string
	): Promise<void> {
		const proposal = await this.getProposal(proposalId);
		const member = proposal.members.find(m => m.id === userId);

		if (!member) {
			throw new Error('User is not a member of this proposal');
		}

		if (!member.permissions.includes(permission)) {
			throw new Error(`Insufficient permissions: ${permission}`);
		}
	}

	/**
	 * Verify user can access a proposal
	 */
	private async verifyProposalAccess(proposalId: string, userId: string): Promise<void> {
		const proposal = await this.getProposal(proposalId);
		const isMember = proposal.members.some(m => m.id === userId);

		if (!isMember) {
			// Check if user has global proposal access
			const hasGlobalAccess = await this.auth.verifyPermission(userId, 'proposal:read-all', false);
			if (!hasGlobalAccess) {
				throw new Error('Access denied to proposal');
			}
		}
	}

	/**
	 * Get required approvals based on priority and stage
	 */
	private getRequiredApprovals(priority: ProposalPriority, stage?: ProposalStage): number {
		const baseRequirements = {
			low: 1,
			medium: 2,
			high: 3,
			critical: 5
		};

		let required = baseRequirements[priority];

		// Increase requirements for certain stages
		if (stage === 'approval' || stage === 'finalization') {
			required = Math.max(required, 2);
		}

		return required;
	}

	/**
	 * Get permissions for a specific role
	 */
	private getRolePermissions(role: ProposalMember['role']): string[] {
		const rolePermissions = {
			initiator: ['read', 'write', 'invite', 'approve', 'advance'],
			collaborator: ['read', 'write', 'comment'],
			reviewer: ['read', 'comment', 'approve'],
			approver: ['read', 'approve', 'advance']
		};

		return rolePermissions[role] || ['read'];
	}

	/**
	 * Record action in proposal history
	 */
	private async recordHistory(
		proposalId: string,
		action: string,
		actorId: string,
		previousValue: any,
		newValue: any
	): Promise<void> {
		const historyEntry: ProposalHistoryEntry = {
			id: uuidv4(),
			proposalId,
			action,
			actorId,
			previousValue,
			newValue,
			timestamp: new Date(),
			metadata: {}
		};

		await this.db.proposalHistory.create(historyEntry);
	}

	/**
	 * Event handler for stage changes
	 */
	private async handleStageChange(event: any): Promise<void> {
		const { proposal, previousStage, newStage, actorId } = event;

		// Send notifications to relevant members
		await this.notifyStageChange(proposal, previousStage, newStage);

		// Update metrics
		await this.metrics.recordProposalStageChange(proposal.id, previousStage, newStage);

		// Schedule next stage deadline if applicable
		if (proposal.workflow.deadline) {
			this.scheduleDeadlineNotification(proposal.id, proposal.workflow.deadline);
		}
	}

	/**
	 * Event handler for member additions
	 */
	private async handleMemberAdded(event: any): Promise<void> {
		const { proposal, member } = event;

		// Update collaboration metrics
		await this.metrics.recordCollaborationActivity(proposal.id, member.id);
	}

	/**
	 * Event handler for approvals
	 */
	private async handleApprovalReceived(event: any): Promise<void> {
		const { proposal, approverId, approved } = event;

		// Update approval metrics
		await this.metrics.recordApproval(proposal.id, approverId, approved);
	}

	/**
	 * Event handler for approaching deadlines
	 */
	private async handleDeadlineApproaching(event: any): Promise<void> {
		const { proposalId, deadline } = event;

		// Send deadline notifications
		await this.sendDeadlineNotifications(proposalId, deadline);
	}

	/**
	 * Helper method to get user name
	 */
	private async getUserName(userId: string): Promise<string> {
		const user = await this.db.users.findById(userId);
		return user?.name || 'Unknown User';
	}

	/**
	 * Helper method to get user department
	 */
	private async getUserDepartment(userId: string): Promise<string> {
		const user = await this.db.users.findById(userId);
		return user?.department || 'Unknown';
	}

	/**
	 * Additional helper methods for analytics, notifications, etc.
	 */
	private calculateAverageCompletionTime(proposals: Proposal[]): number {
		const completed = proposals.filter(p => p.completedAt);
		if (completed.length === 0) return 0;

		const totalTime = completed.reduce((sum, p) => sum + p.metrics.totalDuration, 0);
		return totalTime / completed.length;
	}

	private calculateStageAnalytics(proposals: Proposal[]): Record<ProposalStage, number> {
		const stageCount = {} as Record<ProposalStage, number>;
		proposals.forEach(p => {
			stageCount[p.stage] = (stageCount[p.stage] || 0) + 1;
		});
		return stageCount;
	}

	private calculatePriorityAnalytics(proposals: Proposal[]): Record<ProposalPriority, number> {
		const priorityCount = {} as Record<ProposalPriority, number>;
		proposals.forEach(p => {
			priorityCount[p.priority] = (priorityCount[p.priority] || 0) + 1;
		});
		return priorityCount;
	}

	private calculateSuccessRate(proposals: Proposal[]): number {
		if (proposals.length === 0) return 0;
		const completed = proposals.filter(p => p.stage === 'completed').length;
		return (completed / proposals.length) * 100;
	}

	private calculateTopCollaborators(proposals: Proposal[]): Array<{ userId: string; proposalCount: number }> {
		const collaboratorCount = new Map<string, number>();

		proposals.forEach(p => {
			p.members.forEach(m => {
				if (m.role !== 'initiator') {
					collaboratorCount.set(m.id, (collaboratorCount.get(m.id) || 0) + 1);
				}
			});
		});

		return Array.from(collaboratorCount.entries())
			.map(([userId, proposalCount]) => ({ userId, proposalCount }))
			.sort((a, b) => b.proposalCount - a.proposalCount)
			.slice(0, 10);
	}

	private determineNextStage(proposal: Proposal, validTransitions: ProposalStage[]): ProposalStage {
		// Logic to determine next stage based on proposal state and business rules
		if (validTransitions.length === 1) {
			return validTransitions[0];
		}

		// Default to first valid transition for now
		// This could be enhanced with more sophisticated logic
		return validTransitions[0];
	}

	private async verifyStageRequirements(proposal: Proposal, nextStage: ProposalStage): Promise<void> {
		// Implement stage-specific requirement checks
		switch (nextStage) {
			case 'approval':
				if (proposal.documents.length === 0) {
					throw new Error('Cannot advance to approval without documents');
				}
				break;
			case 'finalization':
				if (proposal.workflow.currentApprovals < proposal.workflow.requiredApprovals) {
					throw new Error('Insufficient approvals for finalization');
				}
				break;
		}
	}

	private async getStageStartTime(proposalId: string, stage: ProposalStage): Promise<number> {
		const history = await this.db.proposalHistory.findByProposalAndAction(proposalId, 'stage-advanced');
		const stageEntry = history.find((h: ProposalHistoryEntry) => h.newValue === stage);
		return stageEntry?.timestamp.getTime() || Date.now();
	}

	private buildSearchQuery(criteria: ProposalSearchCriteria, _actorId: string): Record<string, unknown> {
		const query: Record<string, unknown> = {};

		if (criteria.stage) query.stage = criteria.stage;
		if (criteria.priority) query.priority = criteria.priority;
		if (criteria.initiatorId) query.initiatorId = criteria.initiatorId;
		if (criteria.tags?.length) query.tags = { $in: criteria.tags };
		if (criteria.dateRange) {
			query.createdAt = {
				$gte: criteria.dateRange.start,
				$lte: criteria.dateRange.end
			};
		}
		if (criteria.keyword) {
			query.$or = [
				{ title: { $regex: criteria.keyword, $options: 'i' } },
				{ description: { $regex: criteria.keyword, $options: 'i' } }
			];
		}
		return query;
	}

	/**
	 * Schedule deadline notification for a proposal
	 */
	private scheduleDeadlineNotification(proposalId: string, deadline: Date): void {
		const timeUntilDeadline = deadline.getTime() - Date.now();
		const warningTime = timeUntilDeadline - (24 * 60 * 60 * 1000); // 24 hours before

		if (warningTime > 0) {
			const timeout = setTimeout(() => {
				this.emit('proposal:deadline-approaching', { proposalId, deadline });
			}, warningTime);
			this.workflowTimeouts.set(`deadline:${proposalId}`, timeout);
		}
	}

	/**
	 * Notify members that proposal is ready for advancement
	 */
	private async notifyReadyForAdvancement(proposal: Proposal): Promise<void> {
		const approvers = proposal.members.filter(m => m.permissions.includes('advance'));
		for (const approver of approvers) {
			await this.notification.send({
				userId: approver.id,
				type: 'proposal_ready',
				title: 'Proposal Ready for Advancement',
				content: `Proposal "${proposal.title}" has received all required approvals`,
				metadata: { proposalId: proposal.id }
			});
		}
	}

	/**
	 * Notify members about a new comment
	 */
	private async notifyComment(proposal: Proposal, comment: ProposalComment): Promise<void> {
		const membersToNotify = proposal.members.filter(m => m.id !== comment.authorId);
		for (const member of membersToNotify) {
			await this.notification.send({
				userId: member.id,
				type: 'proposal_comment',
				title: 'New Comment on Proposal',
				content: `A new ${comment.type} was added to "${proposal.title}"`,
				metadata: { proposalId: proposal.id, commentId: comment.id }
			});
		}
	}

	/**
	 * Notify members about stage change
	 */
	private async notifyStageChange(proposal: Proposal, previousStage: ProposalStage, newStage: ProposalStage): Promise<void> {
		for (const member of proposal.members) {
			await this.notification.send({
				userId: member.id,
				type: 'proposal_stage_change',
				title: 'Proposal Stage Changed',
				content: `Proposal "${proposal.title}" moved from ${previousStage} to ${newStage}`,
				metadata: { proposalId: proposal.id, previousStage, newStage }
			});
		}
	}

	/**
	 * Send deadline notifications to all members
	 */
	private async sendDeadlineNotifications(proposalId: string, deadline: Date): Promise<void> {
		const proposal = await this.getProposal(proposalId);
		for (const member of proposal.members) {
			await this.notification.send({
				userId: member.id,
				type: 'proposal_deadline',
				title: 'Proposal Deadline Approaching',
				content: `Proposal "${proposal.title}" deadline is approaching: ${deadline.toISOString()}`,
				metadata: { proposalId, deadline: deadline.toISOString() }
			});
		}
	}

	/**
	 * Filter proposals based on user access
	 */
	private async filterByAccess(proposals: Proposal[], actorId: string): Promise<Proposal[]> {
		const accessible: Proposal[] = [];
		for (const proposal of proposals) {
			const isMember = proposal.members.some(m => m.id === actorId);
			if (isMember) {
				accessible.push(proposal);
			} else {
				try {
					const hasGlobalAccess = await this.auth.verifyPermission(actorId, 'proposal:read-all', false);
					if (hasGlobalAccess) {
						accessible.push(proposal);
					}
				} catch {
					// No access, skip
				}
			}
		}
		return accessible;
	}
}

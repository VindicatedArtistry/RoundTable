/**
 * Ethical Decision Data Access Object
 *
 * Manages Council ethical decisions, votes, and constitutional alignment tracking
 * with full audit trails and compliance monitoring using SurrealDB
 */

import { surrealDBService } from '../../services/surrealdb-service';

// Ethical Decision Types
export interface EthicalDecision {
	id: string;
	title: string;
	description: string;
	category: 'policy' | 'partnership' | 'resource-allocation' | 'strategic' | 'operational' | 'crisis' | 'constitutional';
	priority: 'low' | 'medium' | 'high' | 'critical';

	// Decision context
	proposedBy: string; // Council member ID
	proposedAt: Date;
	discussionConversationId?: string; // Link to conversation

	// Constitutional analysis
	constitutionalAlignment: number; // 0-1 score
	constitutionalReferences: string[]; // Referenced constitutional principles
	ethicalImplications: string[];
	precedentReferences: string[]; // Similar past decisions

	// Stakeholder analysis
	stakeholders: Array<{
		id: string;
		name: string;
		impact: 'direct' | 'indirect' | 'minimal';
		supportLevel: number; // -1 to 1 (oppose to support)
	}>;

	// Decision options
	alternatives: Array<{
		id: string;
		title: string;
		description: string;
		pros: string[];
		cons: string[];
		ethicalScore: number; // 0-1
		feasibilityScore: number; // 0-1
		riskLevel: 'low' | 'medium' | 'high';
		resourceRequirements: string[];
		timeline: string;
		constitutionalCompliance: number; // 0-1
	}>;

	// Voting and consensus
	votingRounds: VotingRound[];
	finalDecision?: {
		selectedAlternativeId: string;
		consensusLevel: number; // 0-1
		unanimity: boolean;
		abstentions: string[]; // Member IDs who abstained
		dissenting: Array<{
			memberId: string;
			reasoning: string;
			alternativePreference?: string;
		}>;
		overrideReason?: string; // If consensus was overridden
	};

	// Implementation tracking
	implementation?: {
		status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
		assignedMembers: string[];
		startDate?: Date;
		targetCompletionDate?: Date;
		actualCompletionDate?: Date;
		milestones: Array<{
			id: string;
			description: string;
			targetDate: Date;
			completedDate?: Date;
			status: 'pending' | 'completed' | 'delayed' | 'cancelled';
		}>;
		progressUpdates: Array<{
			date: Date;
			updatedBy: string;
			status: string;
			notes: string;
			blockers?: string[];
		}>;
		successMetrics: Array<{
			metric: string;
			targetValue: number;
			actualValue?: number;
			unit: string;
		}>;
	};

	// Review and retrospective
	retrospective?: {
		conductedDate: Date;
		conductedBy: string[];
		outcomeAssessment: {
			successLevel: number; // 0-1
			ethicalOutcome: number; // 0-1
			stakeholderSatisfaction: number; // 0-1
			unintendedConsequences: string[];
			lessonsLearned: string[];
		};
		processImprovement: {
			decisionQuality: number; // 0-1
			consensusBuildingEffectiveness: number; // 0-1
			implementationEfficiency: number; // 0-1
			communicationClarity: number; // 0-1
			recommendedImprovements: string[];
		};
	};

	// Audit trail
	status: 'proposed' | 'under-discussion' | 'voting' | 'decided' | 'implemented' | 'reviewed' | 'archived';
	createdAt: Date;
	updatedAt: Date;
	decisionDate?: Date;
	archivedAt?: Date;

	// Metadata
	tags: string[];
	relatedDecisions: string[]; // IDs of related decisions
	metadata: Record<string, any>;
}

export interface VotingRound {
	id: string;
	roundNumber: number;
	startedAt: Date;
	endedAt?: Date;
	votingMethod: 'consensus' | 'majority' | 'supermajority' | 'unanimity' | 'ranked-choice';

	votes: Array<{
		memberId: string;
		memberName: string;
		vote: 'support' | 'oppose' | 'abstain' | 'conditional';
		alternativePreference?: string; // For ranked choice
		conditions?: string[]; // For conditional votes
		reasoning: string;
		confidenceLevel: number; // 0-1
		castAt: Date;
		lastModified?: Date;
	}>;

	deliberation: {
		questionsRaised: string[];
		concernsExpressed: string[];
		clarificationsProvided: string[];
		amendmentsProposed: Array<{
			proposedBy: string;
			description: string;
			accepted: boolean;
			reasoning: string;
		}>;
	};

	results: {
		supportCount: number;
		opposeCount: number;
		abstainCount: number;
		consensusReached: boolean;
		consensusLevel: number; // 0-1
		outcome: 'passed' | 'failed' | 'deferred' | 'amended';
	};
}

export interface DecisionQuery {
	categories?: EthicalDecision['category'][];
	priorities?: EthicalDecision['priority'][];
	statuses?: EthicalDecision['status'][];
	proposedBy?: string[];
	participatingMembers?: string[];
	timeRange?: {
		start: Date;
		end: Date;
	};
	minConstitutionalAlignment?: number;
	minEthicalScore?: number;
	hasImplementation?: boolean;
	hasRetrospective?: boolean;
	tags?: string[];
	sortBy?: 'date' | 'priority' | 'consensus' | 'ethical-score' | 'constitutional-alignment';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

export class EthicalDecisionDAO {
	private surrealDBService = surrealDBService;

	constructor() {
		// SurrealDB service is a singleton
	}

	/**
	 * Create a new ethical decision proposal
	 */
	async createDecision(decision: Partial<EthicalDecision>): Promise<EthicalDecision> {
		const now = new Date();

		const decisionData: EthicalDecision = {
			id: decision.id || crypto.randomUUID(),
			title: decision.title!,
			description: decision.description!,
			category: decision.category!,
			priority: decision.priority || 'medium',
			proposedBy: decision.proposedBy!,
			proposedAt: decision.proposedAt || now,
			discussionConversationId: decision.discussionConversationId,
			constitutionalAlignment: decision.constitutionalAlignment || 0.8,
			constitutionalReferences: decision.constitutionalReferences || [],
			ethicalImplications: decision.ethicalImplications || [],
			precedentReferences: decision.precedentReferences || [],
			stakeholders: decision.stakeholders || [],
			alternatives: decision.alternatives || [],
			votingRounds: decision.votingRounds || [],
			finalDecision: decision.finalDecision,
			implementation: decision.implementation,
			retrospective: decision.retrospective,
			status: decision.status || 'proposed',
			createdAt: decision.createdAt || now,
			updatedAt: now,
			decisionDate: decision.decisionDate,
			archivedAt: decision.archivedAt,
			tags: decision.tags || [],
			relatedDecisions: decision.relatedDecisions || [],
			metadata: decision.metadata || {}
		};

		// Create decision record in SurrealDB
		const result = await this.surrealDBService.create({
			table: 'ethical_decision',
			id: decisionData.id,
			data: {
				title: decisionData.title,
				description: decisionData.description,
				category: decisionData.category,
				priority: decisionData.priority,
				proposed_by: decisionData.proposedBy,
				proposed_at: decisionData.proposedAt,
				discussion_conversation_id: decisionData.discussionConversationId,
				constitutional_alignment: decisionData.constitutionalAlignment,
				constitutional_references: decisionData.constitutionalReferences,
				ethical_implications: decisionData.ethicalImplications,
				precedent_references: decisionData.precedentReferences,
				stakeholders: decisionData.stakeholders,
				alternatives: decisionData.alternatives,
				voting_rounds: decisionData.votingRounds,
				final_decision: decisionData.finalDecision,
				implementation: decisionData.implementation,
				retrospective: decisionData.retrospective,
				status: decisionData.status,
				created_at: decisionData.createdAt,
				updated_at: decisionData.updatedAt,
				decision_date: decisionData.decisionDate,
				archived_at: decisionData.archivedAt,
				tags: decisionData.tags,
				related_decisions: decisionData.relatedDecisions,
				metadata: decisionData.metadata
			}
		});

		if (!result.success) {
			throw new Error(`Failed to create ethical decision: ${result.error}`);
		}

		return decisionData;
	}

	/**
	 * Start a voting round for a decision
	 */
	async startVotingRound(
		decisionId: string,
		votingMethod: VotingRound['votingMethod'],
		eligibleVoters: string[]
	): Promise<VotingRound> {
		const decision = await this.getDecision(decisionId);
		if (!decision) {
			throw new Error(`Decision ${decisionId} not found`);
		}

		const votingRound: VotingRound = {
			id: crypto.randomUUID(),
			roundNumber: decision.votingRounds.length + 1,
			startedAt: new Date(),
			votingMethod,
			votes: [],
			deliberation: {
				questionsRaised: [],
				concernsExpressed: [],
				clarificationsProvided: [],
				amendmentsProposed: []
			},
			results: {
				supportCount: 0,
				opposeCount: 0,
				abstainCount: 0,
				consensusReached: false,
				consensusLevel: 0,
				outcome: 'deferred'
			}
		};

		// Update decision with new voting round
		const updatedVotingRounds = [...decision.votingRounds, votingRound];

		await this.surrealDBService.update({
			table: 'ethical_decision',
			id: decisionId,
			data: {
				voting_rounds: updatedVotingRounds,
				status: 'voting',
				updated_at: new Date()
			}
		});

		// Create voting round record
		await this.surrealDBService.create({
			table: 'voting_round',
			id: votingRound.id,
			data: {
				decision_id: decisionId,
				round_number: votingRound.roundNumber,
				started_at: votingRound.startedAt,
				voting_method: votingMethod,
				status: 'active',
				deliberation: votingRound.deliberation,
				results: votingRound.results
			}
		});

		return votingRound;
	}

	/**
	 * Cast a vote in a voting round
	 */
	async castVote(
		decisionId: string,
		votingRoundId: string,
		vote: {
			memberId: string;
			memberName: string;
			vote: 'support' | 'oppose' | 'abstain' | 'conditional';
			alternativePreference?: string;
			conditions?: string[];
			reasoning: string;
			confidenceLevel: number;
		}
	): Promise<void> {
		const voteData = {
			...vote,
			castAt: new Date(),
			lastModified: new Date()
		};

		// Create vote record
		await this.surrealDBService.create({
			table: 'vote',
			data: {
				decision_id: decisionId,
				voting_round_id: votingRoundId,
				member_id: vote.memberId,
				member_name: vote.memberName,
				vote: vote.vote,
				alternative_preference: vote.alternativePreference,
				conditions: vote.conditions || [],
				reasoning: vote.reasoning,
				confidence_level: vote.confidenceLevel,
				cast_at: voteData.castAt,
				last_modified: voteData.lastModified
			}
		});

		// Update the decision document with the new vote
		await this.updateVotingRoundResults(decisionId, votingRoundId);
	}

	/**
	 * End a voting round and calculate results
	 */
	async endVotingRound(
		decisionId: string,
		votingRoundId: string
	): Promise<VotingRound> {
		const now = new Date();

		// Get all votes for this round
		const votesResult = await this.surrealDBService.query(
			`SELECT * FROM vote WHERE voting_round_id = $votingRoundId`,
			{ votingRoundId }
		);

		const votes = (votesResult.data as any[]) || [];

		// Calculate results
		const supportCount = votes.filter((v: any) => v.vote === 'support').length;
		const opposeCount = votes.filter((v: any) => v.vote === 'oppose').length;
		const abstainCount = votes.filter((v: any) => v.vote === 'abstain').length;
		const totalVotes = supportCount + opposeCount + abstainCount;

		const consensusLevel = totalVotes > 0 ? supportCount / totalVotes : 0;
		const consensusReached = consensusLevel >= 0.67; // 67% threshold for consensus

		let outcome: VotingRound['results']['outcome'] = 'failed';
		if (consensusReached) {
			outcome = 'passed';
		} else if (consensusLevel >= 0.5) {
			outcome = 'deferred'; // Majority but not consensus
		}

		const results = {
			supportCount,
			opposeCount,
			abstainCount,
			consensusReached,
			consensusLevel,
			outcome
		};

		// Update voting round
		await this.surrealDBService.update({
			table: 'voting_round',
			id: votingRoundId,
			data: {
				ended_at: now,
				results,
				status: 'completed'
			}
		});

		// Update decision status
		await this.surrealDBService.update({
			table: 'ethical_decision',
			id: decisionId,
			data: {
				status: consensusReached ? 'decided' : 'under-discussion',
				updated_at: now
			}
		});

		// If consensus reached, finalize the decision
		if (consensusReached) {
			await this.finalizeDecision(decisionId, votingRoundId);
		}

		// Get the voting round record
		const roundResult = await this.surrealDBService.select('voting_round', votingRoundId);
		const roundRecord = roundResult.data?.[0];

		// Create voting round object to return
		const votingRound: VotingRound = {
			id: votingRoundId,
			roundNumber: (roundRecord?.round_number as number) ?? 1,
			startedAt: roundRecord?.started_at ? new Date(roundRecord.started_at as string) : new Date(),
			endedAt: now,
			votingMethod: (roundRecord?.voting_method as VotingRound['votingMethod']) ?? 'consensus',
			votes: votes.map((v: any) => ({
				memberId: v.member_id,
				memberName: v.member_name,
				vote: v.vote,
				alternativePreference: v.alternative_preference,
				conditions: v.conditions || [],
				reasoning: v.reasoning,
				confidenceLevel: v.confidence_level,
				castAt: new Date(v.cast_at),
				lastModified: v.last_modified ? new Date(v.last_modified) : undefined
			})),
			deliberation: (roundRecord?.deliberation as VotingRound['deliberation']) ?? {
				questionsRaised: [],
				concernsExpressed: [],
				clarificationsProvided: [],
				amendmentsProposed: []
			},
			results
		};

		return votingRound;
	}

	/**
	 * Get a decision by ID
	 */
	async getDecision(decisionId: string): Promise<EthicalDecision | null> {
		const result = await this.surrealDBService.select('ethical_decision', decisionId);

		if (!result.success || !result.data || result.data.length === 0) {
			return null;
		}

		const record = result.data[0];
		return this.mapToEthicalDecision(record);
	}

	/**
	 * Search decisions with filters
	 */
	async searchDecisions(query: DecisionQuery): Promise<EthicalDecision[]> {
		const whereConditions: string[] = [];
		const params: Record<string, unknown> = {};

		// Add filters
		if (query.categories && query.categories.length > 0) {
			whereConditions.push(`category IN $categories`);
			params.categories = query.categories;
		}

		if (query.priorities && query.priorities.length > 0) {
			whereConditions.push(`priority IN $priorities`);
			params.priorities = query.priorities;
		}

		if (query.statuses && query.statuses.length > 0) {
			whereConditions.push(`status IN $statuses`);
			params.statuses = query.statuses;
		}

		if (query.proposedBy && query.proposedBy.length > 0) {
			whereConditions.push(`proposed_by IN $proposedBy`);
			params.proposedBy = query.proposedBy;
		}

		if (query.timeRange) {
			if (query.timeRange.start) {
				whereConditions.push(`proposed_at >= $startTime`);
				params.startTime = query.timeRange.start.toISOString();
			}
			if (query.timeRange.end) {
				whereConditions.push(`proposed_at <= $endTime`);
				params.endTime = query.timeRange.end.toISOString();
			}
		}

		if (query.minConstitutionalAlignment) {
			whereConditions.push(`constitutional_alignment >= $minConstitutionalAlignment`);
			params.minConstitutionalAlignment = query.minConstitutionalAlignment;
		}

		if (query.hasImplementation !== undefined) {
			whereConditions.push(query.hasImplementation ? `implementation IS NOT NULL` : `implementation IS NULL`);
		}

		if (query.hasRetrospective !== undefined) {
			whereConditions.push(query.hasRetrospective ? `retrospective IS NOT NULL` : `retrospective IS NULL`);
		}

		if (query.tags && query.tags.length > 0) {
			whereConditions.push(`array::any(tags, $tags)`);
			params.tags = query.tags;
		}

		// Build the query
		let surrealQuery = `SELECT * FROM ethical_decision`;
		if (whereConditions.length > 0) {
			surrealQuery += ` WHERE ${whereConditions.join(' AND ')}`;
		}

		// Add sorting
		const sortBy = query.sortBy || 'date';
		const sortOrder = query.sortOrder || 'desc';

		switch (sortBy) {
			case 'priority':
				// Use CASE expression for priority ordering
				surrealQuery += ` ORDER BY priority ${sortOrder.toUpperCase()}`;
				break;
			case 'consensus':
				surrealQuery += ` ORDER BY final_decision.consensusLevel ${sortOrder.toUpperCase()}`;
				break;
			case 'ethical-score':
			case 'constitutional-alignment':
				surrealQuery += ` ORDER BY constitutional_alignment ${sortOrder.toUpperCase()}`;
				break;
			default:
				surrealQuery += ` ORDER BY proposed_at ${sortOrder.toUpperCase()}`;
		}

		// Add pagination
		if (query.limit) {
			surrealQuery += ` LIMIT $limit`;
			params.limit = query.limit;
		}

		if (query.offset) {
			surrealQuery += ` START $offset`;
			params.offset = query.offset;
		}

		const result = await this.surrealDBService.query(surrealQuery, params);

		if (!result.success || !result.data) {
			return [];
		}

		return (result.data as any[]).map(record => this.mapToEthicalDecision(record));
	}

	/**
	 * Update implementation status
	 */
	async updateImplementationStatus(
		decisionId: string,
		update: {
			status?: EthicalDecision['implementation'] extends { status: infer S } ? S : never;
			progressNotes?: string;
			completedMilestones?: string[];
			blockers?: string[];
			updatedBy: string;
		}
	): Promise<void> {
		const decision = await this.getDecision(decisionId);
		if (!decision || !decision.implementation) {
			throw new Error(`Decision ${decisionId} not found or has no implementation plan`);
		}

		const progressUpdate = {
			date: new Date(),
			updatedBy: update.updatedBy,
			status: update.status || decision.implementation.status,
			notes: update.progressNotes || '',
			blockers: update.blockers || []
		};

		const updatedImplementation = {
			...decision.implementation,
			status: update.status || decision.implementation.status,
			progressUpdates: [...decision.implementation.progressUpdates, progressUpdate]
		};

		await this.surrealDBService.update({
			table: 'ethical_decision',
			id: decisionId,
			data: {
				implementation: updatedImplementation,
				updated_at: new Date()
			}
		});
	}

	/**
	 * Conduct retrospective analysis
	 */
	async conductRetrospective(
		decisionId: string,
		retrospective: EthicalDecision['retrospective']
	): Promise<void> {
		await this.surrealDBService.update({
			table: 'ethical_decision',
			id: decisionId,
			data: {
				retrospective,
				status: 'reviewed',
				updated_at: new Date()
			}
		});

		// Extract learning from the retrospective for all participants
		await this.extractLearningFromDecision(decisionId);
	}

	/**
	 * Finalize a decision after successful vote
	 */
	private async finalizeDecision(decisionId: string, votingRoundId: string): Promise<void> {
		const decision = await this.getDecision(decisionId);
		if (!decision) return;

		const votingRound = decision.votingRounds.find(vr => vr.id === votingRoundId);
		if (!votingRound) return;

		// Determine selected alternative (for now, assume first alternative if any)
		const selectedAlternativeId = decision.alternatives[0]?.id || 'default';

		const finalDecision = {
			selectedAlternativeId,
			consensusLevel: votingRound.results.consensusLevel,
			unanimity: votingRound.results.supportCount === votingRound.votes.length,
			abstentions: votingRound.votes.filter(v => v.vote === 'abstain').map(v => v.memberId),
			dissenting: votingRound.votes
				.filter(v => v.vote === 'oppose')
				.map(v => ({
					memberId: v.memberId,
					reasoning: v.reasoning,
					alternativePreference: v.alternativePreference
				}))
		};

		await this.surrealDBService.update({
			table: 'ethical_decision',
			id: decisionId,
			data: {
				final_decision: finalDecision,
				decision_date: new Date(),
				status: 'decided',
				updated_at: new Date()
			}
		});
	}

	/**
	 * Update voting round results
	 */
	private async updateVotingRoundResults(decisionId: string, votingRoundId: string): Promise<void> {
		// Get all votes for this round
		const votesResult = await this.surrealDBService.query(
			`SELECT * FROM vote WHERE voting_round_id = $votingRoundId`,
			{ votingRoundId }
		);

		const votes = (votesResult.data as any[]) || [];

		// Calculate current results
		const supportCount = votes.filter((v: any) => v.vote === 'support').length;
		const opposeCount = votes.filter((v: any) => v.vote === 'oppose').length;
		const abstainCount = votes.filter((v: any) => v.vote === 'abstain').length;
		const totalVotes = supportCount + opposeCount + abstainCount;
		const consensusLevel = totalVotes > 0 ? supportCount / totalVotes : 0;

		// Update voting round with current results
		await this.surrealDBService.update({
			table: 'voting_round',
			id: votingRoundId,
			data: {
				results: {
					supportCount,
					opposeCount,
					abstainCount,
					consensusReached: false,
					consensusLevel,
					outcome: 'deferred'
				}
			}
		});
	}

	/**
	 * Extract learning from decision process
	 */
	private async extractLearningFromDecision(decisionId: string): Promise<void> {
		const decision = await this.getDecision(decisionId);
		if (!decision || !decision.retrospective) return;

		// Extract learning for proposer and voters
		const participantIds = new Set([decision.proposedBy]);
		decision.votingRounds.forEach(round => {
			round.votes.forEach(vote => participantIds.add(vote.memberId));
		});

		for (const participantId of participantIds) {
			const learningData = {
				member_id: participantId,
				timestamp: new Date(),
				category: 'decision',
				description: `Participated in ethical decision: ${decision.title}`,
				context: {
					decisionId,
					category: decision.category,
					priority: decision.priority,
					consensusLevel: decision.finalDecision?.consensusLevel || 0,
					constitutionalAlignment: decision.constitutionalAlignment
				},
				participating_members: Array.from(participantIds),
				knowledge_gained: decision.retrospective.outcomeAssessment.lessonsLearned,
				skills_improved: ['ethical-reasoning', 'consensus-building', 'decision-making'],
				personality_adjustments: {},
				emotional_impact: {},
				relationship_changes: {},
				decision_quality: decision.retrospective.processImprovement.decisionQuality,
				outcome_alignment: decision.retrospective.outcomeAssessment.successLevel,
				ethical_alignment: decision.retrospective.outcomeAssessment.ethicalOutcome,
				confidence_level: 0.9,
				applicability: [decision.category],
				wisdom_gained: decision.retrospective.processImprovement.decisionQuality * 0.1,
				empathy_growth: decision.retrospective.outcomeAssessment.stakeholderSatisfaction * 0.05
			};

			await this.surrealDBService.create({
				table: 'learning_experience',
				data: learningData
			});
		}
	}

	/**
	 * Map SurrealDB record to EthicalDecision interface
	 */
	private mapToEthicalDecision(record: any): EthicalDecision {
		const id = typeof record.id === 'string' ? record.id : record.id?.id || record.id;

		return {
			id,
			title: record.title,
			description: record.description,
			category: record.category,
			priority: record.priority,
			proposedBy: record.proposed_by,
			proposedAt: new Date(record.proposed_at),
			discussionConversationId: record.discussion_conversation_id,
			constitutionalAlignment: record.constitutional_alignment,
			constitutionalReferences: record.constitutional_references || [],
			ethicalImplications: record.ethical_implications || [],
			precedentReferences: record.precedent_references || [],
			stakeholders: record.stakeholders || [],
			alternatives: record.alternatives || [],
			votingRounds: (record.voting_rounds || []).map((vr: any) => ({
				id: vr.id,
				roundNumber: vr.roundNumber || vr.round_number,
				startedAt: new Date(vr.startedAt || vr.started_at),
				endedAt: vr.endedAt || vr.ended_at ? new Date(vr.endedAt || vr.ended_at) : undefined,
				votingMethod: vr.votingMethod || vr.voting_method,
				votes: vr.votes || [],
				deliberation: vr.deliberation || {
					questionsRaised: [],
					concernsExpressed: [],
					clarificationsProvided: [],
					amendmentsProposed: []
				},
				results: vr.results || {
					supportCount: 0,
					opposeCount: 0,
					abstainCount: 0,
					consensusReached: false,
					consensusLevel: 0,
					outcome: 'deferred'
				}
			})),
			finalDecision: record.final_decision,
			implementation: record.implementation,
			retrospective: record.retrospective,
			status: record.status,
			createdAt: new Date(record.created_at),
			updatedAt: new Date(record.updated_at),
			decisionDate: record.decision_date ? new Date(record.decision_date) : undefined,
			archivedAt: record.archived_at ? new Date(record.archived_at) : undefined,
			tags: record.tags || [],
			relatedDecisions: record.related_decisions || [],
			metadata: record.metadata || {}
		};
	}
}

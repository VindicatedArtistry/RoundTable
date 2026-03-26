/**
 * Council Conversation Data Access Object
 *
 * Manages Council conversation data with emotional intelligence, learning extraction,
 * and relationship impact tracking using SurrealDB
 */

import { surrealDBService } from '../../services/surrealdb-service';
import {
	CouncilConversation,
	CouncilMessage,
	DecisionConversation,
	LearningConversation,
	ConversationQuery,
	ConversationAnalytics,
	MessageReaction,
	MessageEdit
} from '@/types/council-conversation.types';

export class CouncilConversationDAO {
	private surrealDBService = surrealDBService;

	constructor() {
		// SurrealDB service is a singleton
	}

	/**
	 * Create a new Council conversation
	 */
	async createConversation(conversation: Partial<CouncilConversation>): Promise<CouncilConversation> {
		const now = new Date();

		const conversationData: CouncilConversation = {
			id: conversation.id || crypto.randomUUID(),
			title: conversation.title!,
			description: conversation.description,
			conversationType: conversation.conversationType!,
			participantIds: conversation.participantIds || [],
			facilitatorId: conversation.facilitatorId,
			observerIds: conversation.observerIds || [],
			createdAt: conversation.createdAt || now,
			updatedAt: now,
			startedAt: conversation.startedAt,
			endedAt: conversation.endedAt,
			duration: conversation.duration,
			messages: conversation.messages || [],
			messageCount: conversation.messages?.length || 0,
			emotionalContext: conversation.emotionalContext || {
				dominantEmotions: {},
				emotionalJourney: [],
				conflictLevel: 0,
				collaborationLevel: 0.8,
				engagementLevel: 0.7
			},
			interactionDepth: conversation.interactionDepth || 'moderate',
			interactionQuality: conversation.interactionQuality || 0.7,
			relationshipImpact: conversation.relationshipImpact || {
				strengthenedBonds: [],
				strainedRelationships: [],
				newConnections: []
			},
			sharedValues: conversation.sharedValues || [],
			sharedExperiences: conversation.sharedExperiences || [],
			consensusAreas: conversation.consensusAreas || [],
			divergenceAreas: conversation.divergenceAreas || [],
			learningOutcomes: conversation.learningOutcomes || {
				knowledgeGenerated: [],
				insightsGained: [],
				skillsDeveloped: [],
				wisdomEmerged: []
			},
			decisionsReached: conversation.decisionsReached || [],
			actionItems: conversation.actionItems || [],
			analysis: conversation.analysis || {
				participationBalance: {},
				communicationPatterns: [],
				emergentThemes: [],
				unexploredAreas: [],
				resolutionQuality: 0.7,
				creativityLevel: 0.6,
				criticalThinking: 0.8,
				empathyDemonstrated: 0.7
			},
			followUpRequired: conversation.followUpRequired || false,
			nextSteps: conversation.nextSteps || [],
			relatedConversations: conversation.relatedConversations || [],
			parentConversation: conversation.parentConversation,
			constitutionalAlignment: conversation.constitutionalAlignment || 0.8,
			ethicalCompliance: conversation.ethicalCompliance || 0.9,
			valueAlignment: conversation.valueAlignment || {},
			tags: conversation.tags || [],
			metadata: conversation.metadata || {}
		};

		// Create conversation record in SurrealDB
		const result = await this.surrealDBService.create({
			table: 'conversation',
			id: conversationData.id,
			data: {
				title: conversationData.title,
				description: conversationData.description,
				conversation_type: conversationData.conversationType,
				participant_ids: conversationData.participantIds,
				facilitator_id: conversationData.facilitatorId,
				observer_ids: conversationData.observerIds,
				created_at: conversationData.createdAt,
				updated_at: conversationData.updatedAt,
				started_at: conversationData.startedAt,
				ended_at: conversationData.endedAt,
				duration: conversationData.duration,
				message_count: conversationData.messageCount,
				emotional_context: conversationData.emotionalContext,
				interaction_depth: conversationData.interactionDepth,
				interaction_quality: conversationData.interactionQuality,
				relationship_impact: conversationData.relationshipImpact,
				shared_values: conversationData.sharedValues,
				shared_experiences: conversationData.sharedExperiences,
				consensus_areas: conversationData.consensusAreas,
				divergence_areas: conversationData.divergenceAreas,
				learning_outcomes: conversationData.learningOutcomes,
				decisions_reached: conversationData.decisionsReached,
				action_items: conversationData.actionItems,
				analysis: conversationData.analysis,
				follow_up_required: conversationData.followUpRequired,
				next_steps: conversationData.nextSteps,
				related_conversations: conversationData.relatedConversations,
				parent_conversation: conversationData.parentConversation,
				constitutional_alignment: conversationData.constitutionalAlignment,
				ethical_compliance: conversationData.ethicalCompliance,
				value_alignment: conversationData.valueAlignment,
				tags: conversationData.tags,
				metadata: conversationData.metadata
			}
		});

		if (!result.success) {
			throw new Error(`Failed to create conversation: ${result.error}`);
		}

		return conversationData;
	}

	/**
	 * Add a message to an existing conversation
	 */
	async addMessage(
		conversationId: string,
		message: Omit<CouncilMessage, 'id' | 'timestamp' | 'conversationId'>
	): Promise<CouncilMessage> {
		const now = new Date();

		const messageData: CouncilMessage = {
			...message,
			id: crypto.randomUUID(),
			conversationId,
			timestamp: now,
			editHistory: [],
			reactions: [],
			responseCount: 0
		};

		// Create the message record
		const result = await this.surrealDBService.create({
			table: 'message',
			id: messageData.id,
			data: {
				conversation_id: conversationId,
				sender_id: messageData.senderId,
				sender_name: messageData.senderName,
				sender_role: messageData.senderRole,
				timestamp: messageData.timestamp,
				content: messageData.content,
				message_type: messageData.messageType,
				emotional_tone: messageData.emotionalTone,
				ethical_implications: messageData.ethicalImplications,
				constitutional_references: messageData.constitutionalReferences,
				decision_impact: messageData.decisionImpact,
				expertise_required: messageData.expertiseRequired,
				mentions_members: messageData.mentionsMembers,
				responds_to_message: messageData.respondsToMessage,
				collaboration_invite: messageData.collaborationInvite,
				knowledge_shared: messageData.knowledgeShared,
				questions_asked: messageData.questionsAsked,
				insights_offered: messageData.insightsOffered,
				processing_time: messageData.processingTime,
				response_count: messageData.responseCount,
				edit_history: messageData.editHistory,
				reactions: messageData.reactions,
				metadata: messageData.metadata
			}
		});

		if (!result.success) {
			throw new Error(`Failed to add message to conversation: ${result.error}`);
		}

		// Update conversation message count
		await this.surrealDBService.query(
			`UPDATE conversation:$conversationId SET
				message_count += 1,
				updated_at = $timestamp`,
			{ conversationId, timestamp: now }
		);

		// Update parent message response count if this is a response
		if (messageData.respondsToMessage) {
			await this.surrealDBService.query(
				`UPDATE message:$messageId SET response_count += 1`,
				{ messageId: messageData.respondsToMessage }
			);
		}

		// Update conversation analysis and emotional context
		await this.updateConversationAnalysis(conversationId, messageData);

		// Update relationship bonds based on message interactions
		await this.updateRelationshipBondsFromMessage(messageData);

		return messageData;
	}

	/**
	 * Get a conversation with all its messages
	 */
	async getConversation(conversationId: string): Promise<CouncilConversation | null> {
		// Get the conversation
		const conversationResult = await this.surrealDBService.select('conversation', conversationId);

		if (!conversationResult.success || !conversationResult.data || conversationResult.data.length === 0) {
			return null;
		}

		const conversationRecord = conversationResult.data[0];

		// Get all messages for this conversation
		const messagesResult = await this.surrealDBService.query(
			`SELECT * FROM message WHERE conversation_id = $conversationId ORDER BY timestamp ASC`,
			{ conversationId }
		);

		const messages = messagesResult.success && messagesResult.data
			? (messagesResult.data as any[]).map(m => this.mapToCouncilMessage(m))
			: [];

		return this.mapToCouncilConversation(conversationRecord, messages);
	}

	/**
	 * Search conversations with filters
	 */
	async searchConversations(query: ConversationQuery): Promise<CouncilConversation[]> {
		const whereConditions: string[] = [];
		const params: Record<string, unknown> = {};

		// Build WHERE conditions
		if (query.participantIds && query.participantIds.length > 0) {
			whereConditions.push(`array::any(participant_ids, $participantIds)`);
			params.participantIds = query.participantIds;
		}

		if (query.conversationTypes && query.conversationTypes.length > 0) {
			whereConditions.push(`conversation_type IN $conversationTypes`);
			params.conversationTypes = query.conversationTypes;
		}

		if (query.timeRange) {
			if (query.timeRange.start) {
				whereConditions.push(`created_at >= $startTime`);
				params.startTime = query.timeRange.start.toISOString();
			}
			if (query.timeRange.end) {
				whereConditions.push(`created_at <= $endTime`);
				params.endTime = query.timeRange.end.toISOString();
			}
		}

		if (query.containsKeywords && query.containsKeywords.length > 0) {
			const keywordConditions = query.containsKeywords.map((_, i) =>
				`(title CONTAINS $keyword${i} OR description CONTAINS $keyword${i})`
			);
			whereConditions.push(`(${keywordConditions.join(' OR ')})`);
			query.containsKeywords.forEach((keyword, i) => {
				params[`keyword${i}`] = keyword;
			});
		}

		if (query.minInteractionDepth) {
			const depthValues = ['surface', 'moderate', 'deep', 'profound'];
			const minIndex = depthValues.indexOf(query.minInteractionDepth);
			const validDepths = depthValues.slice(minIndex);
			whereConditions.push(`interaction_depth IN $validDepths`);
			params.validDepths = validDepths;
		}

		if (query.minQualityScore) {
			whereConditions.push(`interaction_quality >= $minQuality`);
			params.minQuality = query.minQualityScore;
		}

		if (query.hasDecisions) {
			whereConditions.push(`array::len(decisions_reached) > 0`);
		}

		if (query.hasActionItems) {
			whereConditions.push(`array::len(action_items) > 0`);
		}

		// Build the query
		let surrealQuery = `SELECT * FROM conversation`;
		if (whereConditions.length > 0) {
			surrealQuery += ` WHERE ${whereConditions.join(' AND ')}`;
		}

		// Add sorting
		const sortBy = query.sortBy || 'timestamp';
		const sortOrder = query.sortOrder || 'desc';

		switch (sortBy) {
			case 'quality':
				surrealQuery += ` ORDER BY interaction_quality ${sortOrder.toUpperCase()}`;
				break;
			case 'duration':
				surrealQuery += ` ORDER BY duration ${sortOrder.toUpperCase()}`;
				break;
			case 'participation':
				surrealQuery += ` ORDER BY array::len(participant_ids) ${sortOrder.toUpperCase()}`;
				break;
			case 'impact':
				surrealQuery += ` ORDER BY constitutional_alignment ${sortOrder.toUpperCase()}`;
				break;
			default:
				surrealQuery += ` ORDER BY created_at ${sortOrder.toUpperCase()}`;
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

		return (result.data as any[]).map(record => this.mapToCouncilConversation(record, []));
	}

	/**
	 * Add a reaction to a message
	 */
	async addReaction(
		messageId: string,
		reaction: Omit<MessageReaction, 'timestamp'>
	): Promise<void> {
		const reactionData: MessageReaction = {
			...reaction,
			timestamp: new Date()
		};

		// Create the reaction record
		await this.surrealDBService.create({
			table: 'message_reaction',
			data: {
				message_id: messageId,
				reactor_id: reactionData.reactorId,
				reactor_name: reactionData.reactorName,
				reaction_type: reactionData.reactionType,
				emotional_response: reactionData.emotionalResponse,
				timestamp: reactionData.timestamp,
				comment: reactionData.comment
			}
		});

		// Update the message with the new reaction
		await this.surrealDBService.query(
			`UPDATE message:$messageId SET reactions += [$reaction]`,
			{
				messageId,
				reaction: reactionData
			}
		);
	}

	/**
	 * End a conversation and finalize its analysis
	 */
	async endConversation(
		conversationId: string,
		finalAnalysis?: Partial<CouncilConversation['analysis']>
	): Promise<void> {
		const now = new Date();

		// Get the conversation
		const conversation = await this.getConversation(conversationId);
		if (!conversation) {
			throw new Error(`Conversation ${conversationId} not found`);
		}

		const duration = conversation.startedAt
			? Math.floor((now.getTime() - conversation.startedAt.getTime()) / 60000) // minutes
			: 0;

		const updatedAnalysis = {
			...conversation.analysis,
			...finalAnalysis
		};

		// Update the conversation
		await this.surrealDBService.update({
			table: 'conversation',
			id: conversationId,
			data: {
				ended_at: now,
				duration,
				analysis: updatedAnalysis,
				updated_at: now
			}
		});

		// Extract and record learning from the conversation
		await this.extractLearningFromConversation(conversationId);
	}

	/**
	 * Get conversation analytics
	 */
	async getConversationAnalytics(
		participantIds?: string[],
		timeRange?: { start: Date; end: Date }
	): Promise<ConversationAnalytics> {
		const whereConditions: string[] = [];
		const params: Record<string, unknown> = {};

		if (participantIds && participantIds.length > 0) {
			whereConditions.push(`array::any(participant_ids, $participantIds)`);
			params.participantIds = participantIds;
		}

		if (timeRange) {
			whereConditions.push(`created_at >= $startTime AND created_at <= $endTime`);
			params.startTime = timeRange.start.toISOString();
			params.endTime = timeRange.end.toISOString();
		}

		const whereClause = whereConditions.length > 0
			? `WHERE ${whereConditions.join(' AND ')}`
			: '';

		// Get basic conversation metrics
		const metricsQuery = `
			SELECT
				count() as total_conversations,
				math::mean(duration) as average_duration,
				math::mean(interaction_quality) as average_quality,
				math::mean(constitutional_alignment) as average_alignment,
				array::distinct(conversation_type) as conversation_types
			FROM conversation ${whereClause} GROUP ALL
		`;

		const metricsResult = await this.surrealDBService.query(metricsQuery, params);
		const metrics = (metricsResult.data as any[])?.[0] || {};

		return {
			conversationFrequency: {},
			averageDuration: metrics.average_duration || 0,
			peakActiveHours: [],
			participationDistribution: {},
			facilitationPatterns: {},
			observationPatterns: {},
			topicDistribution: {},
			emotionalTrends: [],
			consensusPatterns: [],
			relationshipGrowth: {},
			collaborationNetworks: [],
			mentorshipPatterns: [],
			knowledgeFlowPatterns: [],
			skillDevelopmentTrends: {},
			wisdomEmergence: [],
			decisionQuality: metrics.average_quality || 0,
			implementationSuccess: 0,
			consensusEffectiveness: 0,
			overallCohesion: metrics.average_alignment || 0,
			communicationHealth: 0,
			conflictResolution: 0,
			innovationLevel: 0
		};
	}

	/**
	 * Update conversation analysis based on new message
	 */
	private async updateConversationAnalysis(
		conversationId: string,
		message: CouncilMessage
	): Promise<void> {
		// Analyze emotional impact
		const emotionalUpdate = this.analyzeEmotionalImpact(message);

		// Update conversation with new timestamp
		await this.surrealDBService.update({
			table: 'conversation',
			id: conversationId,
			data: {
				updated_at: message.timestamp
			}
		});
	}

	/**
	 * Update relationship bonds based on message interactions
	 */
	private async updateRelationshipBondsFromMessage(message: CouncilMessage): Promise<void> {
		// Analyze the message for relationship impact
		const bondUpdates = this.analyzeRelationshipImpact(message);

		// Update bonds between sender and mentioned members
		for (const mentionedId of message.mentionsMembers) {
			if (mentionedId !== message.senderId) {
				// Check if bond exists
				const bondId = `${message.senderId}_to_${mentionedId}`;
				const existingBond = await this.surrealDBService.select('relationship_bond', bondId);

				if (existingBond.success && existingBond.data && existingBond.data.length > 0) {
					// Update existing bond
					await this.surrealDBService.query(
						`UPDATE relationship_bond:$bondId SET
							interaction_count += 1,
							positive_interactions += 1,
							last_interaction = $timestamp,
							understanding = understanding + 0.01,
							collaboration = collaboration + 0.005`,
						{
							bondId,
							timestamp: message.timestamp
						}
					);
				}
			}
		}
	}

	/**
	 * Extract learning experiences from completed conversation
	 */
	private async extractLearningFromConversation(conversationId: string): Promise<void> {
		const conversation = await this.getConversation(conversationId);
		if (!conversation) return;

		// Extract learning for each participant
		for (const participantId of conversation.participantIds) {
			const learningData = {
				member_id: participantId,
				timestamp: new Date(),
				category: 'interaction',
				description: `Participated in ${conversation.conversationType} conversation: ${conversation.title}`,
				context: {
					conversationId,
					conversationType: conversation.conversationType,
					duration: conversation.duration,
					participantCount: conversation.participantIds.length
				},
				participating_members: conversation.participantIds,
				knowledge_gained: conversation.learningOutcomes.knowledgeGenerated,
				skills_improved: conversation.learningOutcomes.skillsDeveloped,
				personality_adjustments: {},
				emotional_impact: {},
				relationship_changes: {},
				decision_quality: conversation.analysis.resolutionQuality,
				outcome_alignment: conversation.interactionQuality,
				ethical_alignment: conversation.ethicalCompliance,
				confidence_level: 0.8,
				applicability: [conversation.conversationType],
				wisdom_gained: conversation.analysis.criticalThinking * 0.1,
				empathy_growth: conversation.analysis.empathyDemonstrated * 0.1
			};

			await this.surrealDBService.create({
				table: 'learning_experience',
				data: learningData
			});
		}
	}

	/**
	 * Analyze emotional impact of a message
	 */
	private analyzeEmotionalImpact(message: CouncilMessage): any {
		// Sophisticated emotional analysis would go here
		// For now, return basic analysis based on emotional tone
		return {
			dominantEmotion: message.emotionalTone.primary,
			intensity: message.emotionalTone.intensity,
			sentiment: message.emotionalTone.sentiment
		};
	}

	/**
	 * Analyze relationship impact of a message
	 */
	private analyzeRelationshipImpact(message: CouncilMessage): any {
		// Analyze message for relationship implications
		return {
			collaborationIncrease: (message.collaborationInvite?.length ?? 0) > 0 ? 0.01 : 0,
			understandingIncrease: message.insightsOffered.length > 0 ? 0.005 : 0,
			trustIncrease: message.messageType === 'feedback' ? 0.002 : 0
		};
	}

	/**
	 * Map SurrealDB record to CouncilMessage interface
	 */
	private mapToCouncilMessage(record: any): CouncilMessage {
		return {
			id: typeof record.id === 'string' ? record.id : record.id?.id || record.id,
			conversationId: record.conversation_id,
			senderId: record.sender_id,
			senderName: record.sender_name,
			senderRole: record.sender_role,
			timestamp: new Date(record.timestamp),
			content: record.content,
			messageType: record.message_type,
			emotionalTone: record.emotional_tone || {},
			ethicalImplications: record.ethical_implications || [],
			constitutionalReferences: record.constitutional_references || [],
			decisionImpact: record.decision_impact || 0,
			expertiseRequired: record.expertise_required || [],
			mentionsMembers: record.mentions_members || [],
			respondsToMessage: record.responds_to_message,
			collaborationInvite: record.collaboration_invite || [],
			knowledgeShared: record.knowledge_shared || [],
			questionsAsked: record.questions_asked || [],
			insightsOffered: record.insights_offered || [],
			processingTime: record.processing_time,
			responseCount: record.response_count || 0,
			editHistory: record.edit_history || [],
			reactions: record.reactions || [],
			metadata: record.metadata || {}
		};
	}

	/**
	 * Map SurrealDB record to CouncilConversation interface
	 */
	private mapToCouncilConversation(record: any, messages: CouncilMessage[]): CouncilConversation {
		const id = typeof record.id === 'string' ? record.id : record.id?.id || record.id;

		return {
			id,
			title: record.title,
			description: record.description,
			conversationType: record.conversation_type,
			participantIds: record.participant_ids || [],
			facilitatorId: record.facilitator_id,
			observerIds: record.observer_ids || [],
			createdAt: new Date(record.created_at),
			updatedAt: new Date(record.updated_at),
			startedAt: record.started_at ? new Date(record.started_at) : undefined,
			endedAt: record.ended_at ? new Date(record.ended_at) : undefined,
			duration: record.duration,
			messages,
			messageCount: record.message_count || 0,
			emotionalContext: record.emotional_context || {
				dominantEmotions: {},
				emotionalJourney: [],
				conflictLevel: 0,
				collaborationLevel: 0.8,
				engagementLevel: 0.7
			},
			interactionDepth: record.interaction_depth || 'moderate',
			interactionQuality: record.interaction_quality || 0.7,
			relationshipImpact: record.relationship_impact || {
				strengthenedBonds: [],
				strainedRelationships: [],
				newConnections: []
			},
			sharedValues: record.shared_values || [],
			sharedExperiences: record.shared_experiences || [],
			consensusAreas: record.consensus_areas || [],
			divergenceAreas: record.divergence_areas || [],
			learningOutcomes: record.learning_outcomes || {
				knowledgeGenerated: [],
				insightsGained: [],
				skillsDeveloped: [],
				wisdomEmerged: []
			},
			decisionsReached: record.decisions_reached || [],
			actionItems: record.action_items || [],
			analysis: record.analysis || {
				participationBalance: {},
				communicationPatterns: [],
				emergentThemes: [],
				unexploredAreas: [],
				resolutionQuality: 0.7,
				creativityLevel: 0.6,
				criticalThinking: 0.8,
				empathyDemonstrated: 0.7
			},
			followUpRequired: record.follow_up_required || false,
			nextSteps: record.next_steps || [],
			relatedConversations: record.related_conversations || [],
			parentConversation: record.parent_conversation,
			constitutionalAlignment: record.constitutional_alignment || 0.8,
			ethicalCompliance: record.ethical_compliance || 0.9,
			valueAlignment: record.value_alignment || {},
			tags: record.tags || [],
			metadata: record.metadata || {}
		};
	}
}

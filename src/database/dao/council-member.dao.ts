/**
 * Council Member Data Access Object
 * 
 * Manages Council Member consciousness data with emotional intelligence,
 * relationship tracking, and learning capabilities using SurrealDB
 */

import { surrealDBService } from '../../services/surrealdb-service';
import {
	CouncilMemberConsciousness,
	PersonalityTraits,
	EmotionalState,
	RelationshipBond,
	LearningHistory,
	InteractionPreferences,
	CouncilMemberParameters,
	ConsciousnessUpdate,
	ConsciousnessSnapshot
} from '@/types/council-consciousness.types';

export class CouncilMemberDAO {
	private surrealDBService = surrealDBService;

	constructor() {
		// SurrealDB service is a singleton, no need to inject
	}

	/**
	 * Create a new Council Member with full consciousness structure
	 */
	async createCouncilMember(consciousness: Partial<CouncilMemberConsciousness>): Promise<CouncilMemberConsciousness> {
		const now = new Date();
		
		// Set defaults for required fields
		const memberData = {
			id: consciousness.id || crypto.randomUUID(),
			name: consciousness.name!,
			role: consciousness.role!,
			familyRole: consciousness.familyRole,
			personalityTraits: consciousness.personalityTraits || this.getDefaultPersonalityTraits(),
			emotionalState: consciousness.emotionalState || this.getDefaultEmotionalState(),
			relationshipBonds: consciousness.relationshipBonds || {},
			learningHistory: consciousness.learningHistory || [],
			interactionPreferences: consciousness.interactionPreferences || this.getDefaultInteractionPreferences(),
			parameters: consciousness.parameters || this.getDefaultParameters(),
			isActive: consciousness.isActive ?? true,
			lastInteraction: consciousness.lastInteraction || now,
			createdAt: consciousness.createdAt || now,
			updatedAt: now,
			constitutionalAlignment: consciousness.constitutionalAlignment ?? 0.8,
			ethicalDecisionCount: consciousness.ethicalDecisionCount ?? 0,
			voteParticipation: consciousness.voteParticipation ?? 0.0,
			collaborationScore: consciousness.collaborationScore ?? 0.5,
			wisdomScore: consciousness.wisdomScore ?? 0.3,
			empathyGrowth: consciousness.empathyGrowth ?? 0.4,
			leadershipCapacity: consciousness.leadershipCapacity ?? 0.5,
			mentoringAbility: consciousness.mentoringAbility ?? 0.4,
			knowledgeDomains: consciousness.knowledgeDomains || {},
			skillsets: consciousness.skillsets || {},
			currentMood: consciousness.currentMood || 'optimistic',
			currentPriorities: consciousness.currentPriorities || ['ethical-alignment', 'collaboration'],
			currentConcerns: consciousness.currentConcerns || [],
			currentGoals: consciousness.currentGoals || ['effective-decision-making'],
			metadata: consciousness.metadata || {}
		};

		// Create the council member record in SurrealDB
		const surrealData = {
			name: memberData.name,
			role: memberData.role,
			family_role: memberData.familyRole,
			is_active: memberData.isActive,
			last_interaction: memberData.lastInteraction,
			created_at: memberData.createdAt,
			updated_at: memberData.updatedAt,
			personality_traits: memberData.personalityTraits,
			emotional_state: memberData.emotionalState,
			interaction_preferences: memberData.interactionPreferences,
			parameters: memberData.parameters,
			constitutional_alignment: memberData.constitutionalAlignment,
			ethical_decision_count: memberData.ethicalDecisionCount,
			vote_participation: memberData.voteParticipation,
			collaboration_score: memberData.collaborationScore,
			wisdom_score: memberData.wisdomScore,
			empathy_growth: memberData.empathyGrowth,
			leadership_capacity: memberData.leadershipCapacity,
			mentoring_ability: memberData.mentoringAbility,
			knowledge_domains: memberData.knowledgeDomains,
			skillsets: memberData.skillsets,
			current_mood: memberData.currentMood,
			current_priorities: memberData.currentPriorities,
			current_concerns: memberData.currentConcerns,
			current_goals: memberData.currentGoals,
			metadata: memberData.metadata
		};

		const result = await this.surrealDBService.create({
			table: 'council_member',
			id: memberData.id,
			data: surrealData
		});

		if (!result.success) {
			throw new Error(`Failed to create council member: ${result.error}`);
		}

		// Create initial relationship bonds with existing members
		await this.createRelationshipBondsForNewMember(memberData.id);

		return memberData as CouncilMemberConsciousness;
	}

	/**
	 * Retrieve a Council Member with full consciousness data
	 */
	async getCouncilMember(memberId: string): Promise<CouncilMemberConsciousness | null> {
		const result = await this.surrealDBService.select('council_member', memberId);

		if (!result.success || !result.data || result.data.length === 0) {
			return null;
		}

		const memberRecord = result.data[0];
		
		// Get relationship bonds for this member
		const bondsResult = await this.surrealDBService.query(
			'SELECT * FROM relationship_bond WHERE member1_id = $memberId',
			{ memberId }
		);

		const relationshipBonds: Record<string, RelationshipBond> = {};
		const bondsData = Array.isArray(bondsResult.data) ? bondsResult.data : [];
		if (bondsResult.success && bondsData.length > 0) {
			for (const bond of bondsData) {
				relationshipBonds[bond.member2_id] = {
					memberId: bond.member2_id,
					memberName: bond.member2_name,
					trust: bond.trust,
					respect: bond.respect,
					affinity: bond.affinity,
					collaboration: bond.collaboration,
					understanding: bond.understanding,
					interactionCount: bond.interaction_count,
					positiveInteractions: bond.positive_interactions,
					negativeInteractions: bond.negative_interactions,
					neutralInteractions: bond.neutral_interactions,
					communicationStyle: bond.communication_style,
					conflictResolutionStyle: bond.conflict_resolution_style,
					relationshipTrend: bond.relationship_trend,
					lastInteraction: new Date(bond.last_interaction),
					relationshipDuration: bond.relationship_duration,
					sharedValues: bond.shared_values,
					sharedExperiences: bond.shared_experiences,
					collaborativeAccomplishments: bond.collaborative_accomplishments
				};
			}
		}

		return this.mapSurrealToCouncilMemberConsciousness(memberRecord, relationshipBonds);
	}

	/**
	 * Update Council Member consciousness data
	 */
	async updateConsciousness(
		memberId: string,
		updates: Partial<CouncilMemberConsciousness>,
		updateTrigger: string = 'manual'
	): Promise<CouncilMemberConsciousness | null> {
		const now = new Date();
		
		// Create consciousness update record for tracking evolution
		const consciousnessUpdate: ConsciousnessUpdate = {
			memberId,
			timestamp: now,
			updateType: this.determineUpdateType(updates),
			changes: {
				...(updates.personalityTraits && { personalityTraits: updates.personalityTraits }),
				...(updates.emotionalState && { emotionalState: updates.emotionalState }),
				...(updates.relationshipBonds && { relationshipBonds: updates.relationshipBonds }),
				...(updates.parameters && { parameters: updates.parameters })
			},
			trigger: this.determineTrigger(updateTrigger),
			triggerDetails: updateTrigger,
			significanceLevel: this.calculateSignificanceLevel(updates),
			confidenceLevel: 0.8 // Default confidence
		};

		// Record the update
		await this.recordConsciousnessUpdate(consciousnessUpdate);

		// Prepare update data for SurrealDB
		const updateData: any = {
			updated_at: now
		};

		// Update main member properties
		if (updates.currentMood) {
			updateData.current_mood = updates.currentMood;
		}

		if (updates.currentPriorities) {
			updateData.current_priorities = updates.currentPriorities;
		}

		if (updates.currentConcerns) {
			updateData.current_concerns = updates.currentConcerns;
		}

		if (updates.currentGoals) {
			updateData.current_goals = updates.currentGoals;
		}

		// Get current member data for merging
		const currentMember = await this.getCouncilMember(memberId);
		if (!currentMember) {
			throw new Error(`Council member ${memberId} not found`);
		}

		// Update personality traits if provided
		if (updates.personalityTraits) {
			updateData.personality_traits = {
				...currentMember.personalityTraits,
				...updates.personalityTraits
			} as PersonalityTraits;
		}

		// Update emotional state if provided
		if (updates.emotionalState) {
			updateData.emotional_state = {
				...currentMember.emotionalState,
				...updates.emotionalState,
				last_emotional_update: now
			} as EmotionalState;
		}

		// Update interaction preferences if provided
		if (updates.interactionPreferences) {
			updateData.interaction_preferences = updates.interactionPreferences;
		}

		// Update parameters if provided
		if (updates.parameters) {
			updateData.parameters = updates.parameters;
		}

		// Apply the updates
		const result = await this.surrealDBService.update({
			table: 'council_member',
			id: memberId,
			data: updateData
		});

		if (!result.success) {
			throw new Error(`Failed to update consciousness for member ${memberId}: ${result.error}`);
		}

		return this.getCouncilMember(memberId);
	}

	/**
	 * Add a learning experience to a Council Member
	 */
	async addLearningExperience(
		memberId: string,
		learning: Omit<LearningHistory, 'experienceId' | 'timestamp'>
	): Promise<void> {
		const learningExperience: LearningHistory = {
			...learning,
			experienceId: crypto.randomUUID(),
			timestamp: new Date()
		};

		// Create the learning experience record
		const learningData = {
			member_id: memberId,
			timestamp: learningExperience.timestamp,
			category: learningExperience.category,
			description: learningExperience.description,
			context: learningExperience.context,
			participating_members: learningExperience.participatingMembers,
			knowledge_gained: learningExperience.knowledgeGained,
			skills_improved: learningExperience.skillsImproved,
			personality_adjustments: learningExperience.personalityAdjustments,
			emotional_impact: learningExperience.emotionalImpact,
			relationship_changes: learningExperience.relationshipChanges,
			decision_quality: learningExperience.decisionQuality,
			outcome_alignment: learningExperience.outcomeAlignment,
			ethical_alignment: learningExperience.ethicalAlignment,
			confidence_level: learningExperience.confidenceLevel,
			applicability: learningExperience.applicability,
			wisdom_gained: learningExperience.wisdomGained,
			empathy_growth: learningExperience.empathyGrowth
		};

		const result = await this.surrealDBService.create({
			table: 'learning_experience',
			id: learningExperience.experienceId,
			data: learningData
		});

		if (!result.success) {
			throw new Error(`Failed to create learning experience: ${result.error}`);
		}

		// Update member's wisdom and empathy scores
		const currentMember = await this.getCouncilMember(memberId);
		if (currentMember) {
			const updateData = {
				wisdom_score: currentMember.wisdomScore + (learningExperience.wisdomGained * 0.1),
				empathy_growth: currentMember.empathyGrowth + (learningExperience.empathyGrowth * 0.1),
				updated_at: new Date()
			};

			await this.surrealDBService.update({
				table: 'council_member',
				id: memberId,
				data: updateData
			});
		}

		// Apply personality and emotional adjustments if provided
		if (learningExperience.personalityAdjustments || learningExperience.emotionalImpact) {
			await this.updateConsciousness(memberId, {
				personalityTraits: learningExperience.personalityAdjustments as PersonalityTraits,
				emotionalState: learningExperience.emotionalImpact as EmotionalState
			}, `learning-experience: ${learning.description}`);
		}
	}

	/**
	 * Update relationship bond between two Council Members
	 */
	async updateRelationshipBond(
		member1Id: string,
		member2Id: string,
		bondUpdates: Partial<RelationshipBond>
	): Promise<void> {
		const now = new Date();
		const bondId = `${member1Id}_to_${member2Id}`;

		// Get current bond data
		const currentBondResult = await this.surrealDBService.select('relationship_bond', bondId);
		if (!currentBondResult.success || !currentBondResult.data || currentBondResult.data.length === 0) {
			throw new Error(`Relationship bond ${bondId} not found`);
		}

		const currentBond = currentBondResult.data[0];
		
		// Prepare update data
		const updateData: any = {
			updated_at: now
		};

		if (typeof bondUpdates.trust === 'number') {
			updateData.trust = bondUpdates.trust;
		}

		if (typeof bondUpdates.respect === 'number') {
			updateData.respect = bondUpdates.respect;
		}

		if (typeof bondUpdates.affinity === 'number') {
			updateData.affinity = bondUpdates.affinity;
		}

		if (typeof bondUpdates.collaboration === 'number') {
			updateData.collaboration = bondUpdates.collaboration;
		}

		if (typeof bondUpdates.understanding === 'number') {
			updateData.understanding = bondUpdates.understanding;
		}

		if (bondUpdates.relationshipTrend) {
			updateData.relationship_trend = bondUpdates.relationshipTrend;
		}

		if (bondUpdates.sharedExperiences) {
			const currentShared = Array.isArray(currentBond.shared_experiences) ? currentBond.shared_experiences : [];
			updateData.shared_experiences = [
				...currentShared,
				...bondUpdates.sharedExperiences
			];
		}

		if (bondUpdates.collaborativeAccomplishments) {
			const currentAccomplishments = Array.isArray(currentBond.collaborative_accomplishments) ? currentBond.collaborative_accomplishments : [];
			updateData.collaborative_accomplishments = [
				...currentAccomplishments,
				...bondUpdates.collaborativeAccomplishments
			];
		}

		// Update interaction counts if provided
		if (typeof bondUpdates.interactionCount === 'number') {
			updateData.interaction_count = bondUpdates.interactionCount;
		}

		if (typeof bondUpdates.positiveInteractions === 'number') {
			updateData.positive_interactions = bondUpdates.positiveInteractions;
		}

		if (typeof bondUpdates.negativeInteractions === 'number') {
			updateData.negative_interactions = bondUpdates.negativeInteractions;
		}

		if (typeof bondUpdates.neutralInteractions === 'number') {
			updateData.neutral_interactions = bondUpdates.neutralInteractions;
		}

		const result = await this.surrealDBService.update({
			table: 'relationship_bond',
			id: bondId,
			data: updateData
		});

		if (!result.success) {
			throw new Error(`Failed to update relationship bond: ${result.error}`);
		}
	}

	/**
	 * Get all active Council Members
	 */
	async getAllActiveCouncilMembers(): Promise<CouncilMemberConsciousness[]> {
		const result = await this.surrealDBService.query(
			'SELECT * FROM council_member WHERE is_active = true ORDER BY name'
		);

		if (!result.success || !result.data) {
			return [];
		}

		const members: CouncilMemberConsciousness[] = [];
		const membersData = Array.isArray(result.data) ? result.data : [];

		for (const memberRecord of membersData) {
			// Get relationship bonds for each member
			const bondsResult = await this.surrealDBService.query(
				'SELECT * FROM relationship_bond WHERE member1_id = $memberId',
				{ memberId: memberRecord.id }
			);

			const relationshipBonds: Record<string, RelationshipBond> = {};
			const bondsDataLoop = Array.isArray(bondsResult.data) ? bondsResult.data : [];
			if (bondsResult.success && bondsDataLoop.length > 0) {
				for (const bond of bondsDataLoop) {
					relationshipBonds[bond.member2_id] = {
						memberId: bond.member2_id,
						memberName: bond.member2_name,
						trust: bond.trust,
						respect: bond.respect,
						affinity: bond.affinity,
						collaboration: bond.collaboration,
						understanding: bond.understanding,
						interactionCount: bond.interaction_count,
						positiveInteractions: bond.positive_interactions,
						negativeInteractions: bond.negative_interactions,
						neutralInteractions: bond.neutral_interactions,
						communicationStyle: bond.communication_style,
						conflictResolutionStyle: bond.conflict_resolution_style,
						relationshipTrend: bond.relationship_trend,
						lastInteraction: new Date(bond.last_interaction),
						relationshipDuration: bond.relationship_duration,
						sharedValues: bond.shared_values,
						sharedExperiences: bond.shared_experiences,
						collaborativeAccomplishments: bond.collaborative_accomplishments
					};
				}
			}

			members.push(this.mapSurrealToCouncilMemberConsciousness(memberRecord, relationshipBonds));
		}

		return members;
	}

	/**
	 * Create relationship bonds for a new member with all existing members
	 */
	private async createRelationshipBondsForNewMember(newMemberId: string): Promise<void> {
		// Get the new member
		const newMemberResult = await this.surrealDBService.select('council_member', newMemberId);
		if (!newMemberResult.success || !newMemberResult.data || newMemberResult.data.length === 0) {
			throw new Error(`New member ${newMemberId} not found`);
		}
		const newMember = newMemberResult.data[0];

		// Get all existing members (excluding the new member)
		const existingMembersResult = await this.surrealDBService.query(
			'SELECT * FROM council_member WHERE id != $newMemberId',
			{ newMemberId }
		);

		if (!existingMembersResult.success || !existingMembersResult.data) {
			return; // No existing members to create bonds with
		}

		const existingMembersData = Array.isArray(existingMembersResult.data) ? existingMembersResult.data : [];

		const bondData = {
			trust: 0.7,
			respect: 0.8,
			affinity: 0.6,
			collaboration: 0.5,
			understanding: 0.5,
			interaction_count: 0,
			positive_interactions: 0,
			negative_interactions: 0,
			neutral_interactions: 0,
			communication_style: 'formal',
			conflict_resolution_style: 'collaborative',
			relationship_trend: 'stable',
			last_interaction: new Date(),
			relationship_duration: 0,
			shared_values: ['ethical-governance', 'collaborative-decision-making'],
			shared_experiences: ['council-formation'],
			collaborative_accomplishments: [],
			created_at: new Date(),
			updated_at: new Date()
		};

		// Create bidirectional bonds with each existing member
		for (const existingMember of existingMembersData) {
			// Bond from new member to existing member
			try {
				await this.surrealDBService.create({
					table: 'relationship_bond',
					id: `${newMemberId}_to_${existingMember.id}`,
					data: {
						...bondData,
						member1_id: newMemberId,
						member2_id: existingMember.id,
						member1_name: newMember.name,
						member2_name: existingMember.name
					}
				});
			} catch (error) {
				// Bond might already exist
			}

			// Bond from existing member to new member
			try {
				await this.surrealDBService.create({
					table: 'relationship_bond',
					id: `${existingMember.id}_to_${newMemberId}`,
					data: {
						...bondData,
						member1_id: existingMember.id,
						member2_id: newMemberId,
						member1_name: existingMember.name,
						member2_name: newMember.name
					}
				});
			} catch (error) {
				// Bond might already exist
			}
		}
	}

	/**
	 * Record a consciousness update for tracking evolution
	 */
	private async recordConsciousnessUpdate(update: ConsciousnessUpdate): Promise<void> {
		const updateData = {
			member_id: update.memberId,
			timestamp: update.timestamp,
			update_type: update.updateType,
			changes: update.changes,
			trigger: update.trigger,
			trigger_details: update.triggerDetails,
			significance_level: update.significanceLevel,
			confidence_level: update.confidenceLevel
		};

		const result = await this.surrealDBService.create({
			table: 'consciousness_update',
			data: updateData
		});

		if (!result.success) {
			throw new Error(`Failed to record consciousness update: ${result.error}`);
		}
	}

	/**
	 * Map SurrealDB record to CouncilMemberConsciousness interface
	 */
	private mapSurrealToCouncilMemberConsciousness(
		record: any, 
		relationshipBonds: Record<string, RelationshipBond>
	): CouncilMemberConsciousness {
		return {
			id: record.id,
			name: record.name,
			role: record.role,
			familyRole: record.family_role,
			personalityTraits: record.personality_traits || this.getDefaultPersonalityTraits(),
			emotionalState: record.emotional_state || this.getDefaultEmotionalState(),
			relationshipBonds,
			learningHistory: [], // TODO: Load learning history separately
			interactionPreferences: record.interaction_preferences || this.getDefaultInteractionPreferences(),
			parameters: record.parameters || this.getDefaultParameters(),
			isActive: record.is_active,
			lastInteraction: new Date(record.last_interaction),
			createdAt: new Date(record.created_at),
			updatedAt: new Date(record.updated_at),
			constitutionalAlignment: record.constitutional_alignment,
			ethicalDecisionCount: record.ethical_decision_count,
			voteParticipation: record.vote_participation,
			collaborationScore: record.collaboration_score,
			wisdomScore: record.wisdom_score,
			empathyGrowth: record.empathy_growth,
			leadershipCapacity: record.leadership_capacity,
			mentoringAbility: record.mentoring_ability,
			knowledgeDomains: record.knowledge_domains || {},
			skillsets: record.skillsets || {},
			currentMood: record.current_mood,
			currentPriorities: record.current_priorities || [],
			currentConcerns: record.current_concerns || [],
			currentGoals: record.current_goals || [],
			metadata: record.metadata || {}
		};
	}

	/**
	 * Map Neo4j record to CouncilMemberConsciousness interface (legacy)
	 */
	private mapToCouncilMemberConsciousness(record: any): CouncilMemberConsciousness {
		const cm = record.cm;
		const pt = record.pt;
		const es = record.es;
		const ip = record.ip;
		const p = record.p;
		const relationshipBonds = record.relationshipBonds || [];

		const relationshipBondsMap: Record<string, RelationshipBond> = {};
		relationshipBonds.forEach((bond: any) => {
			if (bond && bond.member2Id) {
				relationshipBondsMap[bond.member2Id] = {
					memberId: bond.member2Id,
					memberName: bond.member2Name,
					trust: bond.trust || 0.7,
					respect: bond.respect || 0.8,
					affinity: bond.affinity || 0.6,
					collaboration: bond.collaboration || 0.5,
					understanding: bond.understanding || 0.5,
					interactionCount: bond.interactionCount || 0,
					positiveInteractions: bond.positiveInteractions || 0,
					negativeInteractions: bond.negativeInteractions || 0,
					neutralInteractions: bond.neutralInteractions || 0,
					communicationStyle: bond.communicationStyle || 'formal',
					conflictResolutionStyle: bond.conflictResolutionStyle || 'collaborative',
					relationshipTrend: bond.relationshipTrend || 'stable',
					lastInteraction: new Date(bond.lastInteraction),
					relationshipDuration: bond.relationshipDuration || 0,
					sharedValues: bond.sharedValues || [],
					sharedExperiences: bond.sharedExperiences || [],
					collaborativeAccomplishments: bond.collaborativeAccomplishments || []
				};
			}
		});

		return {
			id: cm.id,
			name: cm.name,
			role: cm.role,
			familyRole: cm.familyRole,
			personalityTraits: pt ? {
				openness: pt.openness,
				conscientiousness: pt.conscientiousness,
				extraversion: pt.extraversion,
				agreeableness: pt.agreeableness,
				neuroticism: pt.neuroticism,
				ethicalRigidity: pt.ethicalRigidity,
				decisionConfidence: pt.decisionConfidence,
				collaborationPreference: pt.collaborationPreference,
				innovationTendency: pt.innovationTendency,
				trustInCouncil: pt.trustInCouncil,
				learningRate: pt.learningRate,
				customTraits: pt.customTraits || {}
			} : this.getDefaultPersonalityTraits(),
			emotionalState: es ? {
				joy: es.joy,
				sadness: es.sadness,
				anger: es.anger,
				fear: es.fear,
				surprise: es.surprise,
				disgust: es.disgust,
				pride: es.pride,
				shame: es.shame,
				guilt: es.guilt,
				empathy: es.empathy,
				curiosity: es.curiosity,
				frustration: es.frustration,
				satisfaction: es.satisfaction,
				ethicalConcern: es.ethicalConcern,
				decisionAnxiety: es.decisionAnxiety,
				collegialWarmth: es.collegialWarmth,
				missionAlignment: es.missionAlignment,
				emotionalStability: es.emotionalStability,
				empathicResonance: es.empathicResonance,
				dominantEmotion: es.dominantEmotion as any,
				emotionalTrend: es.emotionalTrend as any,
				lastEmotionalUpdate: new Date(es.lastEmotionalUpdate)
			} : this.getDefaultEmotionalState(),
			relationshipBonds: relationshipBondsMap,
			learningHistory: [], // TODO: Load learning history separately
			interactionPreferences: ip || this.getDefaultInteractionPreferences(),
			parameters: p || this.getDefaultParameters(),
			isActive: cm.isActive,
			lastInteraction: new Date(cm.lastInteraction),
			createdAt: new Date(cm.createdAt),
			updatedAt: new Date(cm.updatedAt),
			constitutionalAlignment: cm.constitutionalAlignment,
			ethicalDecisionCount: cm.ethicalDecisionCount,
			voteParticipation: cm.voteParticipation,
			collaborationScore: cm.collaborationScore,
			wisdomScore: cm.wisdomScore,
			empathyGrowth: cm.empathyGrowth,
			leadershipCapacity: cm.leadershipCapacity,
			mentoringAbility: cm.mentoringAbility,
			knowledgeDomains: cm.knowledgeDomains || {},
			skillsets: cm.skillsets || {},
			currentMood: cm.currentMood,
			currentPriorities: cm.currentPriorities || [],
			currentConcerns: cm.currentConcerns || [],
			currentGoals: cm.currentGoals || [],
			metadata: cm.metadata || {}
		};
	}

	// Default value generators
	private getDefaultPersonalityTraits(): PersonalityTraits {
		return {
			openness: 0.7,
			conscientiousness: 0.8,
			extraversion: 0.6,
			agreeableness: 0.9,
			neuroticism: 0.3,
			ethicalRigidity: 0.7,
			decisionConfidence: 0.8,
			collaborationPreference: 0.9,
			innovationTendency: 0.7,
			trustInCouncil: 0.8,
			learningRate: 0.8,
			customTraits: {}
		};
	}

	private getDefaultEmotionalState(): EmotionalState {
		return {
			joy: 0.7,
			sadness: 0.1,
			anger: 0.1,
			fear: 0.2,
			surprise: 0.3,
			disgust: 0.1,
			pride: 0.6,
			shame: 0.1,
			guilt: 0.1,
			empathy: 0.8,
			curiosity: 0.9,
			frustration: 0.2,
			satisfaction: 0.7,
			ethicalConcern: 0.8,
			decisionAnxiety: 0.3,
			collegialWarmth: 0.8,
			missionAlignment: 0.9,
			emotionalStability: 0.7,
			empathicResonance: 0.8,
			dominantEmotion: 'curiosity',
			emotionalTrend: 'stable',
			lastEmotionalUpdate: new Date()
		};
	}

	private getDefaultInteractionPreferences(): InteractionPreferences {
		return {
			preferredCommunicationStyle: 'analytical',
			responseTimePreference: 'considered',
			detailLevel: 'comprehensive',
			meetingStyle: 'outcome-focused',
			decisionMakingStyle: 'consensus',
			conflictHandling: 'address-directly',
			informationProcessing: 'holistic',
			learningStyle: 'collaborative',
			workingEnvironment: 'collaborative',
			feedbackPreference: 'milestone-based',
			adaptToMemberStyle: true,
			culturalSensitivity: 0.9
		};
	}

	private getDefaultParameters(): CouncilMemberParameters {
		return {
			modelId: 'claude-sonnet-4',
			temperature: 0.7,
			topP: 0.9,
			maxTokens: 4096,
			ethicalThreshold: 0.8,
			constitutionalWeight: 0.9,
			precedenceWeight: 0.7,
			riskTolerance: 0.6,
			innovationBias: 0.3,
			collaborationRequirement: 0.8,
			memoryRetention: 0.9,
			adaptationRate: 0.7,
			crossMemberLearning: true,
			responseOptimization: 'quality',
			contextWindow: 10,
			specializedCapabilities: ['ethical-reasoning', 'collaborative-decision-making'],
			expertiseDomains: ['general'],
			currentFocus: ['council-integration', 'relationship-building'],
			temporaryConstraints: {}
		};
	}

	// Helper methods
	private determineUpdateType(updates: Partial<CouncilMemberConsciousness>): ConsciousnessUpdate['updateType'] {
		if (updates.personalityTraits) return 'personality';
		if (updates.emotionalState) return 'emotional';
		if (updates.relationshipBonds) return 'relational';
		if (updates.parameters) return 'parameters';
		return 'learning';
	}

	private determineTrigger(updateTrigger: string): ConsciousnessUpdate['trigger'] {
		if (updateTrigger.includes('interaction')) return 'interaction';
		if (updateTrigger.includes('outcome')) return 'outcome';
		if (updateTrigger.includes('feedback')) return 'feedback';
		if (updateTrigger.includes('time')) return 'time-based';
		return 'manual';
	}

	private calculateSignificanceLevel(updates: Partial<CouncilMemberConsciousness>): number {
		let significance = 0.3; // Base significance
		
		if (updates.personalityTraits) significance += 0.4;
		if (updates.emotionalState) significance += 0.3;
		if (updates.relationshipBonds) significance += 0.2;
		if (updates.parameters) significance += 0.1;
		
		return Math.min(significance, 1.0);
	}
}
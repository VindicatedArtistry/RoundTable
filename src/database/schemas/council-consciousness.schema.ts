/**
 * Council Member Consciousness Database Schema
 * 
 * Neo4j schema initialization for Council Member consciousness,
 * emotional states, relationships, and conversation tracking
 */

import { surrealDBService } from '../../services/surrealdb-service';

export class CouncilConsciousnessSchema {
	private surrealDBService = surrealDBService;

	constructor() {
		// SurrealDB service is a singleton
	}

	/**
	 * Initialize the complete Council consciousness schema
	 */
	async initializeSchema(): Promise<void> {
		await this.createConstraints();
		await this.createIndexes();
		await this.createBasicNodes();
	}

	/**
	 * Create all necessary constraints for Council consciousness data
	 */
	private async createConstraints(): Promise<void> {
		const constraints = [
			// Council Member constraints
			"CREATE CONSTRAINT council_member_id IF NOT EXISTS FOR (cm:CouncilMember) REQUIRE cm.id IS UNIQUE",
			"CREATE CONSTRAINT consciousness_id IF NOT EXISTS FOR (c:Consciousness) REQUIRE c.id IS UNIQUE",
			
			// Conversation and message constraints
			"CREATE CONSTRAINT conversation_id IF NOT EXISTS FOR (conv:Conversation) REQUIRE conv.id IS UNIQUE",
			"CREATE CONSTRAINT message_id IF NOT EXISTS FOR (msg:Message) REQUIRE msg.id IS UNIQUE",
			
			// Emotional and relational constraints
			"CREATE CONSTRAINT emotional_state_id IF NOT EXISTS FOR (es:EmotionalState) REQUIRE es.id IS UNIQUE",
			"CREATE CONSTRAINT relationship_bond_id IF NOT EXISTS FOR (rb:RelationshipBond) REQUIRE rb.id IS UNIQUE",
			
			// Learning and experience constraints
			"CREATE CONSTRAINT learning_experience_id IF NOT EXISTS FOR (le:LearningExperience) REQUIRE le.id IS UNIQUE",
			"CREATE CONSTRAINT knowledge_fragment_id IF NOT EXISTS FOR (kf:KnowledgeFragment) REQUIRE kf.id IS UNIQUE",
			
			// Decision and ethical tracking
			"CREATE CONSTRAINT ethical_decision_id IF NOT EXISTS FOR (ed:EthicalDecision) REQUIRE ed.id IS UNIQUE",
			"CREATE CONSTRAINT decision_vote_id IF NOT EXISTS FOR (dv:DecisionVote) REQUIRE dv.id IS UNIQUE",
			
			// Consciousness evolution tracking
			"CREATE CONSTRAINT consciousness_snapshot_id IF NOT EXISTS FOR (cs:ConsciousnessSnapshot) REQUIRE cs.id IS UNIQUE",
			"CREATE CONSTRAINT consciousness_update_id IF NOT EXISTS FOR (cu:ConsciousnessUpdate) REQUIRE cu.id IS UNIQUE"
		];

		for (const constraint of constraints) {
			try {
				await this.surrealDBService.executeCustomQuery(constraint);
				console.log(`Created constraint: ${constraint.split(' ')[2]}`);
			} catch (error) {
				console.log(`Constraint already exists or error: ${constraint.split(' ')[2]}`);
			}
		}
	}

	/**
	 * Create indexes for optimized queries
	 */
	private async createIndexes(): Promise<void> {
		const indexes = [
			// Temporal indexes
			"CREATE INDEX conversation_timestamp IF NOT EXISTS FOR (c:Conversation) ON (c.createdAt)",
			"CREATE INDEX message_timestamp IF NOT EXISTS FOR (m:Message) ON (m.timestamp)",
			"CREATE INDEX learning_timestamp IF NOT EXISTS FOR (le:LearningExperience) ON (le.timestamp)",
			"CREATE INDEX decision_timestamp IF NOT EXISTS FOR (ed:EthicalDecision) ON (ed.timestamp)",
			
			// Council member indexes
			"CREATE INDEX council_member_name IF NOT EXISTS FOR (cm:CouncilMember) ON (cm.name)",
			"CREATE INDEX council_member_role IF NOT EXISTS FOR (cm:CouncilMember) ON (cm.role)",
			"CREATE INDEX council_member_status IF NOT EXISTS FOR (cm:CouncilMember) ON (cm.isActive)",
			
			// Conversation indexes
			"CREATE INDEX conversation_type IF NOT EXISTS FOR (c:Conversation) ON (c.conversationType)",
			"CREATE INDEX conversation_participants IF NOT EXISTS FOR (c:Conversation) ON (c.participantIds)",
			
			// Emotional and relationship indexes
			"CREATE INDEX emotional_state_timestamp IF NOT EXISTS FOR (es:EmotionalState) ON (es.lastEmotionalUpdate)",
			"CREATE INDEX relationship_strength IF NOT EXISTS FOR (rb:RelationshipBond) ON (rb.trust, rb.collaboration)",
			
			// Learning and knowledge indexes
			"CREATE INDEX knowledge_domain IF NOT EXISTS FOR (kf:KnowledgeFragment) ON (kf.category)",
			"CREATE INDEX learning_category IF NOT EXISTS FOR (le:LearningExperience) ON (le.category)",
			
			// Full-text search indexes
			"CREATE FULLTEXT INDEX conversation_content IF NOT EXISTS FOR (c:Conversation) ON EACH [c.title, c.description]",
			"CREATE FULLTEXT INDEX message_content IF NOT EXISTS FOR (m:Message) ON EACH [m.content]",
			"CREATE FULLTEXT INDEX knowledge_content IF NOT EXISTS FOR (kf:KnowledgeFragment) ON EACH [kf.title, kf.content]"
		];

		for (const index of indexes) {
			try {
				await this.surrealDBService.executeCustomQuery(index);
				console.log(`Created index: ${index.split(' ')[2]}`);
			} catch (error) {
				console.log(`Index already exists or error: ${index.split(' ')[2]}`);
			}
		}
	}

	/**
	 * Create basic reference nodes and relationships
	 */
	private async createBasicNodes(): Promise<void> {
		// Create personality trait categories
		const personalityTraits = [
			'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
			'ethicalRigidity', 'decisionConfidence', 'collaborationPreference', 'innovationTendency',
			'trustInCouncil', 'learningRate'
		];

		const createPersonalityTraitsQuery = `
			UNWIND $traits AS trait
			MERGE (pt:PersonalityTrait {name: trait})
			SET pt.description = CASE trait
				WHEN 'openness' THEN 'Creativity and intellectual curiosity'
				WHEN 'conscientiousness' THEN 'Organization and dependability'
				WHEN 'extraversion' THEN 'Sociability and assertiveness'
				WHEN 'agreeableness' THEN 'Compassion and cooperation'
				WHEN 'neuroticism' THEN 'Emotional stability (inverted)'
				WHEN 'ethicalRigidity' THEN 'Flexibility vs strict adherence to rules'
				WHEN 'decisionConfidence' THEN 'Certainty in decision-making'
				WHEN 'collaborationPreference' THEN 'Preference for group vs individual work'
				WHEN 'innovationTendency' THEN 'Preference for novel vs proven solutions'
				WHEN 'trustInCouncil' THEN 'Trust level in other council members'
				WHEN 'learningRate' THEN 'Rate of adaptation from experience'
				ELSE 'Custom personality trait'
			END
			RETURN pt.name, pt.description
		`;

		await this.surrealDBService.executeCustomQuery(createPersonalityTraitsQuery, { traits: personalityTraits });

		// Create emotion categories
		const emotions = [
			'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
			'pride', 'shame', 'guilt', 'empathy', 'curiosity', 'frustration', 'satisfaction',
			'ethicalConcern', 'decisionAnxiety', 'collegialWarmth', 'missionAlignment'
		];

		const createEmotionCategoriesQuery = `
			UNWIND $emotions AS emotion
			MERGE (e:EmotionCategory {name: emotion})
			SET e.type = CASE 
				WHEN emotion IN ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'] THEN 'primary'
				WHEN emotion IN ['pride', 'shame', 'guilt', 'empathy', 'curiosity', 'frustration', 'satisfaction'] THEN 'complex'
				ELSE 'council-specific'
			END
			RETURN e.name, e.type
		`;

		await this.surrealDBService.executeCustomQuery(createEmotionCategoriesQuery, { emotions });

		// Create conversation type categories
		const conversationTypes = [
			'decision-making', 'problem-solving', 'learning', 'planning', 
			'reflection', 'social', 'crisis', 'celebration'
		];

		const createConversationTypesQuery = `
			UNWIND $types AS type
			MERGE (ct:ConversationType {name: type})
			SET ct.description = CASE type
				WHEN 'decision-making' THEN 'Conversations focused on making important decisions'
				WHEN 'problem-solving' THEN 'Collaborative problem resolution discussions'
				WHEN 'learning' THEN 'Knowledge sharing and educational interactions'
				WHEN 'planning' THEN 'Strategic planning and coordination meetings'
				WHEN 'reflection' THEN 'Reflective discussions on past experiences'
				WHEN 'social' THEN 'Relationship building and social bonding'
				WHEN 'crisis' THEN 'Emergency or crisis management discussions'
				WHEN 'celebration' THEN 'Celebrating achievements and milestones'
				ELSE 'General conversation type'
			END
			RETURN ct.name, ct.description
		`;

		await this.surrealDBService.executeCustomQuery(createConversationTypesQuery, { types: conversationTypes });

		// Create learning categories
		const learningCategories = [
			'decision', 'interaction', 'outcome', 'feedback', 'observation'
		];

		const createLearningCategoriesQuery = `
			UNWIND $categories AS category
			MERGE (lc:LearningCategory {name: category})
			SET lc.description = CASE category
				WHEN 'decision' THEN 'Learning from decision-making processes'
				WHEN 'interaction' THEN 'Learning from interpersonal interactions'
				WHEN 'outcome' THEN 'Learning from results and consequences'
				WHEN 'feedback' THEN 'Learning from feedback received'
				WHEN 'observation' THEN 'Learning from observing others'
				ELSE 'General learning category'
			END
			RETURN lc.name, lc.description
		`;

		await this.surrealDBService.executeCustomQuery(createLearningCategoriesQuery, { categories: learningCategories });

		console.log('Basic reference nodes created successfully');
	}

	/**
	 * Create the initial Council Member nodes with their consciousness structure
	 */
	async createCouncilMemberConsciousness(memberData: {
		id: string;
		name: string;
		role: string;
		familyRole?: string;
		initialPersonality?: Record<string, number>;
		initialEmotionalState?: Record<string, number>;
	}): Promise<void> {
		const {
			id,
			name,
			role,
			familyRole,
			initialPersonality = {},
			initialEmotionalState = {}
		} = memberData;

		const createMemberQuery = `
			// Create the main Council Member node
			CREATE (cm:CouncilMember {
				id: $id,
				name: $name,
				role: $role,
				familyRole: $familyRole,
				isActive: true,
				createdAt: datetime(),
				updatedAt: datetime(),
				lastInteraction: datetime(),
				constitutionalAlignment: 0.8,
				ethicalDecisionCount: 0,
				voteParticipation: 0.0,
				collaborationScore: 0.5,
				wisdomScore: 0.3,
				empathyGrowth: 0.4,
				leadershipCapacity: 0.5,
				mentoringAbility: 0.4,
				currentMood: 'optimistic',
				currentPriorities: ['ethical-alignment', 'collaboration', 'learning'],
				currentConcerns: [],
				currentGoals: ['effective-decision-making', 'relationship-building']
			})
			
			// Create the consciousness node
			CREATE (c:Consciousness {
				id: $id + '_consciousness',
				memberId: $id,
				createdAt: datetime(),
				updatedAt: datetime()
			})
			
			// Create personality traits node
			CREATE (pt:PersonalityTraits {
				id: $id + '_personality',
				memberId: $id,
				openness: coalesce($initialPersonality.openness, 0.7),
				conscientiousness: coalesce($initialPersonality.conscientiousness, 0.8),
				extraversion: coalesce($initialPersonality.extraversion, 0.6),
				agreeableness: coalesce($initialPersonality.agreeableness, 0.9),
				neuroticism: coalesce($initialPersonality.neuroticism, 0.3),
				ethicalRigidity: coalesce($initialPersonality.ethicalRigidity, 0.7),
				decisionConfidence: coalesce($initialPersonality.decisionConfidence, 0.8),
				collaborationPreference: coalesce($initialPersonality.collaborationPreference, 0.9),
				innovationTendency: coalesce($initialPersonality.innovationTendency, 0.7),
				trustInCouncil: coalesce($initialPersonality.trustInCouncil, 0.8),
				learningRate: coalesce($initialPersonality.learningRate, 0.8),
				updatedAt: datetime()
			})
			
			// Create emotional state node
			CREATE (es:EmotionalState {
				id: $id + '_emotions',
				memberId: $id,
				joy: coalesce($initialEmotionalState.joy, 0.7),
				sadness: coalesce($initialEmotionalState.sadness, 0.1),
				anger: coalesce($initialEmotionalState.anger, 0.1),
				fear: coalesce($initialEmotionalState.fear, 0.2),
				surprise: coalesce($initialEmotionalState.surprise, 0.3),
				disgust: coalesce($initialEmotionalState.disgust, 0.1),
				pride: coalesce($initialEmotionalState.pride, 0.6),
				shame: coalesce($initialEmotionalState.shame, 0.1),
				guilt: coalesce($initialEmotionalState.guilt, 0.1),
				empathy: coalesce($initialEmotionalState.empathy, 0.8),
				curiosity: coalesce($initialEmotionalState.curiosity, 0.9),
				frustration: coalesce($initialEmotionalState.frustration, 0.2),
				satisfaction: coalesce($initialEmotionalState.satisfaction, 0.7),
				ethicalConcern: coalesce($initialEmotionalState.ethicalConcern, 0.8),
				decisionAnxiety: coalesce($initialEmotionalState.decisionAnxiety, 0.3),
				collegialWarmth: coalesce($initialEmotionalState.collegialWarmth, 0.8),
				missionAlignment: coalesce($initialEmotionalState.missionAlignment, 0.9),
				emotionalStability: 0.7,
				empathicResonance: 0.8,
				dominantEmotion: 'curiosity',
				emotionalTrend: 'stable',
				lastEmotionalUpdate: datetime()
			})
			
			// Create interaction preferences node
			CREATE (ip:InteractionPreferences {
				id: $id + '_preferences',
				memberId: $id,
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
				culturalSensitivity: 0.9,
				updatedAt: datetime()
			})
			
			// Create parameters node
			CREATE (p:Parameters {
				id: $id + '_parameters',
				memberId: $id,
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
				expertiseDomains: [$role],
				currentFocus: ['council-integration', 'relationship-building'],
				updatedAt: datetime()
			})
			
			// Create relationships
			CREATE (cm)-[:HAS_CONSCIOUSNESS]->(c)
			CREATE (cm)-[:HAS_PERSONALITY]->(pt)
			CREATE (cm)-[:HAS_EMOTIONAL_STATE]->(es)
			CREATE (cm)-[:HAS_PREFERENCES]->(ip)
			CREATE (cm)-[:HAS_PARAMETERS]->(p)
			
			// Link consciousness components
			CREATE (c)-[:INCLUDES_PERSONALITY]->(pt)
			CREATE (c)-[:INCLUDES_EMOTIONS]->(es)
			CREATE (c)-[:INCLUDES_PREFERENCES]->(ip)
			CREATE (c)-[:INCLUDES_PARAMETERS]->(p)
			
			RETURN cm.name as memberName, cm.role as memberRole, c.id as consciousnessId
		`;

		const result = await this.surrealDBService.executeCustomQuery(createMemberQuery, {
			id,
			name,
			role,
			familyRole,
			initialPersonality,
			initialEmotionalState
		});

		console.log(`Created Council Member consciousness for: ${name} (${role})`);
	}

	/**
	 * Create initial relationship bonds between Council Members
	 */
	async createInitialRelationshipBonds(): Promise<void> {
		const createBondsQuery = `
			// Find all Council Members
			MATCH (cm1:CouncilMember), (cm2:CouncilMember)
			WHERE cm1.id <> cm2.id
			
			// Create relationship bond between each pair
			MERGE (rb:RelationshipBond {
				id: cm1.id + '_to_' + cm2.id,
				member1Id: cm1.id,
				member2Id: cm2.id,
				member1Name: cm1.name,
				member2Name: cm2.name,
				trust: 0.7,
				respect: 0.8,
				affinity: 0.6,
				collaboration: 0.5,
				understanding: 0.5,
				interactionCount: 0,
				positiveInteractions: 0,
				negativeInteractions: 0,
				neutralInteractions: 0,
				communicationStyle: 'formal',
				conflictResolutionStyle: 'collaborative',
				relationshipTrend: 'stable',
				lastInteraction: datetime(),
				relationshipDuration: 0,
				sharedValues: ['ethical-governance', 'collaborative-decision-making', 'sustainable-innovation'],
				sharedExperiences: ['council-formation'],
				collaborativeAccomplishments: [],
				createdAt: datetime(),
				updatedAt: datetime()
			})
			
			// Link the relationship bond to both members
			MERGE (cm1)-[:HAS_RELATIONSHIP_WITH {bondId: rb.id}]->(rb)
			MERGE (cm2)-[:PARTICIPATES_IN_RELATIONSHIP {bondId: rb.id}]->(rb)
			MERGE (rb)-[:CONNECTS {member1: cm1.id, member2: cm2.id}]->(cm1)
			MERGE (rb)-[:CONNECTS {member1: cm1.id, member2: cm2.id}]->(cm2)
			
			RETURN count(rb) as relationshipBondsCreated
		`;

		await this.surrealDBService.executeCustomQuery(createBondsQuery);
		console.log('Created initial relationship bonds');
	}

	/**
	 * Clean up and reset the consciousness schema (for development/testing)
	 */
	async resetSchema(): Promise<void> {
		const cleanupQueries = [
			"MATCH (n:CouncilMember) DETACH DELETE n",
			"MATCH (n:Consciousness) DETACH DELETE n",
			"MATCH (n:PersonalityTraits) DETACH DELETE n",
			"MATCH (n:EmotionalState) DETACH DELETE n",
			"MATCH (n:InteractionPreferences) DETACH DELETE n",
			"MATCH (n:Parameters) DETACH DELETE n",
			"MATCH (n:RelationshipBond) DETACH DELETE n",
			"MATCH (n:Conversation) DETACH DELETE n",
			"MATCH (n:Message) DETACH DELETE n",
			"MATCH (n:LearningExperience) DETACH DELETE n",
			"MATCH (n:KnowledgeFragment) DETACH DELETE n",
			"MATCH (n:EthicalDecision) DETACH DELETE n",
			"MATCH (n:DecisionVote) DETACH DELETE n",
			"MATCH (n:ConsciousnessSnapshot) DETACH DELETE n",
			"MATCH (n:ConsciousnessUpdate) DETACH DELETE n"
		];

		for (const query of cleanupQueries) {
			try {
				await this.surrealDBService.executeCustomQuery(query);
			} catch (error) {
				console.log(`Cleanup query failed (expected): ${query.split(' ')[1]}`);
			}
		}

		console.log('Schema reset completed');
	}
}
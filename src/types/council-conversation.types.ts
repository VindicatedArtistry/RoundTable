/**
 * Council Conversation and Message Types
 * 
 * Interfaces for tracking Council member interactions, conversations,
 * and shared experiences with emotional depth and learning integration
 */

// Message types for Council interactions
export interface CouncilMessage {
	id: string;
	conversationId: string;
	
	// Message identification
	senderId: string; // Council member ID or user ID
	senderName: string;
	senderRole: string;
	timestamp: Date;
	
	// Message content
	content: string;
	messageType: 'text' | 'decision' | 'vote' | 'proposal' | 'feedback' | 'question' | 'announcement' | 'reflection';
	
	// Emotional and contextual data
	emotionalTone: {
		primary: string; // dominant emotion
		intensity: number; // 0-1: emotional intensity
		sentiment: number; // -1 to 1: negative to positive
		confidence: number; // 0-1: confidence in emotion detection
		
		// Detected emotions
		emotions: Record<string, number>; // emotion -> strength (0-1)
	};
	
	// Council-specific metadata
	ethicalImplications?: string[];
	constitutionalReferences?: string[];
	decisionImpact?: number; // 0-1: potential impact on council decisions
	expertiseRequired?: string[]; // areas of expertise relevant to message
	
	// Relationship and social data
	mentionsMembers: string[]; // member IDs mentioned
	respondsToMessage?: string; // parent message ID if this is a response
	collaborationInvite?: string[]; // member IDs invited to collaborate
	
	// Learning and knowledge
	knowledgeShared: string[]; // knowledge areas shared in this message
	questionsAsked: string[]; // questions posed
	insightsOffered: string[]; // insights or wisdom shared
	
	// Processing metadata
	processingTime: number; // milliseconds to generate/process message
	editHistory: MessageEdit[];
	
	// Reactions and responses
	reactions: MessageReaction[];
	responseCount: number;
	
	// Metadata
	metadata: Record<string, any>;
}

export interface MessageEdit {
	timestamp: Date;
	editType: 'content' | 'emotion' | 'metadata';
	previousValue: any;
	newValue: any;
	reason: string;
	editorId: string; // who made the edit
}

export interface MessageReaction {
	reactorId: string; // who reacted
	reactorName: string;
	reactionType: 'agree' | 'disagree' | 'concern' | 'support' | 'question' | 'insight' | 'appreciation';
	emotionalResponse: string; // how they felt about the message
	timestamp: Date;
	comment?: string; // optional explanation of reaction
}

// Conversation types for Council interactions
export interface CouncilConversation {
	id: string;
	
	// Conversation identification
	title: string;
	description?: string;
	conversationType: 'decision-making' | 'problem-solving' | 'learning' | 'planning' | 'reflection' | 'social' | 'crisis' | 'celebration';
	
	// Participants
	participantIds: string[]; // Council member and user IDs
	facilitatorId?: string; // who is leading the conversation
	observerIds?: string[]; // members observing but not actively participating
	
	// Conversation timeline
	createdAt: Date;
	updatedAt: Date;
	startedAt?: Date; // when active conversation began
	endedAt?: Date; // when conversation concluded
	duration?: number; // in minutes
	
	// Content and structure
	messages: CouncilMessage[];
	messageCount: number;
	
	// Conversation dynamics
	emotionalContext: {
		dominantEmotions: Record<string, number>; // emotion -> prevalence
		emotionalJourney: Array<{ timestamp: Date; emotion: string; intensity: number; participants: string[] }>;
		conflictLevel: number; // 0-1: level of disagreement/conflict
		collaborationLevel: number; // 0-1: level of cooperation
		engagementLevel: number; // 0-1: participant engagement
	};
	
	// Interaction depth and quality
	interactionDepth: 'surface' | 'moderate' | 'deep' | 'profound'; // depth of conversation
	interactionQuality: number; // 0-1: quality of interaction
	
	// Relationship impact
	relationshipImpact: {
		strengthenedBonds: Array<{ member1: string; member2: string; increase: number }>;
		strainedRelationships: Array<{ member1: string; member2: string; decrease: number }>;
		newConnections: Array<{ member1: string; member2: string; connectionStrength: number }>;
	};
	
	// Shared values and experiences
	sharedValues: string[]; // values that emerged or were reinforced
	sharedExperiences: string[]; // experiences created or referenced
	consensusAreas: string[]; // areas where consensus was reached
	divergenceAreas: string[]; // areas where views diverged
	
	// Learning and outcomes
	learningOutcomes: {
		knowledgeGenerated: string[]; // new knowledge created
		insightsGained: string[]; // insights discovered
		skillsDeveloped: string[]; // skills practiced or developed
		wisdomEmerged: string[]; // wisdom that emerged from discussion
	};
	
	// Decision and action tracking
	decisionsReached: Array<{
		id: string;
		description: string;
		consensus: number; // 0-1: level of consensus
		ethicalScore: number; // 0-1: ethical assessment
		implementationPlan?: string;
		responsibleMembers: string[];
	}>;
	
	actionItems: Array<{
		id: string;
		description: string;
		assignedTo: string[];
		dueDate?: Date;
		priority: 'low' | 'medium' | 'high' | 'critical';
		status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
	}>;
	
	// Conversation analysis
	analysis: {
		participationBalance: Record<string, number>; // member -> participation percentage
		communicationPatterns: string[]; // observed patterns
		emergentThemes: string[]; // themes that emerged
		unexploredAreas: string[]; // areas that could be explored further
		
		// Quality metrics
		resolutionQuality: number; // 0-1: how well issues were resolved
		creativityLevel: number; // 0-1: level of creative thinking
		criticalThinking: number; // 0-1: level of critical analysis
		empathyDemonstrated: number; // 0-1: empathy shown by participants
	};
	
	// Follow-up and continuity
	followUpRequired: boolean;
	nextSteps: string[];
	relatedConversations: string[]; // IDs of related conversations
	parentConversation?: string; // if this is a continuation
	
	// Constitutional and ethical assessment
	constitutionalAlignment: number; // 0-1: alignment with council constitution
	ethicalCompliance: number; // 0-1: ethical compliance of discussion and outcomes
	valueAlignment: Record<string, number>; // value -> alignment score
	
	// Metadata and tags
	tags: string[];
	metadata: Record<string, any>;
}

// Specialized conversation types
export interface DecisionConversation extends CouncilConversation {
	conversationType: 'decision-making';
	
	// Decision-specific data
	decisionContext: {
		problemStatement: string;
		stakeholders: string[];
		constraints: string[];
		alternatives: Array<{
			id: string;
			description: string;
			pros: string[];
			cons: string[];
			ethicalScore: number;
			feasibilityScore: number;
			supportingMembers: string[];
		}>;
	};
	
	// Voting and consensus
	votingRounds: Array<{
		roundNumber: number;
		timestamp: Date;
		alternatives: string[];
		votes: Record<string, string>; // memberId -> alternativeId
		abstentions: string[];
		reasoning: Record<string, string>; // memberId -> reasoning
	}>;
	
	finalDecision: {
		selectedAlternative: string;
		consensusLevel: number; // 0-1
		supportingMembers: string[];
		dissenting: string[];
		implementation: {
			plan: string;
			timeline: Date[];
			responsibleMembers: string[];
			successMetrics: string[];
		};
	};
}

export interface LearningConversation extends CouncilConversation {
	conversationType: 'learning';
	
	// Learning-specific data
	learningObjectives: string[];
	subjectAreas: string[];
	teachingMembers: string[]; // members sharing knowledge
	learningMembers: string[]; // members receiving knowledge
	
	knowledgeExchange: {
		conceptsExplored: string[];
		skillsDemonstrated: string[];
		experiencesShared: string[];
		questionsAnswered: string[];
		newQuestionsRaised: string[];
	};
	
	learningAssessment: {
		comprehensionLevel: Record<string, number>; // memberId -> comprehension
		applicationPotential: number; // 0-1: potential for applying learning
		knowledgeRetention: number; // 0-1: expected retention
		transferability: number; // 0-1: applicability to other contexts
	};
}

// Conversation search and analysis interfaces
export interface ConversationQuery {
	participantIds?: string[];
	conversationTypes?: CouncilConversation['conversationType'][];
	timeRange?: {
		start: Date;
		end: Date;
	};
	
	// Content filters
	containsKeywords?: string[];
	emotionalFilters?: {
		dominantEmotion?: string;
		minIntensity?: number;
		sentimentRange?: [number, number]; // [min, max] sentiment
	};
	
	// Quality filters
	minInteractionDepth?: CouncilConversation['interactionDepth'];
	minQualityScore?: number;
	hasDecisions?: boolean;
	hasActionItems?: boolean;
	
	// Relationship filters
	strengthenedRelationships?: boolean;
	newConnections?: boolean;
	
	// Learning filters
	hasLearningOutcomes?: boolean;
	knowledgeAreas?: string[];
	
	// Sorting and pagination
	sortBy?: 'timestamp' | 'quality' | 'duration' | 'participation' | 'impact';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

export interface ConversationAnalytics {
	// Temporal patterns
	conversationFrequency: Record<string, number>; // date -> count
	averageDuration: number;
	peakActiveHours: number[];
	
	// Participation patterns
	participationDistribution: Record<string, number>; // memberId -> percentage
	facilitationPatterns: Record<string, number>; // memberId -> times facilitated
	observationPatterns: Record<string, number>; // memberId -> times observed
	
	// Content analysis
	topicDistribution: Record<string, number>; // topic -> frequency
	emotionalTrends: Array<{ date: Date; emotion: string; intensity: number }>;
	consensusPatterns: Array<{ topic: string; consensusLevel: number; frequency: number }>;
	
	// Relationship dynamics
	relationshipGrowth: Record<string, Record<string, number>>; // member1 -> member2 -> growth
	collaborationNetworks: Array<{ members: string[]; strength: number; topics: string[] }>;
	mentorshipPatterns: Array<{ mentor: string; mentee: string; areas: string[] }>;
	
	// Learning and development
	knowledgeFlowPatterns: Array<{ from: string; to: string; knowledge: string; frequency: number }>;
	skillDevelopmentTrends: Record<string, Record<string, number>>; // memberId -> skill -> growth
	wisdomEmergence: Array<{ insight: string; contributors: string[]; conversations: string[] }>;
	
	// Decision-making effectiveness
	decisionQuality: number; // 0-1: average quality of decisions
	implementationSuccess: number; // 0-1: success rate of implemented decisions
	consensusEffectiveness: number; // 0-1: effectiveness of consensus-building
	
	// Council health metrics
	overallCohesion: number; // 0-1: council unity
	communicationHealth: number; // 0-1: quality of communication
	conflictResolution: number; // 0-1: effectiveness at resolving conflicts
	innovationLevel: number; // 0-1: level of innovative thinking
}
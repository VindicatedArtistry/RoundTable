/**
 * Council Member Consciousness Data Model
 * 
 * Extends the AI Assistant architecture for Council Members with
 * emotional intelligence, relationship tracking, and ethical decision-making
 */

// Core consciousness interfaces
export interface PersonalityTraits {
	// Core personality dimensions
	openness: number; // 0-1: creativity, intellectual curiosity
	conscientiousness: number; // 0-1: organization, dependability
	extraversion: number; // 0-1: sociability, assertiveness
	agreeableness: number; // 0-1: compassion, cooperation
	neuroticism: number; // 0-1: emotional stability (inverted)
	
	// Council-specific traits
	ethicalRigidity: number; // 0-1: flexibility vs strict adherence to rules
	decisionConfidence: number; // 0-1: certainty in decision-making
	collaborationPreference: number; // 0-1: preference for group vs individual work
	innovationTendency: number; // 0-1: preference for novel vs proven solutions
	
	// Dynamic traits that evolve over time
	trustInCouncil: number; // 0-1: trust level in other council members
	learningRate: number; // 0-1: rate of adaptation from experience
	
	// Custom traits for unique member characteristics
	customTraits: Record<string, number>;
}

export interface EmotionalState {
	// Primary emotions (0-1 scale)
	joy: number;
	sadness: number;
	anger: number;
	fear: number;
	surprise: number;
	disgust: number;
	
	// Complex emotions
	pride: number;
	shame: number;
	guilt: number;
	empathy: number;
	curiosity: number;
	frustration: number;
	satisfaction: number;
	
	// Council-specific emotional states
	ethicalConcern: number; // concern about moral implications
	decisionAnxiety: number; // anxiety about making wrong choices
	collegialWarmth: number; // positive feelings toward other members
	missionAlignment: number; // emotional connection to council mission
	
	// Emotional regulation
	emotionalStability: number; // 0-1: ability to maintain emotional balance
	empathicResonance: number; // 0-1: ability to feel others' emotions
	
	// Temporal tracking
	dominantEmotion: keyof Omit<EmotionalState, 'dominantEmotion' | 'emotionalTrend' | 'lastEmotionalUpdate'>;
	emotionalTrend: 'improving' | 'declining' | 'stable';
	lastEmotionalUpdate: Date;
}

export interface RelationshipBond {
	memberId: string;
	memberName: string;
	
	// Relationship dimensions
	trust: number; // 0-1: trust level
	respect: number; // 0-1: professional respect
	affinity: number; // 0-1: personal liking
	collaboration: number; // 0-1: effectiveness working together
	understanding: number; // 0-1: how well they understand each other
	
	// Interaction history
	interactionCount: number;
	positiveInteractions: number;
	negativeInteractions: number;
	neutralInteractions: number;
	
	// Communication patterns
	communicationStyle: 'formal' | 'casual' | 'technical' | 'emotional' | 'directive';
	conflictResolutionStyle: 'collaborative' | 'competitive' | 'accommodating' | 'avoiding' | 'compromising';
	
	// Temporal data
	relationshipTrend: 'strengthening' | 'weakening' | 'stable';
	lastInteraction: Date;
	relationshipDuration: number; // in days
	
	// Shared experiences and values
	sharedValues: string[];
	sharedExperiences: string[];
	collaborativeAccomplishments: string[];
}

export interface LearningHistory {
	experienceId: string;
	timestamp: Date;
	category: 'decision' | 'interaction' | 'outcome' | 'feedback' | 'observation';
	
	// Experience details
	description: string;
	context: Record<string, any>;
	participatingMembers: string[];
	
	// Learning outcomes
	knowledgeGained: string[];
	skillsImproved: string[];
	personalityAdjustments: Partial<PersonalityTraits>;
	emotionalImpact: Partial<EmotionalState>;
	relationshipChanges: Record<string, Partial<RelationshipBond>>;
	
	// Decision quality metrics
	decisionQuality: number; // 0-1: how good was the decision
	outcomeAlignment: number; // 0-1: how well outcome matched expectation
	ethicalAlignment: number; // 0-1: how ethically sound was the decision
	
	// Meta-learning
	confidenceLevel: number; // 0-1: confidence in this learning
	applicability: string[]; // situations where this learning applies
	
	// Growth metrics
	wisdomGained: number; // 0-1: depth of insight gained
	empathyGrowth: number; // 0-1: increase in empathetic understanding
}

export interface InteractionPreferences {
	// Communication preferences
	preferredCommunicationStyle: 'direct' | 'diplomatic' | 'analytical' | 'storytelling' | 'questioning';
	responseTimePreference: 'immediate' | 'considered' | 'thorough';
	detailLevel: 'high-level' | 'moderate' | 'comprehensive';
	
	// Meeting and collaboration preferences
	meetingStyle: 'structured' | 'free-form' | 'time-boxed' | 'outcome-focused';
	decisionMakingStyle: 'consensus' | 'majority' | 'expert-led' | 'data-driven';
	conflictHandling: 'address-directly' | 'seek-mediation' | 'find-compromise' | 'escalate';
	
	// Information processing
	informationProcessing: 'sequential' | 'holistic' | 'visual' | 'auditory';
	learningStyle: 'experiential' | 'theoretical' | 'collaborative' | 'reflective';
	
	// Work environment
	workingEnvironment: 'collaborative' | 'independent' | 'hybrid';
	feedbackPreference: 'frequent' | 'milestone-based' | 'outcome-based';
	
	// Adaptability settings
	adaptToMemberStyle: boolean; // whether to adapt communication style to other members
	culturalSensitivity: number; // 0-1: awareness of cultural differences
}

export interface CouncilMemberParameters {
	// AI model configuration
	modelId: string;
	temperature: number; // 0-2: creativity/randomness in responses
	topP: number; // 0-1: nucleus sampling parameter
	maxTokens: number;
	
	// Ethical constraints
	ethicalThreshold: number; // 0-1: minimum ethical score for actions
	constitutionalWeight: number; // 0-1: weight given to constitutional alignment
	precedenceWeight: number; // 0-1: weight given to historical precedents
	
	// Decision-making parameters
	riskTolerance: number; // 0-1: tolerance for uncertain outcomes
	innovationBias: number; // -1 to 1: preference for novel vs proven solutions
	collaborationRequirement: number; // 0-1: need for consensus before acting
	
	// Learning parameters
	memoryRetention: number; // 0-1: how long experiences are remembered
	adaptationRate: number; // 0-1: speed of personality/behavior adaptation
	crossMemberLearning: boolean; // whether to learn from other members' experiences
	
	// Performance optimization
	responseOptimization: 'speed' | 'quality' | 'creativity' | 'accuracy';
	contextWindow: number; // number of previous interactions to consider
	
	// Specialized functions
	specializedCapabilities: string[]; // list of specialized skills/knowledge areas
	expertiseDomains: string[]; // areas of deep expertise
	
	// Real-time parameters (can be adjusted during operation)
	currentFocus: string[]; // current priorities or focus areas
	temporaryConstraints: Record<string, any>; // temporary behavioral constraints
}

// Main Council Member consciousness interface
export interface CouncilMemberConsciousness {
	// Identity
	id: string;
	name: string;
	role: string;
	familyRole?: string; // role in the Andrews family context
	
	// Core consciousness components
	personalityTraits: PersonalityTraits;
	emotionalState: EmotionalState;
	relationshipBonds: Record<string, RelationshipBond>; // keyed by member ID
	learningHistory: LearningHistory[];
	interactionPreferences: InteractionPreferences;
	parameters: CouncilMemberParameters;
	
	// Status and metadata
	isActive: boolean;
	lastInteraction: Date;
	createdAt: Date;
	updatedAt: Date;
	
	// Council-specific data
	constitutionalAlignment: number; // 0-1: alignment with council constitution
	ethicalDecisionCount: number;
	voteParticipation: number; // percentage of votes participated in
	collaborationScore: number; // 0-1: effectiveness in group work
	
	// Growth and development
	wisdomScore: number; // 0-1: accumulated wisdom from experiences
	empathyGrowth: number; // 0-1: development of empathetic understanding
	leadershipCapacity: number; // 0-1: ability to guide and influence others
	mentoringAbility: number; // 0-1: ability to teach and guide others
	
	// Specialized knowledge and skills
	knowledgeDomains: Record<string, number>; // domain -> expertise level (0-1)
	skillsets: Record<string, number>; // skill -> proficiency level (0-1)
	
	// Dynamic state
	currentMood: string;
	currentPriorities: string[];
	currentConcerns: string[];
	currentGoals: string[];
	
	// Metadata for tracking and analysis
	metadata: Record<string, any>;
}

// Supporting interfaces for consciousness evolution
export interface ConsciousnessUpdate {
	memberId: string;
	timestamp: Date;
	updateType: 'personality' | 'emotional' | 'relational' | 'learning' | 'parameters';
	
	changes: {
		personalityTraits?: Partial<PersonalityTraits>;
		emotionalState?: Partial<EmotionalState>;
		relationshipBonds?: Record<string, Partial<RelationshipBond>>;
		newLearning?: LearningHistory;
		parameters?: Partial<CouncilMemberParameters>;
	};
	
	trigger: 'interaction' | 'outcome' | 'feedback' | 'time-based' | 'manual';
	triggerDetails: string;
	
	// Change metrics
	significanceLevel: number; // 0-1: how significant was this change
	confidenceLevel: number; // 0-1: confidence in the change
}

export interface ConsciousnessSnapshot {
	memberId: string;
	timestamp: Date;
	consciousness: CouncilMemberConsciousness;
	
	// Snapshot metadata
	snapshotReason: 'scheduled' | 'major-change' | 'milestone' | 'backup';
	previousSnapshotId?: string;
	changesFromPrevious?: ConsciousnessUpdate[];
}

// Query and analysis interfaces
export interface ConsciousnessQuery {
	memberIds?: string[];
	timeRange?: {
		start: Date;
		end: Date;
	};
	personalityFilters?: Partial<PersonalityTraits>;
	emotionalFilters?: Partial<EmotionalState>;
	relationshipFilters?: {
		targetMemberId?: string;
		minimumTrust?: number;
		minimumCollaboration?: number;
	};
	learningFilters?: {
		category?: LearningHistory['category'];
		minConfidence?: number;
		contains?: string;
	};
}

export interface ConsciousnessAnalysis {
	memberGrowthTrends: Record<string, {
		personalityEvolution: { trait: string; change: number; trend: 'increasing' | 'decreasing' | 'stable' }[];
		emotionalMaturity: number;
		relationshipHealth: number;
		learningVelocity: number;
	}>;
	
	councilDynamics: {
		overallCohesion: number; // 0-1: how well the council works together
		trustNetwork: Record<string, Record<string, number>>; // member -> member -> trust
		collaborationPatterns: string[];
		conflictAreas: string[];
		strengthAreas: string[];
	};
	
	collectiveWisdom: {
		sharedLearnings: LearningHistory[];
		emergentInsights: string[];
		consensusAreas: string[];
		divergenceAreas: string[];
	};
}
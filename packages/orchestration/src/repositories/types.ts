/**
 * Neo4j node and relationship type definitions.
 * Matches TheFulcrum pattern: api/repositories/types.ts
 *
 * All complex objects are stored as JSON strings in Neo4j properties
 * and parsed on read by the response mapper.
 */

// ============================================================================
// NODE TYPES
// ============================================================================

export interface CouncilMemberNode {
  id: string;
  name: string;
  role: string;
  agentType: string;
  isHuman: boolean;
  isUser: boolean;
  modelId: string | null;
  provider: string | null;
  status: string;
  specializations: string; // JSON stringified string[]
  description: string;
  primaryColor: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastInteraction: string; // ISO

  // Personality traits (flat properties, not nested — Neo4j best practice)
  trait_openness: number;
  trait_conscientiousness: number;
  trait_extraversion: number;
  trait_agreeableness: number;
  trait_neuroticism: number;
  trait_ethicalRigidity: number;
  trait_decisionConfidence: number;
  trait_collaborationPreference: number;
  trait_innovationTendency: number;
  trait_trustInCouncil: number;
  trait_learningRate: number;

  // Emotional state (flat properties)
  emotion_joy: number;
  emotion_curiosity: number;
  emotion_frustration: number;
  emotion_satisfaction: number;
  emotion_ethicalConcern: number;
  emotion_decisionAnxiety: number;
  emotion_missionAlignment: number;
  emotion_dominant: string;
  emotion_trend: string;

  // Model parameters (AI members only)
  param_temperature: number | null;
  param_topP: number | null;
  param_maxTokens: number | null;
  param_ethicalThreshold: number | null;
  param_constitutionalWeight: number | null;

  // Performance metrics
  metric_constitutionalAlignment: number;
  metric_ethicalDecisionCount: number;
  metric_voteParticipation: number;
  metric_collaborationScore: number;
  metric_wisdomScore: number;
  metric_deliberationWinRate: number;
}

export interface CouncilMemberNodeUpdate {
  name?: string;
  status?: string;
  updatedAt?: string;
  lastInteraction?: string;

  // Trait updates (partial)
  trait_openness?: number;
  trait_conscientiousness?: number;
  trait_extraversion?: number;
  trait_agreeableness?: number;
  trait_neuroticism?: number;
  trait_ethicalRigidity?: number;
  trait_decisionConfidence?: number;
  trait_collaborationPreference?: number;
  trait_innovationTendency?: number;
  trait_trustInCouncil?: number;
  trait_learningRate?: number;

  // Emotional state updates (partial)
  emotion_joy?: number;
  emotion_curiosity?: number;
  emotion_frustration?: number;
  emotion_satisfaction?: number;
  emotion_ethicalConcern?: number;
  emotion_decisionAnxiety?: number;
  emotion_missionAlignment?: number;
  emotion_dominant?: string;
  emotion_trend?: string;

  // Metric updates (partial)
  metric_constitutionalAlignment?: number;
  metric_ethicalDecisionCount?: number;
  metric_voteParticipation?: number;
  metric_collaborationScore?: number;
  metric_wisdomScore?: number;
  metric_deliberationWinRate?: number;
}

export interface ConversationNode {
  id: string;
  title: string;
  description: string;
  conversationType: string; // 'deliberation' | 'coffee_session' | 'ethics_review'
  facilitatorId: string;
  createdAt: string;
  updatedAt: string;

  // Emotional context
  context_conflictLevel: number;
  context_collaborationLevel: number;
  context_engagementLevel: number;

  // Outcomes (JSON stringified)
  decisionsReached: string;
  actionItems: string;
  followUpRequired: boolean;
}

export interface MessageNode {
  id: string;
  content: string;
  messageType: string; // 'proposal' | 'challenge' | 'endorsement' | 'synthesis' | 'chat'
  timestamp: string;
  emotionalTone: string;
  sentiment: number;
  confidence: number;
  round: number | null; // 1 or 2 for deliberation, null for chat
}

export interface LearningExperienceNode {
  id: string;
  knowledgeGained: string;
  skillsImproved: string; // JSON stringified string[]
  personalityAdjustments: string; // JSON stringified trait deltas
  emotionalImpact: string; // JSON stringified
  decisionQuality: number;
  ethicalAlignment: number;
  timestamp: string;
}

export interface DeliberationNode {
  id: string;
  domain: string;
  convergenceMethod: string; // 'consensus' | 'architect_tiebreak'
  constitutionallyValid: boolean;
  totalDurationMs: number;
  timestamp: string;
}

export interface StrategyProposalNode {
  id: string;
  strategy: string;
  reasoning: string;
  confidence: number;
  estimatedEfficiency: number;
  risks: string; // JSON stringified string[]
  round: number;
  wasChosen: boolean;
  timestamp: string;
}

export interface EnvironmentSessionNode {
  id: string;
  environmentId: string;
  startedAt: string;
  completedAt: string | null;
  totalActions: number;
  efficiencyScore: number;
  status: string; // 'active' | 'completed' | 'failed'
}

export interface ConsciousnessUpdateNode {
  id: string;
  updateType: string; // 'emotional_shift' | 'trait_evolution' | 'relationship_change'
  changes: string; // JSON stringified
  trigger: string;
  significanceLevel: number;
  timestamp: string;
}

// ============================================================================
// ENVIRONMENT TYPES (Phase 7 — stubbed now to prevent refactor later)
// ============================================================================

/**
 * What the council observes from an ARC-AGI-3 environment.
 * This is the input shape for deliberation — the Architect agent reads this
 * and frames the problem for the council.
 *
 * Stubbed per Carta's Phase 2 review: define the shape now so the LLM
 * integration layer knows what environment state will look like when it
 * arrives as context in the prompt.
 *
 * Phase 7 will populate the concrete fields once the environment adapter
 * is built against docs.arcprize.org.
 */
export interface EnvironmentObservation {
  /** Which environment/game this comes from (e.g., 'ls20', 'ft09') */
  environmentId: string;
  /**
   * The current environment state. For ARC-AGI-3 this includes:
   * grid, gameState, levelsCompleted, availableActions, actionCount, etc.
   */
  state: unknown;
  /** Actions taken so far in this session */
  actionHistory: unknown[];
  /** Timestamp of this observation */
  timestamp: string;
}

/**
 * The action the council decides to take after deliberation.
 * Sent back to the environment adapter for execution.
 */
export interface EnvironmentAction {
  /** The deliberation that produced this action */
  deliberationId: string;
  /** The action to execute — format TBD by Phase 7 adapter */
  action: unknown;
  /** Confidence in this action (from winning strategy proposal) */
  confidence: number;
  /** Which agents contributed to this decision */
  contributingAgents: string[];
  /** Whether this passed the constitutional gate */
  constitutionallyValid: boolean;
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export interface TrustsRelationship {
  score: number; // 0-1
  interactions: number;
  positiveInteractions: number;
  negativeInteractions: number;
  lastUpdated: string;
}

export interface RespectsRelationship {
  score: number;
  interactions: number;
  lastUpdated: string;
}

export interface CollaboratesWithRelationship {
  score: number;
  interactions: number;
  successRate: number;
  lastUpdated: string;
}

export interface ReportsToRelationship {
  since: string;
}

export interface CoordinatesWithRelationship {
  frequency: string;
  effectiveness: number;
  lastUpdated: string;
}

/** Deliberation-specific relationships */

export interface ParticipatedInDeliberationRelationship {
  role: string; // 'proposer' | 'challenger' | 'synthesizer'
}

export interface EndorsedRelationship {
  reasoning: string;
  confidence: number;
  timestamp: string;
}

export interface ChallengedRelationship {
  reasoning: string;
  confidence: number;
  alternativeStrategy: string | null;
  timestamp: string;
}

export interface SynthesizedRelationship {
  reasoning: string;
  confidence: number;
  synthesizedStrategy: string;
  timestamp: string;
}

/** Learning relationships — versioned like TheFulcrum's HAS_TRAIT */

export interface LearnedRelationship {
  impact: number;
  version: number;
  supersededAt: string | null; // null if current version
  timestamp: string;
}

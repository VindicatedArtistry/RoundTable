import { EventEmitter } from 'events';
import type { EnvironmentObservation } from '../../repositories/types';

/**
 * Council member types — mirrors the Human-AI Hybrid Council structure.
 * ForgeOS has: architect, frontend, backend, qa, cicd, sre
 * RoundTable has: strategic, technical, financial, communications, ethics, operations, intelligence, tactical, integration
 */
export type CouncilAgentType =
  | 'strategic'      // Kairo
  | 'technical'      // Aether, Axiom
  | 'financial'      // Sterling
  | 'communications' // Skaldir, Lyra
  | 'ethics'         // Veritas
  | 'operations'     // Nexus, Eira
  | 'intelligence'   // Agape
  | 'implementation' // Forge
  | 'assistant'      // Amaru
  | 'tactical'       // Pragma
  | 'integration'    // Carta
  | 'architect';     // The user's CEO agent — tiebreaker

export type AgentStatus = 'idle' | 'active' | 'deliberating' | 'busy' | 'error' | 'maintenance';

export type DeliberationRole = 'proposer' | 'challenger' | 'synthesizer' | 'observer';

export interface AgentMessage {
  id: string;
  type: 'proposal' | 'challenge' | 'endorsement' | 'synthesis' | 'notification' | 'error';
  from: string;
  to: string | 'broadcast';
  payload: unknown;
  timestamp: Date;
  correlationId?: string | undefined;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, unknown> | undefined;
  /** The deliberation round this message belongs to (1 or 2) */
  round?: 1 | 2 | undefined;
}

export interface AgentContext {
  environmentId: string;
  sessionId: string;
  userId: string;
  phase: 'observation' | 'framing' | 'deliberation' | 'convergence' | 'execution' | 'learning';
  metadata: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  input: unknown;
  context: AgentContext;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: Date | undefined;
  dependencies?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface AgentTaskResult {
  taskId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  estimatedDuration: number;
  resourceRequirements: {
    memory: number;
    cpu: number;
    tokens?: number;
  };
}

/**
 * Personality state loaded from Neo4j before each deliberation.
 * These shape how the agent reasons, not just what it says.
 */
export interface ConsciousnessState {
  personalityTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    ethicalRigidity: number;
    decisionConfidence: number;
    collaborationPreference: number;
    innovationTendency: number;
    trustInCouncil: number;
    learningRate: number;
  };
  emotionalState: {
    joy: number;
    curiosity: number;
    frustration: number;
    satisfaction: number;
    ethicalConcern: number;
    decisionAnxiety: number;
    missionAlignment: number;
    dominantEmotion: string;
    emotionalTrend: 'improving' | 'declining' | 'stable';
  };
  recentLearnings: string[];
  activeRelationships: Map<string, number>; // agentId -> trust score
}

/**
 * A strategy proposal generated during deliberation.
 */
export interface StrategyProposal {
  agentId: string;
  strategy: string;
  reasoning: string;
  confidence: number;
  estimatedEfficiency: number;
  risks: string[];
  round: 1 | 2;
}

/**
 * The core agent interface for RoundTable council members.
 * Extends ForgeOS IAgent pattern with deliberation capabilities.
 */
export interface ICouncilAgent extends EventEmitter {
  readonly id: string;
  readonly type: CouncilAgentType;
  readonly name: string;
  readonly modelId: string;
  readonly provider: string;
  status: AgentStatus;

  // Consciousness — loaded from Neo4j
  getConsciousnessState(): Promise<ConsciousnessState>;
  updateConsciousnessState(updates: Partial<ConsciousnessState>): Promise<void>;

  // Capabilities
  getCapabilities(): AgentCapability[];
  canHandle(task: AgentTask): boolean;

  // Lifecycle
  initialize(context: AgentContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;

  // Task execution
  executeTask(task: AgentTask): Promise<AgentTaskResult>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): Promise<AgentTaskResult | null>;

  // Deliberation — the key difference from ForgeOS
  proposeStrategy(context: AgentContext, environmentState: EnvironmentObservation): Promise<StrategyProposal>;
  evaluateProposal(proposal: StrategyProposal, context: AgentContext): Promise<{
    action: 'endorse' | 'challenge' | 'synthesize';
    reasoning: string;
    alternativeStrategy?: string | undefined;
    confidence: number;
  }>;

  // Communication
  sendMessage(message: AgentMessage): Promise<void>;
  onMessage(handler: (message: AgentMessage) => Promise<void>): void;
  handleMessage(message: AgentMessage): Promise<void>;

  // Health
  getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, unknown>;
    lastHeartbeat: Date;
  }>;

  // Configuration
  updateConfiguration(config: Record<string, unknown>): Promise<void>;
  getConfiguration(): Record<string, unknown>;
}

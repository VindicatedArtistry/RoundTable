/**
 * Base council agent — concrete implementation of ICouncilAgent.
 * Matches ForgeOS BaseAgent pattern, extended with:
 *   - Consciousness state loading from Neo4j
 *   - Personality-shaped prompt construction
 *   - LLM response generation via router
 *   - Strategy proposal/evaluation for deliberation
 *
 * Each of the 14 AI council members is an instance of this class,
 * differentiated by their Neo4j personality and LLM assignment.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { loadConsciousnessState } from '@/repositories/council-member.repository';
import type { EnvironmentObservation } from '@/repositories/types';
import type {
  ICouncilAgent,
  CouncilAgentType,
  AgentStatus,
  AgentContext,
  AgentTask,
  AgentTaskResult,
  AgentCapability,
  AgentMessage,
  ConsciousnessState,
  StrategyProposal,
} from './agent.interface';
import type { LLMRouter, RoutingResult } from '@/services/llm/router';
import {
  buildSystemPrompt,
  buildRound1UserMessage,
  buildRound2UserMessage,
  type PromptContext,
} from '@/services/llm/prompt-builder';

const logger = createLogger('council-agent');

export class BaseCouncilAgent extends EventEmitter implements ICouncilAgent {
  readonly id: string;
  readonly type: CouncilAgentType;
  readonly name: string;
  readonly modelId: string;
  readonly provider: string;
  status: AgentStatus = 'idle';

  private readonly router: LLMRouter;
  private consciousnessCache: ConsciousnessState | null = null;
  private activeTasks: Map<string, AgentTask> = new Map();
  private taskResults: Map<string, AgentTaskResult> = new Map();
  private messageHandlers: Array<(message: AgentMessage) => Promise<void>> = [];
  private lastHeartbeat: Date = new Date();

  constructor(
    id: string,
    type: CouncilAgentType,
    name: string,
    modelId: string,
    provider: string,
    router: LLMRouter,
  ) {
    super();
    this.id = id;
    this.type = type;
    this.name = name;
    this.modelId = modelId;
    this.provider = provider;
    this.router = router;
  }

  // --- Consciousness ---

  async getConsciousnessState(): Promise<ConsciousnessState> {
    if (this.consciousnessCache) return this.consciousnessCache;

    const state = await loadConsciousnessState(this.id);
    if (!state) {
      throw new Error(`No consciousness state in Neo4j for member: ${this.id}`);
    }

    this.consciousnessCache = {
      personalityTraits: {
        openness: state.member.trait_openness,
        conscientiousness: state.member.trait_conscientiousness,
        extraversion: state.member.trait_extraversion,
        agreeableness: state.member.trait_agreeableness,
        neuroticism: state.member.trait_neuroticism,
        ethicalRigidity: state.member.trait_ethicalRigidity,
        decisionConfidence: state.member.trait_decisionConfidence,
        collaborationPreference: state.member.trait_collaborationPreference,
        innovationTendency: state.member.trait_innovationTendency,
        trustInCouncil: state.member.trait_trustInCouncil,
        learningRate: state.member.trait_learningRate,
      },
      emotionalState: {
        joy: state.member.emotion_joy,
        curiosity: state.member.emotion_curiosity,
        frustration: state.member.emotion_frustration,
        satisfaction: state.member.emotion_satisfaction,
        ethicalConcern: state.member.emotion_ethicalConcern,
        decisionAnxiety: state.member.emotion_decisionAnxiety,
        missionAlignment: state.member.emotion_missionAlignment,
        dominantEmotion: state.member.emotion_dominant,
        emotionalTrend: state.member.emotion_trend as 'improving' | 'declining' | 'stable',
      },
      recentLearnings: state.recentLearnings.map((l) => l.knowledge),
      activeRelationships: new Map(
        state.trustRelationships.map((t) => [t.otherId, t.score]),
      ),
    };

    return this.consciousnessCache;
  }

  async updateConsciousnessState(updates: Partial<ConsciousnessState>): Promise<void> {
    if (this.consciousnessCache && updates.emotionalState) {
      this.consciousnessCache.emotionalState = {
        ...this.consciousnessCache.emotionalState,
        ...updates.emotionalState,
      };
    }
    // Neo4j persistence happens via the repository in the deliberation recording step
  }

  /** Invalidate cache so next access reloads from Neo4j */
  refreshConsciousness(): void {
    this.consciousnessCache = null;
    this.clearRawCache();
  }

  // --- Capabilities ---

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'propose_strategy',
        description: `Propose strategies from ${this.type} perspective`,
        inputSchema: {},
        outputSchema: {},
        estimatedDuration: 15_000,
        resourceRequirements: { memory: 256, cpu: 10, tokens: 4096 },
      },
      {
        name: 'evaluate_proposal',
        description: `Evaluate strategies from ${this.type} perspective`,
        inputSchema: {},
        outputSchema: {},
        estimatedDuration: 10_000,
        resourceRequirements: { memory: 256, cpu: 10, tokens: 2048 },
      },
    ];
  }

  canHandle(task: AgentTask): boolean {
    return task.type === 'propose_strategy' || task.type === 'evaluate_proposal';
  }

  // --- Lifecycle ---

  async initialize(_context: AgentContext): Promise<void> {
    await this.getConsciousnessState();
    this.status = 'active';
    this.lastHeartbeat = new Date();
    logger.info(`${this.name} initialized`, { id: this.id, model: this.modelId });
  }

  async start(): Promise<void> {
    this.status = 'active';
    this.emit('started', { agentId: this.id });
  }

  async stop(): Promise<void> {
    this.status = 'idle';
    this.consciousnessCache = null;
    this.emit('stopped', { agentId: this.id });
  }

  // --- Task Execution ---

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    this.activeTasks.set(task.id, task);
    this.status = 'busy';

    try {
      const result: AgentTaskResult = {
        taskId: task.id,
        success: true,
        output: `Task ${task.type} executed by ${this.name}`,
        timestamp: new Date(),
      };
      this.taskResults.set(task.id, result);
      return result;
    } finally {
      this.activeTasks.delete(task.id);
      this.status = 'active';
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    this.activeTasks.delete(taskId);
  }

  async getTaskStatus(taskId: string): Promise<AgentTaskResult | null> {
    return this.taskResults.get(taskId) ?? null;
  }

  // --- Deliberation ---

  async proposeStrategy(
    context: AgentContext,
    environmentState: EnvironmentObservation,
  ): Promise<StrategyProposal> {
    this.status = 'deliberating';

    // Refresh consciousness once at start of deliberation, then use cache
    this.refreshConsciousness();
    const state = await this.loadAndCacheConsciousness();

    const promptCtx: PromptContext = {
      member: state.member,
      trustRelationships: state.trustRelationships,
      recentLearnings: state.recentLearnings,
      deliberationRound: 1,
    };

    const systemPrompt = buildSystemPrompt(promptCtx);
    const userMessage = buildRound1UserMessage(environmentState);

    const routingResult = await this.generateLLMResponse(systemPrompt, userMessage, state);
    const parsed = this.parseStrategyResponse(routingResult.response.content);

    this.status = 'active';

    return {
      agentId: this.id,
      strategy: parsed.strategy,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      estimatedEfficiency: parsed.estimatedEfficiency,
      risks: parsed.risks,
      round: 1,
    };
  }

  async evaluateProposal(
    proposal: StrategyProposal,
    context: AgentContext,
  ): Promise<{
    action: 'endorse' | 'challenge' | 'synthesize';
    reasoning: string;
    alternativeStrategy?: string | undefined;
    confidence: number;
  }> {
    this.status = 'deliberating';

    // Use cached consciousness (loaded during proposeStrategy), reload only if missing
    const state = await this.loadAndCacheConsciousness();

    const promptCtx: PromptContext = {
      member: state.member,
      trustRelationships: state.trustRelationships,
      recentLearnings: state.recentLearnings,
      deliberationRound: 2,
      otherProposals: [{
        agentName: proposal.agentId,
        strategy: proposal.strategy,
        reasoning: proposal.reasoning,
      }],
    };

    const systemPrompt = buildSystemPrompt(promptCtx);
    const userMessage = buildRound2UserMessage([{
      agentName: proposal.agentId,
      strategy: proposal.strategy,
      reasoning: proposal.reasoning,
    }]);

    const routingResult = await this.generateLLMResponse(systemPrompt, userMessage, state);
    const parsed = this.parseEvaluationResponse(routingResult.response.content);

    this.status = 'active';

    return parsed;
  }

  // --- Communication ---

  async sendMessage(message: AgentMessage): Promise<void> {
    this.emit('message:sent', message);
  }

  onMessage(handler: (message: AgentMessage) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  async handleMessage(message: AgentMessage): Promise<void> {
    for (const handler of this.messageHandlers) {
      await handler(message);
    }
  }

  // --- Health ---

  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, unknown>;
    lastHeartbeat: Date;
  }> {
    const llmAvailable = await this.router.isAgentAvailable(this.id);
    return {
      status: llmAvailable ? 'healthy' : 'degraded',
      metrics: {
        activeTasks: this.activeTasks.size,
        cachedResults: this.taskResults.size,
        consciousnessCached: this.consciousnessCache !== null,
      },
      lastHeartbeat: this.lastHeartbeat,
    };
  }

  async updateConfiguration(_config: Record<string, unknown>): Promise<void> {
    // Model params are stored in Neo4j — refresh from there
    this.refreshConsciousness();
  }

  getConfiguration(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      modelId: this.modelId,
      provider: this.provider,
      status: this.status,
    };
  }

  // --- Private helpers ---

  /** Load consciousness from Neo4j if not cached. Returns raw state for prompt building. */
  private rawConsciousnessCache: Awaited<ReturnType<typeof loadConsciousnessState>> = null;

  private async loadAndCacheConsciousness() {
    if (!this.rawConsciousnessCache) {
      const state = await loadConsciousnessState(this.id);
      if (!state) throw new Error(`No consciousness state for ${this.id}`);
      this.rawConsciousnessCache = state;
    }
    return this.rawConsciousnessCache;
  }

  /** Invalidate raw consciousness cache (called alongside refreshConsciousness) */
  private clearRawCache(): void {
    this.rawConsciousnessCache = null;
  }

  private async generateLLMResponse(
    systemPrompt: string,
    userMessage: string,
    cachedState?: NonNullable<Awaited<ReturnType<typeof loadConsciousnessState>>>,
  ): Promise<RoutingResult> {
    // Use passed state to avoid a redundant Neo4j read
    const temperature = cachedState?.member.param_temperature ?? 0.7;
    const topP = cachedState?.member.param_topP ?? 0.9;
    const maxTokens = cachedState?.member.param_maxTokens ?? 4096;

    return this.router.generateResponse({
      memberId: this.id,
      modelId: this.modelId,
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature,
      topP,
      maxTokens,
    });
  }

  private parseStrategyResponse(content: string): {
    strategy: string;
    reasoning: string;
    confidence: number;
    estimatedEfficiency: number;
    risks: string[];
  } {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1]! : content;
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      return {
        strategy: String(parsed['strategy'] ?? content.slice(0, 500)),
        reasoning: String(parsed['reasoning'] ?? 'No structured reasoning provided'),
        confidence: Number(parsed['confidence'] ?? 0.5),
        estimatedEfficiency: Number(parsed['estimatedEfficiency'] ?? 0.5),
        risks: Array.isArray(parsed['risks']) ? parsed['risks'].map(String) : [],
      };
    } catch {
      // Fallback: treat entire response as the strategy
      logger.warn(`${this.name} returned non-JSON strategy response, using raw content`);
      return {
        strategy: content.slice(0, 1000),
        reasoning: 'Raw LLM response (non-JSON)',
        confidence: 0.5,
        estimatedEfficiency: 0.5,
        risks: [],
      };
    }
  }

  private parseEvaluationResponse(content: string): {
    action: 'endorse' | 'challenge' | 'synthesize';
    reasoning: string;
    alternativeStrategy?: string | undefined;
    confidence: number;
  } {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1]! : content;
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      // Handle both single evaluation and array format
      const evaluation = Array.isArray(parsed['evaluations'])
        ? (parsed['evaluations'] as Record<string, unknown>[])[0]!
        : parsed;

      const action = String(evaluation['action'] ?? 'endorse');
      const validActions = ['endorse', 'challenge', 'synthesize'] as const;
      const safeAction = validActions.includes(action as typeof validActions[number])
        ? action as 'endorse' | 'challenge' | 'synthesize'
        : 'endorse';

      return {
        action: safeAction,
        reasoning: String(evaluation['reasoning'] ?? 'No reasoning provided'),
        alternativeStrategy: evaluation['alternativeStrategy']
          ? String(evaluation['alternativeStrategy'])
          : undefined,
        confidence: Number(evaluation['confidence'] ?? 0.5),
      };
    } catch {
      logger.warn(`${this.name} returned non-JSON evaluation response, defaulting to endorse`);
      return {
        action: 'endorse',
        reasoning: content.slice(0, 500),
        confidence: 0.4,
      };
    }
  }
}

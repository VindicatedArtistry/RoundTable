import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import type {
  ICouncilAgent,
  AgentContext,
  AgentMessage,
  StrategyProposal,
} from '../base/agent.interface';
import type { LLMRouter } from '../../services/llm/router';
import type { EnvironmentObservation } from '../../repositories/types';
import { getAgentPerformanceByDomain } from '../../repositories/deliberation.repository';

/**
 * Problem classification determines which agents participate in deliberation.
 * The Architect agent frames the problem and selects participants.
 */
export type ProblemDomain =
  | 'spatial_reasoning'
  | 'logical_deduction'
  | 'pattern_recognition'
  | 'strategic_planning'
  | 'resource_optimization'
  | 'ethical_evaluation'
  | 'system_integration'
  | 'unknown';

export interface DeliberationConfig {
  /** Maximum agents per deliberation (default: 5) */
  maxParticipants: number;
  /** Maximum deliberation rounds (locked at 2) */
  maxRounds: 2;
  /** Convergence threshold — fraction of agents that must agree (default: 2/3) */
  convergenceThreshold: number;
  /** Maximum time for a single deliberation in ms */
  timeoutMs: number;
}

export interface DeliberationResult {
  id: string;
  chosenStrategy: StrategyProposal;
  convergenceMethod: 'consensus' | 'architect_tiebreak';
  participatingAgents: string[];
  rounds: DeliberationRound[];
  constitutionallyValid: boolean;
  totalDurationMs: number;
  timestamp: Date;
}

export interface DeliberationRound {
  round: 1 | 2;
  proposals: StrategyProposal[];
  evaluations: Array<{
    agentId: string;
    targetProposalAgent: string;
    action: 'endorse' | 'challenge' | 'synthesize';
    reasoning: string;
    confidence: number;
  }>;
  durationMs: number;
}

const DEFAULT_CONFIG: DeliberationConfig = {
  maxParticipants: 5,
  maxRounds: 2,
  convergenceThreshold: 2 / 3,
  timeoutMs: 30_000,
};

/**
 * Maps problem domains to the agent types best suited to address them.
 * The Architect selects from this mapping when framing a problem.
 */
const DOMAIN_AGENT_MAPPING: Record<ProblemDomain, string[]> = {
  spatial_reasoning: ['technical', 'intelligence', 'implementation'],
  logical_deduction: ['strategic', 'intelligence', 'ethics'],
  pattern_recognition: ['intelligence', 'technical', 'tactical'],
  strategic_planning: ['strategic', 'financial', 'operations'],
  resource_optimization: ['operations', 'financial', 'tactical'],
  ethical_evaluation: ['ethics', 'strategic', 'communications'],
  system_integration: ['integration', 'technical', 'implementation'],
  unknown: ['strategic', 'intelligence', 'technical'],
};

/**
 * The Deliberation Engine orchestrates multi-agent strategy convergence.
 *
 * Protocol:
 *   1. Architect frames the problem and selects 3-5 agents
 *   2. Round 1: Each agent proposes a strategy independently (parallel)
 *   3. Round 2: Agents see all proposals, then endorse/challenge/synthesize
 *   4. If 2/3 agree → execute. No consensus → Architect decides.
 *   5. Constitutional gate validates the chosen strategy before execution.
 */
export class DeliberationEngine extends EventEmitter {
  private readonly config: DeliberationConfig;
  private readonly agents: Map<string, ICouncilAgent>;
  private readonly llmRouter: LLMRouter | null;
  private architectAgent: ICouncilAgent | null = null;
  private activeDeliberations: Map<string, boolean> = new Map();
  /** Tracks how many times each agent has been selected — used for round-robin rotation */
  private agentSelectionCount: Map<string, number> = new Map();

  constructor(config: Partial<DeliberationConfig> = {}, llmRouter?: LLMRouter) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config, maxRounds: 2 };
    this.agents = new Map();
    this.llmRouter = llmRouter ?? null;
  }

  registerAgent(agent: ICouncilAgent): void {
    this.agents.set(agent.id, agent);
    if (agent.type === 'architect') {
      this.architectAgent = agent;
    }
    this.emit('agent:registered', { agentId: agent.id, type: agent.type });
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    if (this.architectAgent?.id === agentId) {
      this.architectAgent = null;
    }
    this.emit('agent:unregistered', { agentId });
  }

  /**
   * Select agents for a deliberation based on problem domain.
   * Returns 3-5 agents best suited for the problem type.
   *
   * RESILIENCE (Carta review): Agents whose LLM provider is unavailable
   * are excluded. The council works with whoever is online. For ARC-AGI-3
   * competition conditions, you can't afford an agent going dark mid-deliberation.
   *
   * ROTATION: When multiple agents share a type (e.g., Aether and Axiom are both
   * 'technical'), we rotate selection so both get deliberation time. This preserves
   * provider diversity — Axiom (Mistral) won't always be shadowed by Aether (Anthropic).
   */
  async selectParticipants(domain: ProblemDomain): Promise<ICouncilAgent[]> {
    const preferredTypes = DOMAIN_AGENT_MAPPING[domain];
    const selected: ICouncilAgent[] = [];

    // Phase 5: Query historical performance for this domain
    // If we have enough data, use it to break ties between same-type agents
    let performanceData: Map<string, number> | null = null;
    try {
      const perf = await getAgentPerformanceByDomain(domain, 2);
      if (perf.length > 0) {
        performanceData = new Map(
          perf.map((p) => [p.agentId, p.winRate * 0.6 + p.consensusContribution * 0.4]),
        );
      }
    } catch {
      // No historical data yet (fresh database) — fall back to rotation only
    }

    for (const agentType of preferredTypes) {
      // Find ALL candidates for this type
      const candidates: ICouncilAgent[] = [];
      for (const agent of this.agents.values()) {
        if (
          agent.type === agentType &&
          agent.status !== 'error' &&
          agent.status !== 'maintenance' &&
          !selected.some((s) => s.id === agent.id)
        ) {
          candidates.push(agent);
        }
      }

      // Sort by: domain performance (if available), then by selection count for rotation
      candidates.sort((a, b) => {
        // If we have performance data, prefer the higher-performing agent
        if (performanceData) {
          const perfA = performanceData.get(a.id) ?? 0;
          const perfB = performanceData.get(b.id) ?? 0;
          if (Math.abs(perfA - perfB) > 0.1) {
            return perfB - perfA; // Higher performance first
          }
        }
        // Tiebreak by selection count (ascending) — least-selected first
        return (this.agentSelectionCount.get(a.id) ?? 0) - (this.agentSelectionCount.get(b.id) ?? 0);
      });

      // Pick the first available candidate
      for (const candidate of candidates) {
        if (this.llmRouter) {
          const available = await this.llmRouter.isAgentAvailable(candidate.id);
          if (!available) continue;
        }
        selected.push(candidate);
        this.agentSelectionCount.set(
          candidate.id,
          (this.agentSelectionCount.get(candidate.id) ?? 0) + 1,
        );
        break;
      }

      if (selected.length >= this.config.maxParticipants) break;
    }

    return selected;
  }

  /**
   * Run a full deliberation cycle.
   *
   * @param domain - The classified problem domain
   * @param environmentState - Current environment observation
   * @param context - Session and environment context
   * @returns The deliberation result with chosen strategy
   */
  async deliberate(
    domain: ProblemDomain,
    environmentState: EnvironmentObservation,
    context: AgentContext,
  ): Promise<DeliberationResult> {
    const deliberationId = uuidv4();
    const startTime = Date.now();
    this.activeDeliberations.set(deliberationId, true);

    this.emit('deliberation:start', { id: deliberationId, domain });

    const participants = await this.selectParticipants(domain);
    if (participants.length === 0) {
      throw new Error(`No agents available for domain: ${domain}`);
    }

    const deliberationContext: AgentContext = {
      ...context,
      phase: 'deliberation',
      metadata: { ...context.metadata, deliberationId, domain },
    };

    // Enforce timeout — a hung provider cannot block the entire deliberation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(
        `Deliberation ${deliberationId} timed out after ${this.config.timeoutMs}ms`
      )), this.config.timeoutMs);
    });

    const runDeliberation = async () => {
      // --- Round 1: Independent proposals (parallel) ---
      const round1Start = Date.now();
      const round1Results = await Promise.allSettled(
        participants.map((agent) =>
          agent.proposeStrategy(deliberationContext, environmentState),
        ),
      );

      // Collect successful proposals, log failures — the council works with whoever responds
      const round1Proposals: StrategyProposal[] = [];
      for (let i = 0; i < round1Results.length; i++) {
        const result = round1Results[i]!;
        if (result.status === 'fulfilled') {
          round1Proposals.push(result.value);
        } else {
          this.emit('deliberation:agent_error', {
            id: deliberationId,
            agentId: participants[i]!.id,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      }

      if (round1Proposals.length === 0) {
        throw new Error(`All agents failed in Round 1 for domain: ${domain}`);
      }

      const round1: DeliberationRound = {
        round: 1,
        proposals: round1Proposals,
        evaluations: [],
        durationMs: Date.now() - round1Start,
      };

      this.emit('deliberation:round', { id: deliberationId, round: 1, proposals: round1Proposals.length });

      // --- Round 2: Evaluate all proposals (parallel per agent) ---
      const round2Start = Date.now();
      const round2Evaluations: DeliberationRound['evaluations'] = [];
      const round2Proposals: StrategyProposal[] = [];

      // Only agents who succeeded in Round 1 participate in Round 2
      const round1AgentIds = new Set(round1Proposals.map((p) => p.agentId));
      const round2Participants = participants.filter((a) => round1AgentIds.has(a.id));

      await Promise.allSettled(
        round2Participants.map(async (agent) => {
          // Each agent evaluates every OTHER agent's proposal
          const otherProposals = round1Proposals.filter((p) => p.agentId !== agent.id);

          for (const proposal of otherProposals) {
            const evaluation = await agent.evaluateProposal(proposal, deliberationContext);
            round2Evaluations.push({
              agentId: agent.id,
              targetProposalAgent: proposal.agentId,
              action: evaluation.action,
              reasoning: evaluation.reasoning,
              confidence: evaluation.confidence,
            });

            // If synthesizing, that becomes a new proposal
            if (evaluation.action === 'synthesize' && evaluation.alternativeStrategy) {
              round2Proposals.push({
                agentId: agent.id,
                strategy: evaluation.alternativeStrategy,
                reasoning: evaluation.reasoning,
                confidence: evaluation.confidence,
                estimatedEfficiency: proposal.estimatedEfficiency,
                risks: [],
                round: 2,
              });
            }
          }
        }),
      );

      const round2: DeliberationRound = {
        round: 2,
        proposals: round2Proposals,
        evaluations: round2Evaluations,
        durationMs: Date.now() - round2Start,
      };

      this.emit('deliberation:round', { id: deliberationId, round: 2, evaluations: round2Evaluations.length });

      return { round1, round1Proposals, round2, round2Proposals, round2Evaluations };
    };

    const { round1, round1Proposals, round2, round2Proposals, round2Evaluations } =
      await Promise.race([runDeliberation(), timeoutPromise]);

    // --- Convergence check ---
    const allProposals = [...round1Proposals, ...round2Proposals];
    const chosenStrategy = this.resolveConvergence(allProposals, round2Evaluations, participants);

    const result: DeliberationResult = {
      id: deliberationId,
      chosenStrategy: chosenStrategy.strategy,
      convergenceMethod: chosenStrategy.method,
      participatingAgents: participants.map((a) => a.id),
      rounds: [round1, round2],
      constitutionallyValid: false, // Set by constitutional gate downstream
      totalDurationMs: Date.now() - startTime,
      timestamp: new Date(),
    };

    this.activeDeliberations.delete(deliberationId);
    this.emit('deliberation:complete', result);

    return result;
  }

  /**
   * Resolve convergence: 2/3 endorsement or Architect tiebreak.
   *
   * Endorsements flow to Round 1 proposals via targetProposalAgent.
   * Round 2 synthesis proposals inherit endorsement credit:
   *   - The synthesizing agent implicitly endorses their own synthesis
   *   - A synthesis that combines endorsed R1 proposals inherits support
   */
  private resolveConvergence(
    proposals: StrategyProposal[],
    evaluations: DeliberationRound['evaluations'],
    participants: ICouncilAgent[],
  ): { strategy: StrategyProposal; method: 'consensus' | 'architect_tiebreak' } {
    // Use proposal index as key to handle duplicate agentIds across rounds
    const proposalKey = (p: StrategyProposal) => `${p.agentId}_r${p.round}`;

    // Initialize endorsement counts for all proposals
    const endorsementCounts = new Map<string, number>();
    for (const proposal of proposals) {
      endorsementCounts.set(proposalKey(proposal), 0);
    }

    // Count explicit endorsements from Round 2 evaluations (target Round 1 proposals)
    for (const evaluation of evaluations) {
      if (evaluation.action === 'endorse') {
        const key = `${evaluation.targetProposalAgent}_r1`;
        const current = endorsementCounts.get(key) ?? 0;
        endorsementCounts.set(key, current + 1);
      }
    }

    // Synthesis proposals get implicit credit: the synthesizer endorses their own synthesis,
    // plus any agent who endorsed the proposals being synthesized gives partial support
    for (const proposal of proposals) {
      if (proposal.round === 2) {
        // The synthesizing agent implicitly endorses their own synthesis
        const key = proposalKey(proposal);
        endorsementCounts.set(key, (endorsementCounts.get(key) ?? 0) + 1);
      }
    }

    // Check for 2/3 consensus
    const threshold = Math.ceil(participants.length * this.config.convergenceThreshold);
    let bestProposal: StrategyProposal | null = null;
    let bestEndorsements = 0;

    for (const proposal of proposals) {
      const endorsements = endorsementCounts.get(proposalKey(proposal)) ?? 0;
      if (endorsements >= threshold) {
        if (endorsements > bestEndorsements) {
          bestEndorsements = endorsements;
          bestProposal = proposal;
        }
      }
    }

    if (bestProposal) {
      return { strategy: bestProposal, method: 'consensus' };
    }

    // No consensus — Architect decides
    // Pick the proposal with highest confidence + efficiency score
    const ranked = [...proposals].sort(
      (a, b) => (b.confidence + b.estimatedEfficiency) - (a.confidence + a.estimatedEfficiency),
    );

    return {
      strategy: ranked[0] ?? proposals[0]!,
      method: 'architect_tiebreak',
    };
  }

  getActiveDeliberationCount(): number {
    return this.activeDeliberations.size;
  }

  getRegisteredAgentCount(): number {
    return this.agents.size;
  }
}

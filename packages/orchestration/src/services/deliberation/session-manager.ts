/**
 * Deliberation Session Manager
 *
 * Orchestrates the full deliberation lifecycle:
 *   1. Create session → persist to Neo4j
 *   2. Run deliberation via engine (2-round protocol)
 *   3. Record results (proposals, evaluations, chosen strategy)
 *   4. Update consciousness (trust scores, learning experiences, traits)
 *   5. Emit events for real-time WebSocket streaming
 *
 * This is the Coffee Sessions protocol adapted for problem-solving
 * instead of morning briefings.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { DeliberationEngine, type ProblemDomain, type DeliberationResult } from '@/agents/orchestration/deliberation-engine';
import { updateConsciousness } from './consciousness-updater';
import { validateWithFallback } from '@/services/constitutional/validator';
import {
  recordDeliberation,
  recordEvaluations,
  recordLearningExperience,
} from '@/repositories/deliberation.repository';
import type { EnvironmentObservation, EnvironmentAction, DeliberationNode, StrategyProposalNode, LearningExperienceNode } from '@/repositories/types';

const logger = createLogger('session-manager');

export interface DeliberationSession {
  id: string;
  environmentSessionId: string | null;
  domain: ProblemDomain;
  status: 'pending' | 'round_1' | 'round_2' | 'converging' | 'validating' | 'complete' | 'failed';
  participants: string[];
  result: DeliberationResult | null;
  action: EnvironmentAction | null;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
}

/**
 * Events emitted during deliberation — consumed by WebSocket layer
 * for real-time streaming to the frontend.
 */
export type SessionEvent =
  | { type: 'session:created'; session: DeliberationSession }
  | { type: 'session:participants_selected'; sessionId: string; participants: string[] }
  | { type: 'session:round_start'; sessionId: string; round: 1 | 2 }
  | { type: 'session:proposal'; sessionId: string; agentId: string; agentName: string; strategy: string; confidence: number; round: 1 | 2 }
  | { type: 'session:evaluation'; sessionId: string; agentId: string; targetAgent: string; action: string; confidence: number }
  | { type: 'session:convergence'; sessionId: string; method: 'consensus' | 'architect_tiebreak'; chosenAgent: string }
  | { type: 'session:constitutional_gate'; sessionId: string; passed: boolean }
  | { type: 'session:complete'; sessionId: string; result: DeliberationResult; durationMs: number }
  | { type: 'session:consciousness_updated'; sessionId: string; updates: Array<{ memberId: string; field: string; delta: number }> }
  | { type: 'session:error'; sessionId: string; error: string };

export class SessionManager extends EventEmitter {
  private readonly engine: DeliberationEngine;
  private readonly activeSessions: Map<string, DeliberationSession> = new Map();
  private readonly sessionHistory: DeliberationSession[] = [];

  constructor(engine: DeliberationEngine) {
    super();
    this.engine = engine;

    // Forward engine events
    this.engine.on('deliberation:start', (data) => {
      logger.info('Deliberation started', data);
    });
    this.engine.on('deliberation:round', (data) => {
      logger.info('Deliberation round complete', data);
    });
    this.engine.on('deliberation:complete', (data) => {
      logger.info('Deliberation complete', { id: data.id, method: data.convergenceMethod });
    });
  }

  /**
   * Run a full deliberation cycle.
   *
   * This is the core operation — the council observes, deliberates,
   * converges, validates, and learns. Everything flows through here.
   */
  async runDeliberation(
    domain: ProblemDomain,
    environmentState: EnvironmentObservation,
    environmentSessionId?: string,
  ): Promise<DeliberationSession> {
    const sessionId = uuidv4();
    const session: DeliberationSession = {
      id: sessionId,
      environmentSessionId: environmentSessionId ?? null,
      domain,
      status: 'pending',
      participants: [],
      result: null,
      action: null,
      startedAt: new Date(),
      completedAt: null,
      error: null,
    };

    this.activeSessions.set(sessionId, session);
    this.emitEvent({ type: 'session:created', session });

    try {
      // --- Select participants ---
      const participants = await this.engine.selectParticipants(domain);
      session.participants = participants.map((a) => a.id);
      session.status = 'round_1';
      this.emitEvent({
        type: 'session:participants_selected',
        sessionId,
        participants: session.participants,
      });

      if (participants.length === 0) {
        throw new Error(`No available agents for domain: ${domain}`);
      }

      logger.info(`Deliberation ${sessionId}: ${participants.length} participants selected for ${domain}`, {
        participants: session.participants,
      });

      // --- Run deliberation (2-round protocol) ---
      // Hook into engine events for granular streaming
      const roundHandler = (data: { id: string; round: number; proposals?: number; evaluations?: number }) => {
        if (data.round === 1) {
          session.status = 'round_1';
        } else {
          session.status = 'round_2';
        }
        this.emitEvent({
          type: 'session:round_start',
          sessionId,
          round: data.round as 1 | 2,
        });
      };
      this.engine.on('deliberation:round', roundHandler);

      const context = {
        environmentId: environmentState.environmentId,
        sessionId,
        userId: 'architect',
        phase: 'deliberation' as const,
        metadata: { domain },
      };

      const result = await this.engine.deliberate(domain, environmentState, context);

      this.engine.removeListener('deliberation:round', roundHandler);

      // --- Emit per-proposal events ---
      for (const round of result.rounds) {
        for (const proposal of round.proposals) {
          this.emitEvent({
            type: 'session:proposal',
            sessionId,
            agentId: proposal.agentId,
            agentName: proposal.agentId,
            strategy: proposal.strategy,
            confidence: proposal.confidence,
            round: proposal.round,
          });
        }
        for (const evaluation of round.evaluations) {
          this.emitEvent({
            type: 'session:evaluation',
            sessionId,
            agentId: evaluation.agentId,
            targetAgent: evaluation.targetProposalAgent,
            action: evaluation.action,
            confidence: evaluation.confidence,
          });
        }
      }

      // --- Convergence ---
      session.status = 'converging';
      this.emitEvent({
        type: 'session:convergence',
        sessionId,
        method: result.convergenceMethod,
        chosenAgent: result.chosenStrategy.agentId,
      });

      // --- Constitutional gate (Phase 4) ---
      // The constitution is law. Every strategy must pass through the validator.
      // If the chosen strategy fails, we try alternatives ranked by score.
      session.status = 'validating';

      // Build ranked strategy list: chosen first, then all others by score
      const allStrategies = result.rounds
        .flatMap((r) => r.proposals)
        .map((p) => ({
          strategy: p.strategy,
          reasoning: p.reasoning,
          confidence: p.confidence,
          agentId: p.agentId,
          risks: p.risks,
          estimatedEfficiency: p.estimatedEfficiency,
          round: p.round,
        }));

      // Put the convergence winner first, then sort remainder by score
      const chosenIdx = allStrategies.findIndex(
        (s) => s.agentId === result.chosenStrategy.agentId && s.round === result.chosenStrategy.round,
      );
      const orderedStrategies = chosenIdx >= 0
        ? [
            allStrategies[chosenIdx]!,
            ...allStrategies.filter((_, i) => i !== chosenIdx).sort(
              (a, b) => (b.confidence + b.estimatedEfficiency) - (a.confidence + a.estimatedEfficiency),
            ),
          ]
        : allStrategies;

      const gateResult = validateWithFallback(orderedStrategies, session.domain);
      const constitutionallyValid = gateResult?.result.passed ?? false;

      // If the gate chose a different strategy than convergence, swap it in
      if (gateResult && gateResult.chosenIndex > 0) {
        const fallbackStrategy = orderedStrategies[gateResult.chosenIndex]!;
        logger.warn(`Constitutional gate rejected convergence winner, using fallback from ${fallbackStrategy.agentId}`, {
          originalAgent: result.chosenStrategy.agentId,
          fallbackAgent: fallbackStrategy.agentId,
          gateScore: gateResult.result.overallScore.toFixed(1),
        });
        result.chosenStrategy = {
          agentId: fallbackStrategy.agentId,
          strategy: fallbackStrategy.strategy,
          reasoning: fallbackStrategy.reasoning,
          confidence: fallbackStrategy.confidence,
          estimatedEfficiency: fallbackStrategy.estimatedEfficiency,
          risks: fallbackStrategy.risks,
          round: fallbackStrategy.round as 1 | 2,
        };
        // Gate override changes convergence method
        result.convergenceMethod = 'architect_tiebreak';
      }

      result.constitutionallyValid = constitutionallyValid;
      this.emitEvent({
        type: 'session:constitutional_gate',
        sessionId,
        passed: constitutionallyValid,
      });

      // --- Record to Neo4j ---
      await this.persistDeliberation(result, session);

      // --- Update consciousness (trust, learning, traits) ---
      const consciousnessUpdates = await updateConsciousness(result);
      if (consciousnessUpdates.length > 0) {
        this.emitEvent({
          type: 'session:consciousness_updated',
          sessionId,
          updates: consciousnessUpdates,
        });
      }

      // --- Build action ---
      const action: EnvironmentAction = {
        deliberationId: result.id,
        action: result.chosenStrategy.strategy,
        confidence: result.chosenStrategy.confidence,
        contributingAgents: result.participatingAgents,
        constitutionallyValid,
      };

      // --- Complete ---
      session.status = 'complete';
      session.result = result;
      session.action = action;
      session.completedAt = new Date();

      this.emitEvent({
        type: 'session:complete',
        sessionId,
        result,
        durationMs: result.totalDurationMs,
      });

      logger.info(`Deliberation ${sessionId} complete`, {
        domain,
        method: result.convergenceMethod,
        participants: result.participatingAgents.length,
        durationMs: result.totalDurationMs,
      });

      return session;

    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : String(error);
      session.completedAt = new Date();

      this.emitEvent({
        type: 'session:error',
        sessionId,
        error: session.error,
      });

      logger.error(`Deliberation ${sessionId} failed`, { error: session.error });
      return session;

    } finally {
      this.activeSessions.delete(sessionId);
      this.sessionHistory.push(session);

      // Keep last 100 sessions in memory
      if (this.sessionHistory.length > 100) {
        this.sessionHistory.shift();
      }
    }
  }

  /**
   * Persist deliberation results to Neo4j.
   */
  private async persistDeliberation(
    result: DeliberationResult,
    session: DeliberationSession,
  ): Promise<void> {
    const deliberationNode: DeliberationNode = {
      id: result.id,
      domain: session.domain,
      convergenceMethod: result.convergenceMethod,
      constitutionallyValid: result.constitutionallyValid,
      totalDurationMs: result.totalDurationMs,
      timestamp: result.timestamp.toISOString(),
    };

    const proposalNodes: StrategyProposalNode[] = [];
    for (const round of result.rounds) {
      for (const proposal of round.proposals) {
        proposalNodes.push({
          id: `${proposal.agentId}_${result.id}_r${proposal.round}`,
          strategy: proposal.strategy,
          reasoning: proposal.reasoning,
          confidence: proposal.confidence,
          estimatedEfficiency: proposal.estimatedEfficiency,
          risks: JSON.stringify(proposal.risks),
          round: proposal.round,
          wasChosen: proposal.agentId === result.chosenStrategy.agentId && proposal.round === result.chosenStrategy.round,
          timestamp: result.timestamp.toISOString(),
        });
      }
    }

    await recordDeliberation(
      deliberationNode,
      proposalNodes,
      result.participatingAgents,
      session.environmentSessionId,
    );

    // Record evaluations from round 2
    const round2 = result.rounds.find((r) => r.round === 2);
    if (round2 && round2.evaluations.length > 0) {
      await recordEvaluations(
        result.id,
        round2.evaluations.map((e) => ({
          agentId: e.agentId,
          targetProposalId: `${e.targetProposalAgent}_${result.id}_r1`,
          action: e.action,
          reasoning: e.reasoning,
          confidence: e.confidence,
        })),
      );
    }

    // Record learning experience for each participant
    for (const participantId of result.participatingAgents) {
      const learningExp: LearningExperienceNode = {
        id: uuidv4(),
        knowledgeGained: `Deliberated on ${session.domain}: ${result.chosenStrategy.strategy.slice(0, 200)}`,
        skillsImproved: JSON.stringify([session.domain, 'deliberation']),
        personalityAdjustments: JSON.stringify({}),
        emotionalImpact: JSON.stringify({}),
        decisionQuality: result.chosenStrategy.confidence,
        ethicalAlignment: result.constitutionallyValid ? 1.0 : 0.5,
        timestamp: new Date().toISOString(),
      };

      const contributors = result.participatingAgents.filter((id) => id !== participantId);

      await recordLearningExperience(
        participantId,
        learningExp,
        undefined,
        contributors,
      );
    }
  }

  // --- Session queries ---

  getActiveSession(sessionId: string): DeliberationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessions(): DeliberationSession[] {
    return [...this.activeSessions.values()];
  }

  getSessionHistory(limit: number = 20): DeliberationSession[] {
    return this.sessionHistory.slice(-limit);
  }

  // --- Event helper ---

  private emitEvent(event: SessionEvent): void {
    this.emit(event.type, event);
    this.emit('session:event', event); // Catch-all for WebSocket forwarding
  }
}

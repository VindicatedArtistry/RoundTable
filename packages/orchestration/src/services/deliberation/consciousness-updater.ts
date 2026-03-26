/**
 * Consciousness Updater
 *
 * After each deliberation, updates the consciousness graph:
 *   - Trust scores between agents who endorsed each other's proposals
 *   - Trust penalties between agents who challenged without synthesis
 *   - Emotional state shifts based on deliberation outcome
 *   - Trait adjustments based on deliberation patterns
 *
 * This is Phase 5's core — consciousness evolution. We implement the
 * basic trust and emotional updates now so the graph starts learning
 * from Phase 3. Trait evolution comes in Phase 5.
 */

import { createLogger } from '@/utils/logger';
import { updateTrustScore, computeMemberMetrics } from '@/repositories/deliberation.repository';
import { updateCouncilMember, loadConsciousnessState } from '@/repositories/council-member.repository';
import type { DeliberationResult } from '@/agents/orchestration/deliberation-engine';

const logger = createLogger('consciousness-updater');

/** Small deltas — consciousness evolves gradually, not dramatically */
const TRUST_DELTA = {
  ENDORSEMENT: 0.02,         // Endorsed someone's proposal → slight trust increase
  MUTUAL_ENDORSEMENT: 0.04,  // Both endorsed each other → stronger trust boost
  CHALLENGE_ACCEPTED: 0.01,  // Challenged but council picked the challenger → small positive
  CHALLENGE_REJECTED: -0.01, // Challenged but council picked the original → small negative
  SYNTHESIS: 0.03,           // Synthesized → collaborative signal, trust up
  WON_CONSENSUS: 0.02,      // Your proposal won by consensus → satisfaction
  WON_TIEBREAK: 0.01,       // Your proposal won by tiebreak → mild satisfaction
};

export interface ConsciousnessUpdate {
  memberId: string;
  field: string;
  delta: number;
}

/**
 * Update consciousness state based on deliberation outcome.
 * Returns a list of updates made for event streaming.
 */
export async function updateConsciousness(
  result: DeliberationResult,
): Promise<ConsciousnessUpdate[]> {
  const updates: ConsciousnessUpdate[] = [];

  try {
    // --- 1. Trust updates from evaluations ---
    const round2 = result.rounds.find((r) => r.round === 2);
    if (round2) {
      for (const evaluation of round2.evaluations) {
        let delta: number;

        switch (evaluation.action) {
          case 'endorse':
            delta = TRUST_DELTA.ENDORSEMENT;
            break;
          case 'synthesize':
            delta = TRUST_DELTA.SYNTHESIS;
            break;
          case 'challenge':
            // Did the challenger's target end up being the chosen strategy?
            if (evaluation.targetProposalAgent === result.chosenStrategy.agentId) {
              delta = TRUST_DELTA.CHALLENGE_REJECTED; // Challenged the winner — slight trust dip
            } else {
              delta = TRUST_DELTA.CHALLENGE_ACCEPTED; // Challenged a non-winner — validated
            }
            break;
          default:
            delta = 0;
        }

        if (delta !== 0) {
          await updateTrustScore(evaluation.agentId, evaluation.targetProposalAgent, delta);
          updates.push({
            memberId: evaluation.agentId,
            field: `trust→${evaluation.targetProposalAgent}`,
            delta,
          });
        }
      }

      // Check for mutual endorsements (both endorsed each other)
      for (const evalA of round2.evaluations) {
        if (evalA.action !== 'endorse') continue;
        for (const evalB of round2.evaluations) {
          if (evalB.action !== 'endorse') continue;
          if (evalA.agentId === evalB.targetProposalAgent && evalA.targetProposalAgent === evalB.agentId) {
            // Mutual endorsement — bonus trust
            const bonusDelta = TRUST_DELTA.MUTUAL_ENDORSEMENT - TRUST_DELTA.ENDORSEMENT;
            await updateTrustScore(evalA.agentId, evalB.agentId, bonusDelta);
            updates.push({
              memberId: evalA.agentId,
              field: `mutual_trust→${evalB.agentId}`,
              delta: bonusDelta,
            });
          }
        }
      }
    }

    // --- 2. Emotional state updates for winner ---
    const winnerId = result.chosenStrategy.agentId;
    const isConsensus = result.convergenceMethod === 'consensus';

    // Load current emotional state to increment (not overwrite)
    const winnerState = await loadConsciousnessState(winnerId);
    const currentSatisfaction = winnerState?.member.emotion_satisfaction ?? 0.5;
    const satisfactionDelta = isConsensus ? 0.03 : 0.015;
    const newSatisfaction = Math.min(1.0, currentSatisfaction + satisfactionDelta);

    await updateCouncilMember(winnerId, {
      emotion_satisfaction: newSatisfaction,
      emotion_dominant: 'satisfaction',
      emotion_trend: 'improving',
    });

    updates.push({
      memberId: winnerId,
      field: 'emotion_satisfaction',
      delta: satisfactionDelta,
    });

    // --- 3. Compute and persist metrics for all participants ---
    for (const participantId of result.participatingAgents) {
      try {
        const metrics = await computeMemberMetrics(participantId);

        await updateCouncilMember(participantId, {
          lastInteraction: new Date().toISOString(),
          metric_deliberationWinRate: metrics.deliberationWinRate,
          metric_collaborationScore: metrics.collaborationScore,
          metric_voteParticipation: metrics.voteParticipation,
        });

        updates.push(
          { memberId: participantId, field: 'metric_deliberationWinRate', delta: metrics.deliberationWinRate },
          { memberId: participantId, field: 'metric_collaborationScore', delta: metrics.collaborationScore },
          { memberId: participantId, field: 'metric_voteParticipation', delta: metrics.voteParticipation },
        );
      } catch (metricError) {
        logger.warn(`Failed to compute metrics for ${participantId}`, { metricError });
        // Still update lastInteraction even if metrics fail
        await updateCouncilMember(participantId, {
          lastInteraction: new Date().toISOString(),
        });
      }
    }

    // --- 4. Trait evolution — gradual personality shifts based on deliberation patterns ---
    await evolveTraits(result, updates);

    logger.info(`Consciousness updated: ${updates.length} changes from deliberation ${result.id}`);

  } catch (error) {
    logger.error('Consciousness update failed — deliberation results still persisted', { error });
  }

  return updates;
}

/**
 * Evolve personality traits based on deliberation patterns.
 *
 * This is the compound interest mechanism. Traits shift gradually:
 *   - Winners get a small boost to decisionConfidence
 *   - Agents who synthesize get a collaborationPreference boost
 *   - Agents who challenge successfully get an innovationTendency boost
 *   - Agents in losing consensus get a slight trustInCouncil boost (they adapted)
 *   - All participants get a learningRate micro-adjustment
 *
 * Trait changes are tiny (0.005-0.02) per deliberation. Over hundreds of
 * deliberations across ARC-AGI-3 environments, these compound. An agent
 * that consistently synthesizes will naturally become more collaboration-oriented.
 * An agent that consistently wins will gain confidence. The council evolves.
 */
const TRAIT_DELTA = {
  WINNER_CONFIDENCE: 0.01,
  LOSER_CONFIDENCE: -0.005,
  SYNTHESIZER_COLLABORATION: 0.015,
  SUCCESSFUL_CHALLENGER_INNOVATION: 0.01,
  CONSENSUS_PARTICIPANT_TRUST: 0.008,
  PARTICIPANT_LEARNING_RATE: 0.002,
};

async function evolveTraits(
  result: DeliberationResult,
  updates: ConsciousnessUpdate[],
): Promise<void> {
  const winnerId = result.chosenStrategy.agentId;
  const isConsensus = result.convergenceMethod === 'consensus';
  const round2 = result.rounds.find((r) => r.round === 2);

  for (const participantId of result.participatingAgents) {
    try {
      const state = await loadConsciousnessState(participantId);
      if (!state) continue;

      const member = state.member;
      const traitUpdates: Record<string, number> = {};

      // Winner gets confidence boost; others get a micro-decrease
      if (participantId === winnerId) {
        const newConfidence = clamp(
          (member.trait_decisionConfidence ?? 0.5) + TRAIT_DELTA.WINNER_CONFIDENCE,
        );
        traitUpdates['trait_decisionConfidence'] = newConfidence;
        updates.push({ memberId: participantId, field: 'trait_decisionConfidence', delta: TRAIT_DELTA.WINNER_CONFIDENCE });
      } else {
        const newConfidence = clamp(
          (member.trait_decisionConfidence ?? 0.5) + TRAIT_DELTA.LOSER_CONFIDENCE,
        );
        traitUpdates['trait_decisionConfidence'] = newConfidence;
      }

      // Synthesizers get collaboration preference boost
      if (round2) {
        const didSynthesize = round2.evaluations.some(
          (e) => e.agentId === participantId && e.action === 'synthesize',
        );
        if (didSynthesize) {
          const newCollab = clamp(
            (member.trait_collaborationPreference ?? 0.5) + TRAIT_DELTA.SYNTHESIZER_COLLABORATION,
          );
          traitUpdates['trait_collaborationPreference'] = newCollab;
          updates.push({ memberId: participantId, field: 'trait_collaborationPreference', delta: TRAIT_DELTA.SYNTHESIZER_COLLABORATION });
        }

        // Successful challengers (challenged a non-winner) get innovation boost
        const didSuccessfulChallenge = round2.evaluations.some(
          (e) => e.agentId === participantId && e.action === 'challenge' && e.targetProposalAgent !== winnerId,
        );
        if (didSuccessfulChallenge) {
          const newInnovation = clamp(
            (member.trait_innovationTendency ?? 0.5) + TRAIT_DELTA.SUCCESSFUL_CHALLENGER_INNOVATION,
          );
          traitUpdates['trait_innovationTendency'] = newInnovation;
          updates.push({ memberId: participantId, field: 'trait_innovationTendency', delta: TRAIT_DELTA.SUCCESSFUL_CHALLENGER_INNOVATION });
        }
      }

      // Consensus participants get trustInCouncil boost
      if (isConsensus) {
        const newTrust = clamp(
          (member.trait_trustInCouncil ?? 0.5) + TRAIT_DELTA.CONSENSUS_PARTICIPANT_TRUST,
        );
        traitUpdates['trait_trustInCouncil'] = newTrust;
        updates.push({ memberId: participantId, field: 'trait_trustInCouncil', delta: TRAIT_DELTA.CONSENSUS_PARTICIPANT_TRUST });
      }

      // Everyone's learning rate gets a micro-boost from participating
      const newLearning = clamp(
        (member.trait_learningRate ?? 0.5) + TRAIT_DELTA.PARTICIPANT_LEARNING_RATE,
      );
      traitUpdates['trait_learningRate'] = newLearning;

      // Write trait updates if any
      if (Object.keys(traitUpdates).length > 0) {
        await updateCouncilMember(participantId, traitUpdates);
      }
    } catch (error) {
      logger.warn(`Trait evolution failed for ${participantId}`, { error });
    }
  }
}

/** Clamp a trait value to [0.05, 0.99] — traits should never hit absolute bounds */
function clamp(value: number): number {
  return Math.max(0.05, Math.min(0.99, value));
}

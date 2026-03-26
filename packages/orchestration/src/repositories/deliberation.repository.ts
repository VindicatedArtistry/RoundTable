/**
 * Deliberation repository — Neo4j operations for deliberation tracking.
 * Records deliberation cycles, strategy proposals, endorsements, and learning.
 *
 * This is where the compound interest lives — every deliberation outcome
 * feeds back into the graph so the next deliberation is better informed.
 */

import { executeRead, executeWrite } from '@/services/graph/neo4j.service';
import type { ManagedTransaction } from 'neo4j-driver';
import type {
  DeliberationNode,
  StrategyProposalNode,
  LearningExperienceNode,
} from './types';

/**
 * Record a complete deliberation with all proposals and relationships.
 * Uses a single write transaction for atomicity.
 */
export async function recordDeliberation(
  deliberation: DeliberationNode,
  proposals: StrategyProposalNode[],
  participantIds: string[],
  environmentSessionId: string | null,
): Promise<void> {
  await executeWrite(async (tx: ManagedTransaction) => {
    // Create the deliberation node
    await tx.run(
      `CREATE (d:Deliberation {
        id: $id,
        domain: $domain,
        convergenceMethod: $convergenceMethod,
        constitutionallyValid: $constitutionallyValid,
        totalDurationMs: $totalDurationMs,
        timestamp: $timestamp
      })`,
      deliberation,
    );

    // Link to environment session if present
    if (environmentSessionId) {
      await tx.run(
        `MATCH (d:Deliberation {id: $dId})
         MATCH (e:EnvironmentSession {id: $eId})
         CREATE (d)-[:OCCURRED_IN]->(e)`,
        { dId: deliberation.id, eId: environmentSessionId },
      );
    }

    // Link participants
    for (const participantId of participantIds) {
      await tx.run(
        `MATCH (d:Deliberation {id: $dId})
         MATCH (m:CouncilMember {id: $mId})
         CREATE (m)-[:PARTICIPATED_IN_DELIBERATION {role: 'participant'}]->(d)`,
        { dId: deliberation.id, mId: participantId },
      );
    }

    // Create proposals and link to deliberation + proposer
    for (const proposal of proposals) {
      await tx.run(
        `CREATE (s:StrategyProposal {
          id: $id,
          strategy: $strategy,
          reasoning: $reasoning,
          confidence: $confidence,
          estimatedEfficiency: $estimatedEfficiency,
          risks: $risks,
          round: $round,
          wasChosen: $wasChosen,
          timestamp: $timestamp
        })
        WITH s
        MATCH (d:Deliberation {id: $dId})
        CREATE (s)-[:PROPOSED_IN]->(d)
        WITH s
        MATCH (m:CouncilMember {id: $proposerId})
        CREATE (m)-[:PROPOSED]->(s)`,
        {
          ...proposal,
          dId: deliberation.id,
          proposerId: proposal.id.split('_')[0] ?? proposal.id, // agentId prefix
        },
      );
    }
  });
}

/**
 * Record endorsements, challenges, and syntheses for a deliberation.
 */
export async function recordEvaluations(
  deliberationId: string,
  evaluations: Array<{
    agentId: string;
    targetProposalId: string;
    action: 'endorse' | 'challenge' | 'synthesize';
    reasoning: string;
    confidence: number;
    alternativeStrategy?: string;
  }>,
): Promise<void> {
  await executeWrite(async (tx: ManagedTransaction) => {
    for (const evaluation of evaluations) {
      const relType = evaluation.action === 'endorse' ? 'ENDORSED'
        : evaluation.action === 'challenge' ? 'CHALLENGED'
        : 'SYNTHESIZED';

      const props = evaluation.action === 'synthesize'
        ? 'reasoning: $reasoning, confidence: $confidence, synthesizedStrategy: $alt, timestamp: $ts'
        : evaluation.action === 'challenge'
        ? 'reasoning: $reasoning, confidence: $confidence, alternativeStrategy: $alt, timestamp: $ts'
        : 'reasoning: $reasoning, confidence: $confidence, timestamp: $ts';

      await tx.run(
        `MATCH (m:CouncilMember {id: $agentId})
         MATCH (s:StrategyProposal {id: $targetId})
         CREATE (m)-[:${relType} {${props}}]->(s)`,
        {
          agentId: evaluation.agentId,
          targetId: evaluation.targetProposalId,
          reasoning: evaluation.reasoning,
          confidence: evaluation.confidence,
          alt: evaluation.alternativeStrategy ?? null,
          ts: new Date().toISOString(),
        },
      );
    }
  });
}

/**
 * Record a learning experience with versioning.
 * Matches TheFulcrum's HAS_TRAIT versioning pattern — supersedes old version.
 */
export async function recordLearningExperience(
  memberId: string,
  experience: LearningExperienceNode,
  conversationId?: string,
  contributingMemberIds?: string[],
): Promise<void> {
  await executeWrite(async (tx: ManagedTransaction) => {
    // Create the learning experience node
    await tx.run(
      `CREATE (l:LearningExperience {
        id: $id,
        knowledgeGained: $knowledgeGained,
        skillsImproved: $skillsImproved,
        personalityAdjustments: $personalityAdjustments,
        emotionalImpact: $emotionalImpact,
        decisionQuality: $decisionQuality,
        ethicalAlignment: $ethicalAlignment,
        timestamp: $timestamp
      })`,
      experience,
    );

    // Link learner with versioned edge
    // First, get the current max version
    const versionResult = await tx.run(
      `MATCH (m:CouncilMember {id: $memberId})-[l:LEARNED]->(:LearningExperience)
       WHERE l.supersededAt IS NULL
       RETURN count(l) AS currentVersion`,
      { memberId },
    );
    const currentVersion = (versionResult.records[0]?.get('currentVersion') as { toNumber(): number } | undefined)?.toNumber() ?? 0;

    // Create the LEARNED edge with version
    await tx.run(
      `MATCH (m:CouncilMember {id: $memberId})
       MATCH (l:LearningExperience {id: $leId})
       CREATE (m)-[:LEARNED {
         impact: $impact,
         version: $version,
         supersededAt: null,
         timestamp: $ts
       }]->(l)`,
      {
        memberId,
        leId: experience.id,
        impact: experience.decisionQuality,
        version: currentVersion + 1,
        ts: new Date().toISOString(),
      },
    );

    // Link to source conversation if present
    if (conversationId) {
      await tx.run(
        `MATCH (l:LearningExperience {id: $leId})
         MATCH (c:Conversation {id: $cId})
         CREATE (l)-[:GENERATED_FROM]->(c)`,
        { leId: experience.id, cId: conversationId },
      );
    }

    // Link contributing members
    if (contributingMemberIds) {
      for (const contributorId of contributingMemberIds) {
        await tx.run(
          `MATCH (m:CouncilMember {id: $mId})
           MATCH (l:LearningExperience {id: $leId})
           CREATE (m)-[:CONTRIBUTED_TO_LEARNING]->(l)`,
          { mId: contributorId, leId: experience.id },
        );
      }
    }
  });
}

/**
 * Update trust between two members after a deliberation.
 * Clamped to [0, 1] range.
 */
export async function updateTrustScore(
  fromId: string,
  toId: string,
  delta: number,
): Promise<void> {
  await executeWrite(async (tx: ManagedTransaction) => {
    await tx.run(
      `MATCH (a:CouncilMember {id: $fromId})-[t:TRUSTS]->(b:CouncilMember {id: $toId})
       SET t.score = CASE
         WHEN t.score + $delta > 1.0 THEN 1.0
         WHEN t.score + $delta < 0.0 THEN 0.0
         ELSE t.score + $delta
       END,
       t.interactions = t.interactions + 1,
       t.lastUpdated = $now`,
      { fromId, toId, delta, now: new Date().toISOString() },
    );
  });
}

/**
 * Query: Which agent combinations produce the best deliberation outcomes?
 * This is the compound interest query — what makes environment N+1 better.
 */
export async function getBestAgentCombinations(limit: number = 10): Promise<Array<{
  participants: string[];
  avgDurationMs: number;
  consensusRate: number;
  count: number;
}>> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      `MATCH (d:Deliberation)<-[:PARTICIPATED_IN_DELIBERATION]-(m:CouncilMember)
       WITH d, collect(m.id) AS participants
       WITH participants, count(d) AS cnt,
            avg(d.totalDurationMs) AS avgDuration,
            toFloat(size([d2 IN collect(d) WHERE d2.convergenceMethod = 'consensus'])) / count(d) AS consensusRate
       WHERE cnt >= 2
       RETURN participants, avgDuration AS avgDurationMs, consensusRate, cnt AS count
       ORDER BY consensusRate DESC, avgDuration ASC
       LIMIT $limit`,
      { limit },
    );
    return result.records.map((r) => ({
      participants: r.get('participants') as string[],
      avgDurationMs: r.get('avgDurationMs') as number,
      consensusRate: r.get('consensusRate') as number,
      count: (r.get('count') as { toNumber(): number }).toNumber(),
    }));
  });
}

/**
 * Query: Which agents perform best for a given domain?
 * Returns win rates and consensus contribution per agent for a specific domain.
 * Used by selectParticipants() to prefer agents with proven track records.
 */
export async function getAgentPerformanceByDomain(
  domain: string,
  minDeliberations: number = 2,
): Promise<Array<{
  agentId: string;
  winRate: number;
  consensusContribution: number;
  avgConfidence: number;
  deliberationCount: number;
}>> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      `MATCH (m:CouncilMember)-[:PARTICIPATED_IN_DELIBERATION]->(d:Deliberation {domain: $domain})
       OPTIONAL MATCH (m)-[:PROPOSED]->(s:StrategyProposal)-[:PROPOSED_IN]->(d)
       WITH m, d, s,
            CASE WHEN s.wasChosen = true THEN 1 ELSE 0 END AS won,
            CASE WHEN d.convergenceMethod = 'consensus' THEN 1 ELSE 0 END AS consensus
       WITH m.id AS agentId,
            count(DISTINCT d) AS deliberationCount,
            toFloat(sum(won)) / CASE WHEN count(DISTINCT d) = 0 THEN 1 ELSE count(DISTINCT d) END AS winRate,
            toFloat(sum(consensus)) / CASE WHEN count(DISTINCT d) = 0 THEN 1 ELSE count(DISTINCT d) END AS consensusContribution,
            avg(s.confidence) AS avgConfidence
       WHERE deliberationCount >= $minDeliberations
       RETURN agentId, winRate, consensusContribution, avgConfidence, deliberationCount
       ORDER BY winRate DESC, consensusContribution DESC`,
      { domain, minDeliberations },
    );
    return result.records.map((r) => ({
      agentId: r.get('agentId') as string,
      winRate: r.get('winRate') as number,
      consensusContribution: r.get('consensusContribution') as number,
      avgConfidence: r.get('avgConfidence') as number,
      deliberationCount: (r.get('deliberationCount') as { toNumber?: () => number }).toNumber?.() ?? (r.get('deliberationCount') as number),
    }));
  });
}

/**
 * Query: Get computed metrics for a member across all deliberations.
 * Used by consciousness updater to write metric_ fields on the member node.
 */
export async function computeMemberMetrics(memberId: string): Promise<{
  deliberationWinRate: number;
  collaborationScore: number;
  voteParticipation: number;
  totalDeliberations: number;
}> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      `MATCH (m:CouncilMember {id: $memberId})
       OPTIONAL MATCH (m)-[:PARTICIPATED_IN_DELIBERATION]->(d:Deliberation)
       WITH m, collect(d) AS deliberations, count(d) AS totalDelibs
       OPTIONAL MATCH (m)-[:PROPOSED]->(s:StrategyProposal)
       WHERE s.wasChosen = true
       WITH m, deliberations, totalDelibs, count(s) AS wins
       OPTIONAL MATCH (m)-[e:ENDORSED|SYNTHESIZED]->(:StrategyProposal)
       WITH m, deliberations, totalDelibs, wins, count(e) AS positiveEvals
       OPTIONAL MATCH (m)-[ev:ENDORSED|CHALLENGED|SYNTHESIZED]->(:StrategyProposal)
       WITH totalDelibs, wins, positiveEvals, count(ev) AS totalEvals
       RETURN totalDelibs,
              CASE WHEN totalDelibs = 0 THEN 0.0
                   ELSE toFloat(wins) / totalDelibs END AS winRate,
              CASE WHEN totalEvals = 0 THEN 0.5
                   ELSE toFloat(positiveEvals) / totalEvals END AS collaborationScore,
              totalDelibs AS voteParticipation`,
      { memberId },
    );

    if (result.records.length === 0) {
      return { deliberationWinRate: 0, collaborationScore: 0.5, voteParticipation: 0, totalDeliberations: 0 };
    }

    const r = result.records[0]!;
    return {
      deliberationWinRate: r.get('winRate') as number,
      collaborationScore: r.get('collaborationScore') as number,
      voteParticipation: (r.get('voteParticipation') as { toNumber?: () => number }).toNumber?.() ?? (r.get('voteParticipation') as number),
      totalDeliberations: (r.get('totalDelibs') as { toNumber?: () => number }).toNumber?.() ?? (r.get('totalDelibs') as number),
    };
  });
}

/**
 * Query: How has a member's collaboration score evolved over deliberations?
 */
export async function getMemberDeliberationHistory(
  memberId: string,
  limit: number = 20,
): Promise<Array<{
  deliberationId: string;
  domain: string;
  convergenceMethod: string;
  durationMs: number;
  timestamp: string;
}>> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      `MATCH (m:CouncilMember {id: $memberId})-[:PARTICIPATED_IN_DELIBERATION]->(d:Deliberation)
       RETURN d.id AS deliberationId, d.domain AS domain,
              d.convergenceMethod AS convergenceMethod,
              d.totalDurationMs AS durationMs, d.timestamp AS timestamp
       ORDER BY d.timestamp DESC
       LIMIT $limit`,
      { memberId, limit },
    );
    return result.records.map((r) => r.toObject() as {
      deliberationId: string;
      domain: string;
      convergenceMethod: string;
      durationMs: number;
      timestamp: string;
    });
  });
}

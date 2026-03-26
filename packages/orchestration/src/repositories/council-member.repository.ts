/**
 * Council member repository — Neo4j CRUD operations.
 * Matches TheFulcrum pattern: api/repositories/personRepository.ts
 *
 * - MERGE for upserts (idempotent)
 * - Partial updates via dynamic SET clauses
 * - executeRead/executeWrite for session management
 * - JSON stringification for complex properties
 */

import { executeRead, executeWrite } from '@/services/graph/neo4j.service';
import type { ManagedTransaction } from 'neo4j-driver';
import type { CouncilMemberNode, CouncilMemberNodeUpdate } from './types';

/**
 * Upsert a council member node.
 * Uses MERGE — safe to call multiple times (idempotent).
 */
export async function upsertCouncilMember(member: CouncilMemberNode): Promise<void> {
  await executeWrite(async (tx: ManagedTransaction) => {
    await tx.run(
      `MERGE (m:CouncilMember {id: $id})
       SET m.name = $name,
           m.role = $role,
           m.agentType = $agentType,
           m.isHuman = $isHuman,
           m.isUser = $isUser,
           m.modelId = $modelId,
           m.provider = $provider,
           m.status = $status,
           m.specializations = $specializations,
           m.description = $description,
           m.primaryColor = $primaryColor,
           m.createdAt = $createdAt,
           m.updatedAt = $updatedAt,
           m.lastInteraction = $lastInteraction,
           m.trait_openness = $trait_openness,
           m.trait_conscientiousness = $trait_conscientiousness,
           m.trait_extraversion = $trait_extraversion,
           m.trait_agreeableness = $trait_agreeableness,
           m.trait_neuroticism = $trait_neuroticism,
           m.trait_ethicalRigidity = $trait_ethicalRigidity,
           m.trait_decisionConfidence = $trait_decisionConfidence,
           m.trait_collaborationPreference = $trait_collaborationPreference,
           m.trait_innovationTendency = $trait_innovationTendency,
           m.trait_trustInCouncil = $trait_trustInCouncil,
           m.trait_learningRate = $trait_learningRate,
           m.emotion_joy = $emotion_joy,
           m.emotion_curiosity = $emotion_curiosity,
           m.emotion_frustration = $emotion_frustration,
           m.emotion_satisfaction = $emotion_satisfaction,
           m.emotion_ethicalConcern = $emotion_ethicalConcern,
           m.emotion_decisionAnxiety = $emotion_decisionAnxiety,
           m.emotion_missionAlignment = $emotion_missionAlignment,
           m.emotion_dominant = $emotion_dominant,
           m.emotion_trend = $emotion_trend,
           m.param_temperature = $param_temperature,
           m.param_topP = $param_topP,
           m.param_maxTokens = $param_maxTokens,
           m.param_ethicalThreshold = $param_ethicalThreshold,
           m.param_constitutionalWeight = $param_constitutionalWeight,
           m.metric_constitutionalAlignment = $metric_constitutionalAlignment,
           m.metric_ethicalDecisionCount = $metric_ethicalDecisionCount,
           m.metric_voteParticipation = $metric_voteParticipation,
           m.metric_collaborationScore = $metric_collaborationScore,
           m.metric_wisdomScore = $metric_wisdomScore,
           m.metric_deliberationWinRate = $metric_deliberationWinRate`,
      member,
    );
  });
}

/**
 * Partial update — only sets provided fields.
 * Matches TheFulcrum's dynamic SET clause pattern.
 */
export async function updateCouncilMember(
  memberId: string,
  update: CouncilMemberNodeUpdate,
): Promise<void> {
  const setClauses: string[] = [];
  const params: Record<string, unknown> = { id: memberId };

  for (const [key, value] of Object.entries(update)) {
    if (value !== undefined) {
      setClauses.push(`m.${key} = $${key}`);
      params[key] = value;
    }
  }

  if (setClauses.length === 0) return;

  // Always update updatedAt
  setClauses.push('m.updatedAt = $updatedAt');
  params['updatedAt'] = new Date().toISOString();

  await executeWrite(async (tx: ManagedTransaction) => {
    await tx.run(
      `MATCH (m:CouncilMember {id: $id})
       SET ${setClauses.join(', ')}`,
      params,
    );
  });
}

/**
 * Get a single council member by ID with all properties.
 */
export async function getCouncilMember(memberId: string): Promise<CouncilMemberNode | null> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      'MATCH (m:CouncilMember {id: $id}) RETURN m',
      { id: memberId },
    );
    if (result.records.length === 0) return null;
    return result.records[0]!.get('m').properties as CouncilMemberNode;
  });
}

/**
 * Get all council members.
 */
export async function getAllCouncilMembers(): Promise<CouncilMemberNode[]> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      'MATCH (m:CouncilMember) RETURN m ORDER BY m.isHuman DESC, m.name ASC',
    );
    return result.records.map((r) => r.get('m').properties as CouncilMemberNode);
  });
}

/**
 * Get members by agent type — used by deliberation engine for participant selection.
 */
export async function getCouncilMembersByType(agentType: string): Promise<CouncilMemberNode[]> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      `MATCH (m:CouncilMember {agentType: $agentType})
       WHERE m.status <> 'error' AND m.status <> 'maintenance'
       RETURN m`,
      { agentType },
    );
    return result.records.map((r) => r.get('m').properties as CouncilMemberNode);
  });
}

/**
 * Load full consciousness state for deliberation — member + trust relationships.
 */
export async function loadConsciousnessState(memberId: string): Promise<{
  member: CouncilMemberNode;
  trustRelationships: Array<{ otherId: string; score: number }>;
  recentLearnings: Array<{ knowledge: string; quality: number }>;
} | null> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run(
      `MATCH (m:CouncilMember {id: $memberId})
       OPTIONAL MATCH (m)-[t:TRUSTS]->(other:CouncilMember)
       WITH m, collect(CASE WHEN other IS NOT NULL THEN {otherId: other.id, score: t.score} ELSE NULL END) AS rawTrust
       OPTIONAL MATCH (m)-[l:LEARNED]->(le:LearningExperience)
       WHERE l.supersededAt IS NULL
       WITH m, rawTrust, collect({knowledge: le.knowledgeGained, quality: le.decisionQuality}) AS learnings
       RETURN m,
              [t IN rawTrust WHERE t IS NOT NULL] AS trustRelationships,
              learnings[0..10] AS recentLearnings`,
      { memberId },
    );

    if (result.records.length === 0) return null;
    const record = result.records[0]!;
    return {
      member: record.get('m').properties as CouncilMemberNode,
      trustRelationships: record.get('trustRelationships') as Array<{ otherId: string; score: number }>,
      recentLearnings: record.get('recentLearnings') as Array<{ knowledge: string; quality: number }>,
    };
  });
}

/**
 * Count all council members — used for migration verification.
 * Matches TheFulcrum verification pattern.
 */
export async function countCouncilMembers(): Promise<number> {
  return executeRead(async (tx: ManagedTransaction) => {
    const result = await tx.run('MATCH (m:CouncilMember) RETURN count(m) AS count');
    return (result.records[0]!.get('count') as { toNumber(): number }).toNumber();
  });
}

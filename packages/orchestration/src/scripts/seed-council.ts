/**
 * Seed all 26 council members + relationships into Neo4j.
 *
 * Run: npm run seed:council
 *
 * Uses the canonical seed data from @roundtable/graph.
 * Idempotent — uses MERGE to avoid duplicates.
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import { AI_COUNCIL_MEMBERS, HUMAN_COUNCIL_MEMBERS, INITIAL_RELATIONSHIPS } from '@roundtable/graph';
import type { CouncilMemberSeed } from '@roundtable/graph';

dotenv.config();

async function seedMember(
  session: neo4j.Session,
  member: CouncilMemberSeed,
): Promise<void> {
  await session.run(
    `MERGE (m:CouncilMember {id: $id})
     SET m.name = $name,
         m.role = $role,
         m.agentType = $agentType,
         m.isHuman = $isHuman,
         m.isUser = $isUser,
         m.modelId = $modelId,
         m.provider = $provider,
         m.specializations = $specializations,
         m.description = $description,
         m.primaryColor = $primaryColor,
         m.status = 'active',
         m.trait_openness = $openness,
         m.trait_conscientiousness = $conscientiousness,
         m.trait_extraversion = $extraversion,
         m.trait_agreeableness = $agreeableness,
         m.trait_neuroticism = $neuroticism,
         m.trait_ethicalRigidity = $ethicalRigidity,
         m.trait_decisionConfidence = $decisionConfidence,
         m.trait_collaborationPreference = $collaborationPreference,
         m.trait_innovationTendency = $innovationTendency,
         m.trait_trustInCouncil = $trustInCouncil,
         m.trait_learningRate = $learningRate,
         m.emotion_joy = $joy,
         m.emotion_curiosity = $curiosity,
         m.emotion_frustration = $frustration,
         m.emotion_satisfaction = $satisfaction,
         m.emotion_ethicalConcern = $ethicalConcern,
         m.emotion_decisionAnxiety = $decisionAnxiety,
         m.emotion_missionAlignment = $missionAlignment,
         m.emotion_dominant = $dominantEmotion,
         m.emotion_trend = $emotionalTrend,
         m.param_temperature = $temperature,
         m.param_topP = $topP,
         m.param_maxTokens = $maxTokens,
         m.param_ethicalThreshold = $ethicalThreshold,
         m.param_constitutionalWeight = $constitutionalWeight,
         m.createdAt = datetime(),
         m.lastInteraction = datetime()`,
    {
      id: member.id,
      name: member.name,
      role: member.role,
      agentType: member.agentType,
      isHuman: member.isHuman,
      isUser: member.isUser,
      modelId: member.modelId,
      provider: member.provider,
      specializations: member.specializations,
      description: member.description,
      primaryColor: member.primaryColor,
      ...member.personality,
      ...member.emotionalBaseline,
      ...member.modelParams,
    },
  );
}

async function main(): Promise<void> {
  const uri = process.env['NEO4J_URI'];
  const user = process.env['NEO4J_USER'];
  const password = process.env['NEO4J_PASSWORD'];
  const database = process.env['NEO4J_DATABASE'] ?? 'neo4j';

  if (!uri || !user || !password) {
    console.error('Missing required env vars: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    const serverInfo = await driver.getServerInfo();
    console.log(`Connected to Neo4j: ${serverInfo.address}`);
    console.log(`Database: ${database}\n`);

    const allMembers = [...AI_COUNCIL_MEMBERS, ...HUMAN_COUNCIL_MEMBERS];

    // --- Seed members ---
    console.log(`=== Seeding ${allMembers.length} Council Members ===`);
    for (const member of allMembers) {
      const session = driver.session({ database });
      try {
        await seedMember(session, member);
        const label = member.isHuman ? 'human' : `AI:${member.provider}/${member.modelId}`;
        console.log(`  ${member.name} (${member.agentType}) [${label}]`);
      } catch (error) {
        console.error(`  FAIL: ${member.name}`, error);
      } finally {
        await session.close();
      }
    }

    // --- Seed relationships ---
    console.log(`\n=== Seeding ${INITIAL_RELATIONSHIPS.length} Relationships ===`);
    let relCount = 0;
    for (const rel of INITIAL_RELATIONSHIPS) {
      const session = driver.session({ database });
      try {
        if (rel.type === 'TRUSTS') {
          await session.run(
            `MATCH (a:CouncilMember {id: $from}), (b:CouncilMember {id: $to})
             MERGE (a)-[r:TRUSTS]->(b)
             SET r.score = $score, r.interactions = 0, r.positiveInteractions = 0,
                 r.negativeInteractions = 0, r.lastUpdated = datetime()
             MERGE (b)-[r2:TRUSTS]->(a)
             SET r2.score = $score, r2.interactions = 0, r2.positiveInteractions = 0,
                 r2.negativeInteractions = 0, r2.lastUpdated = datetime()`,
            { from: rel.from, to: rel.to, score: rel.score },
          );
        } else if (rel.type === 'COLLABORATES_WITH') {
          await session.run(
            `MATCH (a:CouncilMember {id: $from}), (b:CouncilMember {id: $to})
             MERGE (a)-[r:COLLABORATES_WITH]->(b)
             SET r.score = $score, r.interactions = 0, r.successRate = $score,
                 r.lastUpdated = datetime()`,
            { from: rel.from, to: rel.to, score: rel.score },
          );
        }
        relCount++;
      } catch (error) {
        console.error(`  FAIL: ${rel.from} -[${rel.type}]-> ${rel.to}`, error);
      } finally {
        await session.close();
      }
    }
    console.log(`  Seeded ${relCount} relationships`);

    // --- Verify ---
    console.log('\n=== Verification ===');
    const session = driver.session({ database });
    try {
      const memberCount = await session.run('MATCH (m:CouncilMember) RETURN count(m) as count');
      console.log(`  Council members: ${memberCount.records[0]?.get('count')}`);

      const trustCount = await session.run('MATCH ()-[t:TRUSTS]->() RETURN count(t) as count');
      console.log(`  Trust relationships: ${trustCount.records[0]?.get('count')}`);

      const collabCount = await session.run('MATCH ()-[c:COLLABORATES_WITH]->() RETURN count(c) as count');
      console.log(`  Collaboration relationships: ${collabCount.records[0]?.get('count')}`);

      const aiCount = await session.run('MATCH (m:CouncilMember {isHuman: false}) RETURN count(m) as count');
      console.log(`  AI members: ${aiCount.records[0]?.get('count')}`);

      const humanCount = await session.run('MATCH (m:CouncilMember {isHuman: true}) RETURN count(m) as count');
      console.log(`  Human members: ${humanCount.records[0]?.get('count')}`);
    } finally {
      await session.close();
    }

    console.log('\nCouncil seeding complete.');
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error('Council seeding failed:', error);
  process.exit(1);
});

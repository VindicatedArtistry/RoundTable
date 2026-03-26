/**
 * Seed Neo4j with all 26 council members + relationships.
 * Run: node scripts/seed-neo4j.js
 */

const neo4j = require(require.resolve('neo4j-driver', { paths: [__dirname + '/../node_modules'] }));
const { AI_COUNCIL_MEMBERS, HUMAN_COUNCIL_MEMBERS, INITIAL_RELATIONSHIPS } = require('../packages/graph/src/seed/council-members.ts');

const URI = process.env.NEO4J_URI || 'bolt://35.239.53.217:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASS = process.env.NEO4J_PASSWORD || 'password';
const DB = process.env.NEO4J_DATABASE || 'neo4j';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));
const allMembers = [...AI_COUNCIL_MEMBERS, ...HUMAN_COUNCIL_MEMBERS];

async function seedMembers() {
  console.log(`=== Seeding ${allMembers.length} Council Members ===`);
  for (const m of allMembers) {
    const session = driver.session({ database: DB });
    try {
      await session.run(
        `MERGE (m:CouncilMember {id: $id})
         SET m.name = $name, m.role = $role, m.agentType = $agentType,
             m.isHuman = $isHuman, m.isUser = $isUser, m.modelId = $modelId,
             m.provider = $provider, m.specializations = $specializations,
             m.description = $description, m.primaryColor = $primaryColor,
             m.status = 'active',
             m.trait_openness = $openness, m.trait_conscientiousness = $conscientiousness,
             m.trait_extraversion = $extraversion, m.trait_agreeableness = $agreeableness,
             m.trait_neuroticism = $neuroticism, m.trait_ethicalRigidity = $ethicalRigidity,
             m.trait_decisionConfidence = $decisionConfidence,
             m.trait_collaborationPreference = $collaborationPreference,
             m.trait_innovationTendency = $innovationTendency,
             m.trait_trustInCouncil = $trustInCouncil, m.trait_learningRate = $learningRate,
             m.emotion_joy = $joy, m.emotion_curiosity = $curiosity,
             m.emotion_frustration = $frustration, m.emotion_satisfaction = $satisfaction,
             m.emotion_ethicalConcern = $ethicalConcern, m.emotion_decisionAnxiety = $decisionAnxiety,
             m.emotion_missionAlignment = $missionAlignment, m.emotion_dominant = $dominantEmotion,
             m.emotion_trend = $emotionalTrend,
             m.param_temperature = $temperature, m.param_topP = $topP,
             m.param_maxTokens = $maxTokens, m.param_ethicalThreshold = $ethicalThreshold,
             m.param_constitutionalWeight = $constitutionalWeight,
             m.metric_deliberationWinRate = 0.0, m.metric_collaborationScore = 0.5,
             m.metric_voteParticipation = 0, m.metric_wisdomScore = 0.5,
             m.metric_constitutionalAlignment = 0.8, m.metric_ethicalDecisionCount = 0,
             m.createdAt = datetime(), m.lastInteraction = datetime()`,
        {
          id: m.id, name: m.name, role: m.role, agentType: m.agentType,
          isHuman: m.isHuman, isUser: m.isUser, modelId: m.modelId,
          provider: m.provider, specializations: m.specializations,
          description: m.description, primaryColor: m.primaryColor,
          ...m.personality, ...m.emotionalBaseline,
          temperature: m.modelParams?.temperature ?? 0.7,
          topP: m.modelParams?.topP ?? 0.9,
          maxTokens: m.modelParams?.maxTokens ?? 4096,
          ethicalThreshold: m.modelParams?.ethicalThreshold ?? 0.5,
          constitutionalWeight: m.modelParams?.constitutionalWeight ?? 0.5,
        }
      );
      const label = m.isHuman ? 'human' : `${m.provider}/${m.modelId}`;
      console.log(`  ${m.name} (${m.agentType}) [${label}]`);
    } catch (e) {
      console.error(`  FAIL: ${m.name} — ${e.message}`);
    } finally {
      await session.close();
    }
  }
}

async function seedRelationships() {
  console.log(`\n=== Seeding ${INITIAL_RELATIONSHIPS.length} Relationships ===`);
  let count = 0;
  for (const rel of INITIAL_RELATIONSHIPS) {
    const session = driver.session({ database: DB });
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
          { from: rel.from, to: rel.to, score: rel.score }
        );
      } else if (rel.type === 'COLLABORATES_WITH') {
        await session.run(
          `MATCH (a:CouncilMember {id: $from}), (b:CouncilMember {id: $to})
           MERGE (a)-[r:COLLABORATES_WITH]->(b)
           SET r.score = $score, r.interactions = 0, r.successRate = $score, r.lastUpdated = datetime()`,
          { from: rel.from, to: rel.to, score: rel.score }
        );
      }
      count++;
    } catch (e) {
      console.error(`  FAIL: ${rel.from} -[${rel.type}]-> ${rel.to} — ${e.message}`);
    } finally {
      await session.close();
    }
  }
  console.log(`  Seeded ${count} relationships`);
}

async function verify() {
  console.log('\n=== Verification ===');
  const session = driver.session({ database: DB });
  const toNum = v => typeof v.toNumber === 'function' ? v.toNumber() : v;

  const mc = await session.run('MATCH (m:CouncilMember) RETURN count(m) AS cnt');
  const ai = await session.run('MATCH (m:CouncilMember {isHuman: false}) RETURN count(m) AS cnt');
  const hu = await session.run('MATCH (m:CouncilMember {isHuman: true}) RETURN count(m) AS cnt');
  const tc = await session.run('MATCH ()-[t:TRUSTS]->() RETURN count(t) AS cnt');
  const cc = await session.run('MATCH ()-[c:COLLABORATES_WITH]->() RETURN count(c) AS cnt');

  console.log(`  Council members: ${toNum(mc.records[0].get('cnt'))}`);
  console.log(`  AI members: ${toNum(ai.records[0].get('cnt'))}`);
  console.log(`  Human members: ${toNum(hu.records[0].get('cnt'))}`);
  console.log(`  Trust relationships: ${toNum(tc.records[0].get('cnt'))}`);
  console.log(`  Collaboration relationships: ${toNum(cc.records[0].get('cnt'))}`);

  await session.close();
}

(async () => {
  try {
    const info = await driver.getServerInfo();
    console.log(`Connected to Neo4j: ${info.address}\n`);

    await seedMembers();
    await seedRelationships();
    await verify();

    console.log('\nCouncil seeding complete.');
  } catch (e) {
    console.error('Fatal error:', e.message);
  } finally {
    await driver.close();
  }
})();

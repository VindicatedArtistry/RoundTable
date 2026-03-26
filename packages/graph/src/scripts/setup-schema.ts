/**
 * Neo4j schema setup script — creates all constraints and indexes.
 * Matches TheFulcrum pattern: scripts/setup-neo4j-schema.ts
 *
 * Run: npx ts-node packages/graph/src/scripts/setup-schema.ts
 *
 * Idempotent — safe to re-run. Uses IF NOT EXISTS on all operations.
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

interface SchemaOperation {
  phase: string;
  description: string;
  cypher: string;
}

const CONSTRAINTS: SchemaOperation[] = [
  // --- Phase 1: Core Entities ---
  { phase: '1', description: 'CouncilMember.id unique', cypher: 'CREATE CONSTRAINT council_member_id_unique IF NOT EXISTS FOR (m:CouncilMember) REQUIRE m.id IS UNIQUE' },
  { phase: '1', description: 'Conversation.id unique', cypher: 'CREATE CONSTRAINT conversation_id_unique IF NOT EXISTS FOR (c:Conversation) REQUIRE c.id IS UNIQUE' },
  { phase: '1', description: 'Message.id unique', cypher: 'CREATE CONSTRAINT message_id_unique IF NOT EXISTS FOR (m:Message) REQUIRE m.id IS UNIQUE' },

  // --- Phase 2: Learning & Consciousness ---
  { phase: '2', description: 'LearningExperience.id unique', cypher: 'CREATE CONSTRAINT learning_experience_id_unique IF NOT EXISTS FOR (l:LearningExperience) REQUIRE l.id IS UNIQUE' },
  { phase: '2', description: 'ConsciousnessUpdate.id unique', cypher: 'CREATE CONSTRAINT consciousness_update_id_unique IF NOT EXISTS FOR (u:ConsciousnessUpdate) REQUIRE u.id IS UNIQUE' },

  // --- Phase 3: Deliberation ---
  { phase: '3', description: 'Deliberation.id unique', cypher: 'CREATE CONSTRAINT deliberation_id_unique IF NOT EXISTS FOR (d:Deliberation) REQUIRE d.id IS UNIQUE' },
  { phase: '3', description: 'StrategyProposal.id unique', cypher: 'CREATE CONSTRAINT strategy_proposal_id_unique IF NOT EXISTS FOR (s:StrategyProposal) REQUIRE s.id IS UNIQUE' },

  // --- Phase 7: ARC-AGI-3 ---
  { phase: '7', description: 'EnvironmentSession.id unique', cypher: 'CREATE CONSTRAINT environment_session_id_unique IF NOT EXISTS FOR (e:EnvironmentSession) REQUIRE e.id IS UNIQUE' },
];

const INDEXES: SchemaOperation[] = [
  // --- CouncilMember ---
  { phase: '1', description: 'CouncilMember.agentType index', cypher: 'CREATE INDEX council_member_agentType IF NOT EXISTS FOR (m:CouncilMember) ON (m.agentType)' },
  { phase: '1', description: 'CouncilMember.status index', cypher: 'CREATE INDEX council_member_status IF NOT EXISTS FOR (m:CouncilMember) ON (m.status)' },
  { phase: '1', description: 'CouncilMember.isHuman index', cypher: 'CREATE INDEX council_member_isHuman IF NOT EXISTS FOR (m:CouncilMember) ON (m.isHuman)' },
  { phase: '1', description: 'CouncilMember.provider index', cypher: 'CREATE INDEX council_member_provider IF NOT EXISTS FOR (m:CouncilMember) ON (m.provider)' },

  // --- Conversation ---
  { phase: '1', description: 'Conversation.conversationType index', cypher: 'CREATE INDEX conversation_type IF NOT EXISTS FOR (c:Conversation) ON (c.conversationType)' },
  { phase: '1', description: 'Conversation.createdAt index', cypher: 'CREATE INDEX conversation_createdAt IF NOT EXISTS FOR (c:Conversation) ON (c.createdAt)' },

  // --- Message ---
  { phase: '1', description: 'Message.timestamp index', cypher: 'CREATE INDEX message_timestamp IF NOT EXISTS FOR (m:Message) ON (m.timestamp)' },
  { phase: '1', description: 'Message.messageType index', cypher: 'CREATE INDEX message_messageType IF NOT EXISTS FOR (m:Message) ON (m.messageType)' },

  // --- Learning ---
  { phase: '2', description: 'LearningExperience.timestamp index', cypher: 'CREATE INDEX learning_timestamp IF NOT EXISTS FOR (l:LearningExperience) ON (l.timestamp)' },
  { phase: '2', description: 'LearningExperience.decisionQuality index', cypher: 'CREATE INDEX learning_quality IF NOT EXISTS FOR (l:LearningExperience) ON (l.decisionQuality)' },

  // --- Deliberation ---
  { phase: '3', description: 'Deliberation.domain index', cypher: 'CREATE INDEX deliberation_domain IF NOT EXISTS FOR (d:Deliberation) ON (d.domain)' },
  { phase: '3', description: 'Deliberation.convergenceMethod index', cypher: 'CREATE INDEX deliberation_convergence IF NOT EXISTS FOR (d:Deliberation) ON (d.convergenceMethod)' },
  { phase: '3', description: 'Deliberation.timestamp index', cypher: 'CREATE INDEX deliberation_timestamp IF NOT EXISTS FOR (d:Deliberation) ON (d.timestamp)' },

  // --- StrategyProposal ---
  { phase: '3', description: 'StrategyProposal.round index', cypher: 'CREATE INDEX proposal_round IF NOT EXISTS FOR (s:StrategyProposal) ON (s.round)' },
  { phase: '3', description: 'StrategyProposal.wasChosen index', cypher: 'CREATE INDEX proposal_wasChosen IF NOT EXISTS FOR (s:StrategyProposal) ON (s.wasChosen)' },

  // --- Relationship indexes ---
  { phase: '1', description: 'TRUSTS.score relationship index', cypher: 'CREATE INDEX trusts_score IF NOT EXISTS FOR ()-[t:TRUSTS]-() ON (t.score)' },
  { phase: '1', description: 'COLLABORATES_WITH.successRate index', cypher: 'CREATE INDEX collab_successRate IF NOT EXISTS FOR ()-[c:COLLABORATES_WITH]-() ON (c.successRate)' },
  { phase: '2', description: 'LEARNED.supersededAt index', cypher: 'CREATE INDEX learned_superseded IF NOT EXISTS FOR ()-[l:LEARNED]-() ON (l.supersededAt)' },
  { phase: '2', description: 'LEARNED.version index', cypher: 'CREATE INDEX learned_version IF NOT EXISTS FOR ()-[l:LEARNED]-() ON (l.version)' },

  // --- EnvironmentSession ---
  { phase: '7', description: 'EnvironmentSession.environmentId index', cypher: 'CREATE INDEX env_session_envId IF NOT EXISTS FOR (e:EnvironmentSession) ON (e.environmentId)' },
  { phase: '7', description: 'EnvironmentSession.status index', cypher: 'CREATE INDEX env_session_status IF NOT EXISTS FOR (e:EnvironmentSession) ON (e.status)' },
  { phase: '7', description: 'EnvironmentSession.efficiencyScore index', cypher: 'CREATE INDEX env_session_efficiency IF NOT EXISTS FOR (e:EnvironmentSession) ON (e.efficiencyScore)' },

  // --- Full-text search ---
  { phase: '1', description: 'Message content fulltext', cypher: 'CREATE FULLTEXT INDEX message_content IF NOT EXISTS FOR (m:Message) ON EACH [m.content]' },
  { phase: '3', description: 'StrategyProposal strategy fulltext', cypher: 'CREATE FULLTEXT INDEX proposal_strategy IF NOT EXISTS FOR (s:StrategyProposal) ON EACH [s.strategy, s.reasoning]' },
];

async function main(): Promise<void> {
  const uri = process.env['NEO4J_URI'];
  const user = process.env['NEO4J_USER'];
  const password = process.env['NEO4J_PASSWORD'];

  if (!uri || !user || !password) {
    console.error('Missing NEO4J_URI, NEO4J_USER, or NEO4J_PASSWORD');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    const serverInfo = await driver.getServerInfo();
    console.log(`Connected to Neo4j: ${serverInfo.address}\n`);

    // --- Constraints ---
    console.log('=== Creating Constraints ===');
    for (const constraint of CONSTRAINTS) {
      const session = driver.session({ database: 'neo4j' });
      try {
        await session.run(constraint.cypher);
        console.log(`  [Phase ${constraint.phase}] ✓ ${constraint.description}`);
      } catch (error) {
        console.error(`  [Phase ${constraint.phase}] ✗ ${constraint.description}:`, error);
      } finally {
        await session.close();
      }
    }

    // --- Indexes ---
    console.log('\n=== Creating Indexes ===');
    for (const index of INDEXES) {
      const session = driver.session({ database: 'neo4j' });
      try {
        await session.run(index.cypher);
        console.log(`  [Phase ${index.phase}] ✓ ${index.description}`);
      } catch (error) {
        console.error(`  [Phase ${index.phase}] ✗ ${index.description}:`, error);
      } finally {
        await session.close();
      }
    }

    // --- Verification ---
    console.log('\n=== Verification ===');
    const session = driver.session({ database: 'neo4j' });
    try {
      const constraintResult = await session.run('SHOW CONSTRAINTS');
      console.log(`  Total constraints: ${constraintResult.records.length}`);

      const indexResult = await session.run('SHOW INDEXES');
      console.log(`  Total indexes: ${indexResult.records.length}`);
    } finally {
      await session.close();
    }

    console.log('\nSchema setup complete.');
  } finally {
    await driver.close();
  }
}

main().catch(console.error);

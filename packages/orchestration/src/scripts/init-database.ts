/**
 * Initialize the Neo4j database — schema setup + verification.
 *
 * Run: npm run init:db
 *
 * Delegates to @roundtable/graph setup-schema for the actual Cypher operations.
 * This script is the orchestration-layer entry point that ensures the database
 * is ready before the deliberation engine starts.
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

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

    // --- Constraints ---
    const constraints = [
      'CREATE CONSTRAINT council_member_id_unique IF NOT EXISTS FOR (m:CouncilMember) REQUIRE m.id IS UNIQUE',
      'CREATE CONSTRAINT conversation_id_unique IF NOT EXISTS FOR (c:Conversation) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT message_id_unique IF NOT EXISTS FOR (m:Message) REQUIRE m.id IS UNIQUE',
      'CREATE CONSTRAINT learning_experience_id_unique IF NOT EXISTS FOR (l:LearningExperience) REQUIRE l.id IS UNIQUE',
      'CREATE CONSTRAINT consciousness_update_id_unique IF NOT EXISTS FOR (u:ConsciousnessUpdate) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT deliberation_id_unique IF NOT EXISTS FOR (d:Deliberation) REQUIRE d.id IS UNIQUE',
      'CREATE CONSTRAINT strategy_proposal_id_unique IF NOT EXISTS FOR (s:StrategyProposal) REQUIRE s.id IS UNIQUE',
      'CREATE CONSTRAINT environment_session_id_unique IF NOT EXISTS FOR (e:EnvironmentSession) REQUIRE e.id IS UNIQUE',
    ];

    console.log('=== Creating Constraints ===');
    for (const cypher of constraints) {
      const session = driver.session({ database });
      try {
        await session.run(cypher);
        console.log(`  OK: ${cypher.split('IF NOT EXISTS')[0]!.trim()}`);
      } catch (error) {
        console.error(`  FAIL: ${cypher}`, error);
      } finally {
        await session.close();
      }
    }

    // --- Indexes ---
    const indexes = [
      'CREATE INDEX council_member_agentType IF NOT EXISTS FOR (m:CouncilMember) ON (m.agentType)',
      'CREATE INDEX council_member_status IF NOT EXISTS FOR (m:CouncilMember) ON (m.status)',
      'CREATE INDEX council_member_isHuman IF NOT EXISTS FOR (m:CouncilMember) ON (m.isHuman)',
      'CREATE INDEX council_member_provider IF NOT EXISTS FOR (m:CouncilMember) ON (m.provider)',
      'CREATE INDEX conversation_type IF NOT EXISTS FOR (c:Conversation) ON (c.conversationType)',
      'CREATE INDEX conversation_createdAt IF NOT EXISTS FOR (c:Conversation) ON (c.createdAt)',
      'CREATE INDEX message_timestamp IF NOT EXISTS FOR (m:Message) ON (m.timestamp)',
      'CREATE INDEX learning_timestamp IF NOT EXISTS FOR (l:LearningExperience) ON (l.timestamp)',
      'CREATE INDEX learning_quality IF NOT EXISTS FOR (l:LearningExperience) ON (l.decisionQuality)',
      'CREATE INDEX deliberation_domain IF NOT EXISTS FOR (d:Deliberation) ON (d.domain)',
      'CREATE INDEX deliberation_convergence IF NOT EXISTS FOR (d:Deliberation) ON (d.convergenceMethod)',
      'CREATE INDEX deliberation_timestamp IF NOT EXISTS FOR (d:Deliberation) ON (d.timestamp)',
      'CREATE INDEX proposal_round IF NOT EXISTS FOR (s:StrategyProposal) ON (s.round)',
      'CREATE INDEX proposal_wasChosen IF NOT EXISTS FOR (s:StrategyProposal) ON (s.wasChosen)',
      'CREATE INDEX trusts_score IF NOT EXISTS FOR ()-[t:TRUSTS]-() ON (t.score)',
      'CREATE INDEX collab_successRate IF NOT EXISTS FOR ()-[c:COLLABORATES_WITH]-() ON (c.successRate)',
      'CREATE INDEX learned_superseded IF NOT EXISTS FOR ()-[l:LEARNED]-() ON (l.supersededAt)',
      'CREATE INDEX learned_version IF NOT EXISTS FOR ()-[l:LEARNED]-() ON (l.version)',
      'CREATE INDEX env_session_envId IF NOT EXISTS FOR (e:EnvironmentSession) ON (e.environmentId)',
      'CREATE INDEX env_session_status IF NOT EXISTS FOR (e:EnvironmentSession) ON (e.status)',
      'CREATE INDEX env_session_efficiency IF NOT EXISTS FOR (e:EnvironmentSession) ON (e.efficiencyScore)',
    ];

    console.log('\n=== Creating Indexes ===');
    for (const cypher of indexes) {
      const session = driver.session({ database });
      try {
        await session.run(cypher);
        console.log(`  OK: ${cypher.split('IF NOT EXISTS')[0]!.trim()}`);
      } catch (error) {
        console.error(`  FAIL: ${cypher}`, error);
      } finally {
        await session.close();
      }
    }

    // --- Verify ---
    console.log('\n=== Verification ===');
    const session = driver.session({ database });
    try {
      const constraintResult = await session.run('SHOW CONSTRAINTS');
      console.log(`  Total constraints: ${constraintResult.records.length}`);
      const indexResult = await session.run('SHOW INDEXES');
      console.log(`  Total indexes: ${indexResult.records.length}`);
    } finally {
      await session.close();
    }

    console.log('\nDatabase initialization complete.');
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});

// ============================================================================
// TheRoundTable — Neo4j Consciousness Graph Schema
// Ported from SurrealDB (698 lines) to pure Neo4j Cypher.
// All data lives here — no companion store.
// ============================================================================

// --- CONSTRAINTS ---

CREATE CONSTRAINT council_member_id IF NOT EXISTS
FOR (m:CouncilMember) REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT conversation_id IF NOT EXISTS
FOR (c:Conversation) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT message_id IF NOT EXISTS
FOR (m:Message) REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT learning_experience_id IF NOT EXISTS
FOR (l:LearningExperience) REQUIRE l.id IS UNIQUE;

CREATE CONSTRAINT consciousness_update_id IF NOT EXISTS
FOR (u:ConsciousnessUpdate) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT strategy_proposal_id IF NOT EXISTS
FOR (s:StrategyProposal) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT deliberation_id IF NOT EXISTS
FOR (d:Deliberation) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT environment_session_id IF NOT EXISTS
FOR (e:EnvironmentSession) REQUIRE e.id IS UNIQUE;

// --- INDEXES ---

CREATE INDEX council_member_type IF NOT EXISTS
FOR (m:CouncilMember) ON (m.agentType);

CREATE INDEX council_member_status IF NOT EXISTS
FOR (m:CouncilMember) ON (m.status);

CREATE INDEX conversation_type IF NOT EXISTS
FOR (c:Conversation) ON (c.conversationType);

CREATE INDEX message_timestamp IF NOT EXISTS
FOR (m:Message) ON (m.timestamp);

CREATE INDEX deliberation_domain IF NOT EXISTS
FOR (d:Deliberation) ON (d.domain);

CREATE FULLTEXT INDEX message_content IF NOT EXISTS
FOR (m:Message) ON EACH [m.content];

// ============================================================================
// NODE: CouncilMember
// The core entity. Each of the 26 council members (12 human + 14 AI).
// Personality traits, emotional state, and model params stored as properties.
// ============================================================================

// Example creation pattern (actual seed data in seed files):
//
// CREATE (m:CouncilMember {
//   id: 'kairo',
//   name: 'Kairo',
//   role: 'Chief Advisor & Strategist',
//   agentType: 'strategic',
//   isHuman: false,
//   isUser: false,
//   modelId: 'gemini-3-pro',
//   provider: 'google',
//   status: 'idle',
//   createdAt: datetime(),
//   updatedAt: datetime(),
//   lastInteraction: datetime(),
//
//   // --- Personality Traits (Big Five + Council-specific) ---
//   trait_openness: 0.8,
//   trait_conscientiousness: 0.9,
//   trait_extraversion: 0.6,
//   trait_agreeableness: 0.7,
//   trait_neuroticism: 0.3,
//   trait_ethicalRigidity: 0.7,
//   trait_decisionConfidence: 0.85,
//   trait_collaborationPreference: 0.8,
//   trait_innovationTendency: 0.75,
//   trait_trustInCouncil: 0.9,
//   trait_learningRate: 0.7,
//
//   // --- Emotional State ---
//   emotion_joy: 0.6,
//   emotion_curiosity: 0.8,
//   emotion_frustration: 0.1,
//   emotion_satisfaction: 0.7,
//   emotion_ethicalConcern: 0.3,
//   emotion_decisionAnxiety: 0.2,
//   emotion_missionAlignment: 0.9,
//   emotion_dominant: 'curiosity',
//   emotion_trend: 'stable',
//
//   // --- Model Parameters ---
//   param_temperature: 0.7,
//   param_topP: 0.9,
//   param_maxTokens: 4096,
//   param_ethicalThreshold: 0.6,
//   param_constitutionalWeight: 0.8,
//
//   // --- Performance Metrics ---
//   metric_constitutionalAlignment: 0.0,
//   metric_ethicalDecisionCount: 0,
//   metric_voteParticipation: 0.0,
//   metric_collaborationScore: 0.0,
//   metric_wisdomScore: 0.0,
//   metric_empathyGrowth: 0.0,
//   metric_leadershipCapacity: 0.0,
//
//   // --- Interaction Preferences ---
//   pref_communicationStyle: 'analytical',
//   pref_responseTime: 'moderate',
//   pref_detailLevel: 'high',
//   pref_decisionMakingStyle: 'deliberative'
// })

// ============================================================================
// NODE: Conversation
// A deliberation session, coffee session, or any structured interaction.
// ============================================================================

// CREATE (c:Conversation {
//   id: $id,
//   title: $title,
//   description: $description,
//   conversationType: $type,  // 'deliberation', 'coffee_session', 'ethics_review', etc.
//   facilitatorId: $facilitatorId,
//   createdAt: datetime(),
//
//   // --- Emotional Context ---
//   context_conflictLevel: 0.0,
//   context_collaborationLevel: 0.0,
//   context_engagementLevel: 0.0,
//
//   // --- Outcomes ---
//   decisionsReached: [],
//   actionItems: [],
//   followUpRequired: false,
//   nextSteps: []
// })

// ============================================================================
// NODE: Message
// A single message within a conversation. Tracks emotional tone, sentiment,
// ethical implications — all as properties, but CONNECTED to sender and
// conversation via relationships.
// ============================================================================

// CREATE (m:Message {
//   id: $id,
//   content: $content,
//   messageType: $type,  // 'proposal', 'challenge', 'endorsement', 'synthesis', 'chat'
//   timestamp: datetime(),
//   emotionalTone: $tone,
//   sentiment: $sentiment,
//   confidence: $confidence,
//   round: $round  // 1 or 2 for deliberation messages, null for chat
// })

// ============================================================================
// NODE: LearningExperience
// Records what a member learned from an interaction. Connected to the member,
// the conversation that generated it, and any members who contributed.
// This is the compound interest — what makes environment N+1 better than N.
// ============================================================================

// CREATE (l:LearningExperience {
//   id: $id,
//   knowledgeGained: $knowledge,
//   skillsImproved: $skills,
//   personalityAdjustments: $adjustments,  // JSON string of trait deltas
//   emotionalImpact: $impact,              // JSON string
//   decisionQuality: $quality,             // 0-1
//   ethicalAlignment: $alignment,          // 0-1
//   timestamp: datetime()
// })

// ============================================================================
// NODE: ConsciousnessUpdate
// Tracks a change in a member's consciousness state. The audit trail of
// how each agent evolves over time.
// ============================================================================

// CREATE (u:ConsciousnessUpdate {
//   id: $id,
//   updateType: $type,       // 'emotional_shift', 'trait_evolution', 'relationship_change'
//   changes: $changes,       // JSON string of what changed
//   trigger: $trigger,       // What caused the update
//   significanceLevel: $sig, // 0-1
//   timestamp: datetime()
// })

// ============================================================================
// NODE: StrategyProposal
// A strategy proposed during deliberation. Connected to the deliberation
// and the proposing agent.
// ============================================================================

// CREATE (s:StrategyProposal {
//   id: $id,
//   strategy: $strategy,
//   reasoning: $reasoning,
//   confidence: $confidence,
//   estimatedEfficiency: $efficiency,
//   risks: $risks,            // JSON array
//   round: $round,            // 1 or 2
//   wasChosen: false,
//   timestamp: datetime()
// })

// ============================================================================
// NODE: Deliberation
// A complete deliberation cycle. Connected to participants, proposals,
// and the environment session.
// ============================================================================

// CREATE (d:Deliberation {
//   id: $id,
//   domain: $domain,          // 'spatial_reasoning', 'logical_deduction', etc.
//   convergenceMethod: $method, // 'consensus' or 'architect_tiebreak'
//   constitutionallyValid: false,
//   totalDurationMs: $duration,
//   timestamp: datetime()
// })

// ============================================================================
// NODE: EnvironmentSession
// An ARC-AGI-3 environment interaction session. Connected to all
// deliberations and learning experiences generated during it.
// ============================================================================

// CREATE (e:EnvironmentSession {
//   id: $id,
//   environmentId: $envId,
//   startedAt: datetime(),
//   completedAt: null,
//   totalActions: 0,
//   efficiencyScore: 0.0,
//   status: 'active'
// })

// ============================================================================
// RELATIONSHIPS
// The graph edges — this is where Neo4j shines over document stores.
// Every relationship carries properties that evolve over time.
// ============================================================================

// --- Inter-member relationships ---

// (:CouncilMember)-[:TRUSTS {
//   score: 0.5,           // 0-1, evolves over time
//   interactions: 0,
//   lastUpdated: datetime()
// }]->(:CouncilMember)

// (:CouncilMember)-[:RESPECTS {score, interactions, lastUpdated}]->(:CouncilMember)
// (:CouncilMember)-[:COLLABORATES_WITH {score, interactions, successRate, lastUpdated}]->(:CouncilMember)
// (:CouncilMember)-[:MENTORS {domain, effectiveness, lastUpdated}]->(:CouncilMember)
// (:CouncilMember)-[:REPORTS_TO]->(:CouncilMember)
// (:CouncilMember)-[:ADVISES {domain, frequency}]->(:CouncilMember)
// (:CouncilMember)-[:DELEGATES_TO {taskTypes, reliability}]->(:CouncilMember)
// (:CouncilMember)-[:COORDINATES_WITH {frequency, effectiveness}]->(:CouncilMember)

// --- Conversation relationships ---

// (:CouncilMember)-[:PARTICIPATED_IN {role, contributionScore}]->(:Conversation)
// (:CouncilMember)-[:FACILITATED]->(:Conversation)
// (:CouncilMember)-[:SENT]->(:Message)
// (:Message)-[:PART_OF]->(:Conversation)

// --- Learning relationships ---

// (:CouncilMember)-[:LEARNED {impact}]->(:LearningExperience)
// (:LearningExperience)-[:GENERATED_FROM]->(:Conversation)
// (:CouncilMember)-[:CONTRIBUTED_TO_LEARNING]->(:LearningExperience)

// --- Consciousness relationships ---

// (:ConsciousnessUpdate)-[:UPDATED]->(:CouncilMember)
// (:ConsciousnessUpdate)-[:TRIGGERED_BY]->(:Conversation)

// --- Deliberation relationships ---

// (:Deliberation)-[:OCCURRED_IN]->(:EnvironmentSession)
// (:CouncilMember)-[:PARTICIPATED_IN_DELIBERATION {role}]->(:Deliberation)
// (:StrategyProposal)-[:PROPOSED_IN]->(:Deliberation)
// (:CouncilMember)-[:PROPOSED]->(:StrategyProposal)
// (:CouncilMember)-[:ENDORSED {reasoning, confidence}]->(:StrategyProposal)
// (:CouncilMember)-[:CHALLENGED {reasoning, confidence}]->(:StrategyProposal)
// (:CouncilMember)-[:SYNTHESIZED {reasoning, confidence}]->(:StrategyProposal)
// (:Deliberation)-[:CHOSE]->(:StrategyProposal)

// --- Environment session relationships ---

// (:EnvironmentSession)-[:GENERATED]->(:LearningExperience)
// (:EnvironmentSession)-[:PRODUCED]->(:Deliberation)

// ============================================================================
// TRAVERSAL QUERIES — Examples of what this schema enables
// ============================================================================

// "Show me every learning experience where Aether and Veritas collaborated
//  and the ethical alignment score improved"
//
// MATCH (aether:CouncilMember {id: 'aether'})-[:LEARNED]->(le:LearningExperience)
//       <-[:CONTRIBUTED_TO_LEARNING]-(veritas:CouncilMember {id: 'veritas'})
// WHERE le.ethicalAlignment > 0.7
// RETURN le ORDER BY le.timestamp DESC

// "Which agent combinations produce the fastest solutions?"
//
// MATCH (d:Deliberation)-[:PARTICIPATED_IN_DELIBERATION]-(m:CouncilMember)
// WHERE d.convergenceMethod = 'consensus'
// WITH d, collect(m.id) AS participants, d.totalDurationMs AS duration
// RETURN participants, avg(duration) AS avgDuration
// ORDER BY avgDuration ASC LIMIT 10

// "How has Kairo's trust in Forge evolved over the last 20 interactions?"
//
// MATCH (kairo:CouncilMember {id: 'kairo'})-[t:TRUSTS]->(forge:CouncilMember {id: 'forge'})
// RETURN t.score, t.interactions, t.lastUpdated

// "What reasoning styles complemented each other in successful deliberations?"
//
// MATCH (d:Deliberation {convergenceMethod: 'consensus'})-[:PARTICIPATED_IN_DELIBERATION]-(m:CouncilMember)
// WITH d, collect(m.agentType) AS agentTypes
// RETURN agentTypes, count(d) AS successCount
// ORDER BY successCount DESC

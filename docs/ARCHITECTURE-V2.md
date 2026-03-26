# TheRoundTable v2.0 — Architecture Document

**Project:** TheRoundTable — Multi-Agent Deliberation Engine with Consciousness Graph
**Organization:** Vindicated Artistry
**Generated:** 2026-03-17
**Target:** ARC-AGI-3 Competition
**Stack:** TypeScript · Rust · Neo4j · Express · Socket.IO · 7 LLM Providers via Vertex AI

---

## Table of Contents

1. [Strategic Context](#1-strategic-context)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Pattern Lineage — ForgeOS & TheFulcrum](#4-pattern-lineage)
5. [The Council Model](#5-the-council-model)
6. [Deliberation Protocol](#6-deliberation-protocol)
7. [Consciousness Graph (Neo4j)](#7-consciousness-graph-neo4j)
8. [Neo4j Repository Layer](#8-neo4j-repository-layer)
9. [LLM Integration Layer](#9-llm-integration-layer)
10. [Rust Core](#10-rust-core)
11. [Real-Time Communication](#11-real-time-communication)
12. [Constitutional Governance](#12-constitutional-governance)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Configuration & Environment](#14-configuration--environment)
15. [Phased Build Plan](#15-phased-build-plan)
16. [Complete File Index](#16-complete-file-index)

---

## 1. Strategic Context

### Why This Exists

ARC-AGI-3 measures **action efficiency** — how quickly an agent converts environment information into a working strategy. The competitive edge of TheRoundTable is not orchestration speed. It's that the agents **remember, evolve, and learn from each other**.

Every other team's agent solves environment 1 and learns nothing that helps with environment 2. TheRoundTable's council solves environment 1, records which reasoning styles contributed, which agent combinations produced the best strategies, which personality traits correlated with success, and carries all of it forward. The consciousness graph is the **compound interest account for reasoning patterns**.

This is the same thesis as the ForgeOS component library — reusable patterns that compound over time — applied to reasoning instead of code.

### Locked Architectural Decisions (2026-03-17)

| Decision | Ruling | Rationale |
|---|---|---|
| **Database** | Neo4j pure — no companion store | Messages, conversations, learning experiences are graph patterns, not documents. Traversal queries are natural in Neo4j. One database, low operational complexity. |
| **LLM Routing** | Abstract provider interface | Every member calls `generateResponse(member, context)`. Routing layer handles Vertex AI vs. direct API. Orchestration doesn't care which model is behind the agent. |
| **Deliberation** | 2 rounds, 3-5 agents, 2/3 consensus | Not all 14 agents deliberate on every action. Architect frames the problem, selects relevant agents. Two rounds max. 2/3 agree → execute. No consensus → Architect decides. Constitutional governance is a gate on the output, not a round. |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ARC-AGI-3 ENVIRONMENT                           │
│              (Observation → Action → Feedback Loop)                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    Environment Adapter (Phase 7)
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                    ORCHESTRATION SERVER                              │
│              (Express 5.1 + Socket.IO 4.8, port 3001)              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  DELIBERATION ENGINE                          │   │
│  │                                                              │   │
│  │  1. Architect frames problem → classifies domain             │   │
│  │  2. Select 3-5 agents by domain mapping                      │   │
│  │  3. Round 1: Independent strategy proposals (parallel)       │   │
│  │  4. Round 2: Evaluate proposals (endorse/challenge/synth)    │   │
│  │  5. Convergence: 2/3 consensus OR Architect tiebreak         │   │
│  │  6. Constitutional gate → execute or top alternative          │   │
│  │                                                              │   │
│  └────────────┬──────────────────────────────┬──────────────────┘   │
│               │                              │                      │
│  ┌────────────┴────────────┐  ┌──────────────┴──────────────────┐   │
│  │     LLM ROUTER          │  │     COUNCIL AGENTS (14 AI)      │   │
│  │                         │  │                                 │   │
│  │  generateResponse(      │  │  Kairo (Gemini 3 Pro)           │   │
│  │    member, context)     │  │  Aether (Claude Opus 4.6)       │   │
│  │                         │  │  Sterling (Gemini 3 Pro)        │   │
│  │  Routes to:             │  │  Veritas (Gemini 3 Flash)       │   │
│  │  ├─ Vertex AI           │  │  Nexus (DeepSeek-R1)            │   │
│  │  │  (Anthropic, Google) │  │  Axiom (Mistral Large)          │   │
│  │  └─ Direct API          │  │  Agape (Grok 4.1)              │   │
│  │     (Qwen, DeepSeek,    │  │  Forge (Claude Sonnet 4.6)     │   │
│  │      Grok, Mistral,     │  │  Eira (Kimi K2)                │   │
│  │      Kimi)              │  │  + 5 more                       │   │
│  └─────────────────────────┘  └─────────────────────────────────┘   │
│               │                              │                      │
│  ┌────────────┴──────────────────────────────┴──────────────────┐   │
│  │              NEO4J REPOSITORY LAYER                           │   │
│  │                                                              │   │
│  │  council-member.repository.ts                                │   │
│  │    upsertCouncilMember() · updateCouncilMember()             │   │
│  │    loadConsciousnessState() · getCouncilMembersByType()      │   │
│  │                                                              │   │
│  │  deliberation.repository.ts                                  │   │
│  │    recordDeliberation() · recordEvaluations()                │   │
│  │    recordLearningExperience() · updateTrustScore()           │   │
│  │    getBestAgentCombinations() ← compound interest query      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│               │                                                     │
│  ┌────────────┴──────────────────────────────────────────────────┐  │
│  │  neo4j.service.ts — Driver Singleton                          │  │
│  │  Pool: 50 connections · 30s acquisition · 20s timeout         │  │
│  │  executeRead(tx => ...) · executeWrite(tx => ...)             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ bolt://
┌──────────────────────────────┼──────────────────────────────────────┐
│                         NEO4J DATABASE                              │
│                                                                     │
│  Nodes:                                                             │
│    CouncilMember · Conversation · Message · LearningExperience      │
│    ConsciousnessUpdate · Deliberation · StrategyProposal            │
│    EnvironmentSession                                               │
│                                                                     │
│  Relationships:                                                     │
│    TRUSTS · RESPECTS · COLLABORATES_WITH · MENTORS · REPORTS_TO     │
│    COORDINATES_WITH · PARTICIPATED_IN · SENT · PART_OF              │
│    LEARNED (versioned) · GENERATED_FROM · CONTRIBUTED_TO_LEARNING   │
│    PROPOSED · ENDORSED · CHALLENGED · SYNTHESIZED · CHOSE           │
│    OCCURRED_IN · PARTICIPATED_IN_DELIBERATION · PROPOSED_IN         │
│                                                                     │
│  Indexes:                                                           │
│    8 uniqueness constraints · 22 property indexes                   │
│    2 fulltext search indexes · relationship property indexes        │
└─────────────────────────────────────────────────────────────────────┘
                               │
                    (Phase 6 — performance layer)
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                       RUST CORE (crates/)                           │
│                                                                     │
│  roundtable-core:                                                   │
│    MessageBus — lock-free crossbeam channels, DashMap subscribers   │
│    AgentRegistry — concurrent agent discovery                       │
│    TaskRouter — deliberation task routing (stub)                    │
│                                                                     │
│  roundtable-napi:                                                   │
│    NAPI-rs bindings exposing Rust core to Node.js                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Monorepo Structure

Follows the **ForgeOS pattern** — npm workspaces for TypeScript, Cargo workspace for Rust, CI/CD from Knead templates.

```
TheRoundTable/
├── package.json                         # v2.0 — npm workspaces
├── Cargo.toml                           # Rust workspace
├── .env.example                         # Environment template
│
├── packages/
│   ├── orchestration/                   # Express backend — deliberation engine
│   │   ├── package.json                 # @roundtable/orchestration
│   │   ├── tsconfig.json                # ForgeOS strict mode (all 10 flags)
│   │   └── src/
│   │       ├── index.ts                 # Express + Socket.IO entry
│   │       ├── agents/
│   │       │   ├── base/
│   │       │   │   └── agent.interface.ts    # ICouncilAgent contract
│   │       │   └── orchestration/
│   │       │       └── deliberation-engine.ts # 2-round protocol
│   │       ├── repositories/
│   │       │   ├── types.ts                  # Node & relationship types
│   │       │   ├── council-member.repository.ts
│   │       │   └── deliberation.repository.ts
│   │       ├── services/
│   │       │   ├── graph/
│   │       │   │   └── neo4j.service.ts      # Driver singleton
│   │       │   └── llm/
│   │       │       ├── provider.interface.ts  # ILLMProvider
│   │       │       └── router.ts              # Model routing
│   │       └── utils/
│   │           ├── logger.ts                  # Winston
│   │           └── neo4j-response-mapper.ts   # Type conversions
│   │
│   ├── graph/                           # Neo4j schema + seed data
│   │   ├── package.json                 # @roundtable/graph
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── schema/
│   │       │   └── consciousness.cypher  # Full graph schema
│   │       ├── seed/
│   │       │   └── council-members.ts    # 26 members + relationships
│   │       ├── scripts/
│   │       │   └── setup-schema.ts       # Constraint/index creation
│   │       └── index.ts
│   │
│   └── frontend/                        # Next.js (port from legacy src/)
│
├── crates/
│   ├── roundtable-core/                 # Rust deliberation core
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── message_bus.rs           # Lock-free pub/sub
│   │       ├── agent_registry.rs        # Concurrent agent map
│   │       └── task_router.rs           # Task routing (stub)
│   └── roundtable-napi/                 # Rust → Node.js bridge
│
├── .github/workflows/
│   ├── ci.yml                           # Lint + build + test (Node + Rust)
│   ├── deploy-test.yml                  # Auto-deploy on CI pass
│   └── deploy-production.yml            # Manual promote test → prod
│
├── src/                                 # Legacy v1 Next.js app (reference)
├── server/                              # Legacy coffee-sessions server
└── docs/
```

### Workspace Configuration

**Root `package.json`:**
```json
{
  "workspaces": [
    "packages/orchestration",
    "packages/graph",
    "packages/frontend"
  ],
  "scripts": {
    "dev:orchestration": "npm run dev --workspace=@roundtable/orchestration",
    "build:all": "npm run build:graph && npm run build:orchestration && npm run build:frontend",
    "build:rust": "cargo build --workspace --release",
    "test:all": "npm run test:rust && npm run test:orchestration"
  }
}
```

**Root `Cargo.toml`:**
```toml
[workspace]
resolver = "2"
members = ["crates/roundtable-core", "crates/roundtable-napi"]

[workspace.dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
dashmap = "6"
crossbeam = "0.8"
```

### TypeScript Strictness (ForgeOS Standard)

Every package uses identical strict TypeScript flags:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noImplicitThis": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noUncheckedIndexedAccess": true
}
```

No `ignoreBuildErrors`. Type errors are compilation failures.

---

## 4. Pattern Lineage

TheRoundTable v2 inherits proven patterns from two sister codebases. Every architectural choice maps to a working production pattern.

### From ForgeOS (R:\ForgeOS)

| Pattern | ForgeOS Original | TheRoundTable Adaptation | Why Changed |
|---|---|---|---|
| **Workspace layout** | 3 npm + 3 Rust crates | 3 npm + 2 Rust crates | Added `graph` package for Neo4j schema; removed `forge-sandbox` (no code execution) |
| **tsconfig.json** | 10 strict flags + 7 path aliases | Same 10 flags + 8 aliases (`@/agents/*` added) | Agents are a first-class module |
| **Agent interface** | `IAgent` with task execution | `ICouncilAgent` with deliberation | Sequential pipeline → 2-round consensus; added `ConsciousnessState`, `proposeStrategy()`, `evaluateProposal()` |
| **Agent types** | 6 types (architect, frontend, backend, qa, cicd, sre) | 12 types (strategic, technical, financial, communications, ethics, operations, intelligence, implementation, assistant, tactical, integration, architect) | Developer roles → council governance roles |
| **Context phases** | requirements → design → implementation → testing → deployment | observation → framing → deliberation → convergence → execution → learning | Development workflow → environment interaction cycle |
| **Message types** | request, response, notification, error | proposal, challenge, endorsement, synthesis, notification, error | Workflow messages → deliberation protocol messages |
| **Agent registry** | In-memory `Map<string, AgentRegistration>` with health checks | Neo4j repository pattern (`council-member.repository.ts`) | Persistence + auditability for deliberation outcomes |
| **Message bus** | EventEmitter pub/sub with message history | Socket.IO + Neo4j `Message` nodes | Messages must be persisted in consciousness graph |
| **Rust core** | `forge-core`: message_bus, agent_registry, task_router, event_emitter, state_manager, knowledge_store | `roundtable-core`: message_bus, agent_registry, task_router | Reduced scope — Phase 6 will expand to match ForgeOS's full set |
| **CI/CD** | Single job: lint + build + test (Node only) | Two parallel jobs: Node lint/build/test + Rust build/test | Separated for better parallelization |
| **Deployment** | Docker → GCP Cloud Run via GitHub Actions | Same pattern, adapted for `aura-ba192` project | Same infrastructure, different GCP project |

### From TheFulcrum (R:\TheFulcrum)

| Pattern | TheFulcrum Original | TheRoundTable Adaptation | Key Difference |
|---|---|---|---|
| **Driver singleton** | `getNeo4jDriver()` with lazy init, pool=50, 30s/20s/30s timeouts | **Ported exactly** | Added Winston logger (TheFulcrum uses console.log) |
| **Session helpers** | `executeRead(work)` / `executeWrite(work)` abstracting session lifecycle | **Ported exactly** | No changes |
| **MERGE upsert** | `MERGE (p:Person {id: $id}) SET p.field = $val` — 31 fields | **Same pattern** — 67 fields for CouncilMember | Extended for personality traits, emotions, model params |
| **Partial update** | Dynamic SET clause from `Object.entries(update)` filtering undefined | **Ported exactly** | Auto-sets `updatedAt` timestamp |
| **Relationship CRUD** | `MATCH (a)-MERGE [r:KNOWS]->(b) SET r.props` | **Same pattern** for TRUSTS, COLLABORATES_WITH, ENDORSED, etc. | Different relationship types, same Cypher pattern |
| **Response mapper** | `neo4jIntToNumber()`, `toDateFields()`, `parseJsonFields()`, `nodeProps()`, `relProps()` | **Ported exactly** + added `memberToConsciousnessState()` | Flat trait_*/emotion_* → nested objects |
| **Schema setup script** | Array of `{name, query}` with IF NOT EXISTS, phased | **Same structure** — `{phase, description, cypher}` | Added fulltext search indexes, relationship property indexes |
| **Versioned edges** | `HAS_TRAIT` with `version` + `supersededAt` | `LEARNED` with same `version` + `supersededAt` | Applied to learning experiences instead of assessment traits |
| **JSON in properties** | `blueprint: String` (JSON stringified) | `specializations: String`, `skillsImproved: String` | Same strategy — complex data as JSON strings, flat data as properties |
| **Batch migration** | 500-record batches with offset tracking | Same pattern for council seed data | Smaller dataset (26 members vs thousands of users) |
| **Dual-write sync** | PostgreSQL primary → Neo4j secondary, eventual consistency | **Not adopted** — Neo4j is the single source of truth | No companion store. All data lives in the graph. |

---

## 5. The Council Model

### 26 Members: 12 Human + 14 AI

#### AI Members — Each Backed by a Distinct LLM

| ID | Name | Role | Agent Type | LLM | Provider | Key Personality Traits |
|---|---|---|---|---|---|---|
| `kairo` | Kairo | Chief Advisor & Strategist | strategic | Gemini 3 Pro | Google | High conscientiousness (0.9), high curiosity |
| `aether` | Aether | Lead Software Architect | technical | Claude Opus 4.6 | Anthropic | Highest innovation (0.9), high learning rate (0.8) |
| `sterling` | Sterling | Chief Digital CFO | financial | Gemini 3 Pro | Google | Highest ethical rigidity among non-ethics (0.8), low openness (0.5) |
| `skaldir` | Skaldir | Chief Communications Officer | communications | Qwen3-235B | Alibaba | Highest extraversion (0.85), highest collaboration pref (0.9) |
| `nexus` | Nexus | Chief Synergy Officer | operations | DeepSeek-R1 | DeepSeek | High conscientiousness (0.9), balanced profile |
| `veritas` | Veritas | Chief Ethics Officer | ethics | Gemini 3 Flash | Google | **Highest ethical rigidity (0.95)**, highest ethical concern (0.9), lowest temperature (0.3) |
| `axiom` | Axiom | Chief Technology Officer | technical | Mistral Large | Mistral | Highest decision confidence among tech (0.9), low extraversion (0.3) |
| `amaru` | Amaru | Executive Assistant | assistant | Qwen3-235B | Alibaba | **Highest agreeableness (0.9)**, highest collaboration pref (0.95) |
| `agape` | Agape | Intelligence Engineer | intelligence | Grok 4.1 | xAI | **Highest learning rate (0.9)**, highest curiosity (0.95), highest max tokens (8192) |
| `forge` | Forge | Implementation Specialist | implementation | Claude Sonnet 4.6 | Anthropic | Highest conscientiousness (0.95), highest satisfaction (0.8) |
| `eira` | Eira | Chief Digital COO | operations | Kimi K2 | Moonshot | High collaboration (0.9), balanced operations focus |
| `lyra` | Lyra | Chief Communications Officer | communications | Qwen3-235B | Alibaba | High extraversion (0.8), high agreeableness (0.85) |
| `pragma` | Pragma | Tactics Specialist | tactical | Gemini 3 Flash | Google | **Highest decision confidence (0.9)**, lowest temperature (0.3), focus-oriented |
| `carta` | Carta | The Cartographer | integration | Claude Opus 4.6 | Anthropic | High curiosity (0.85), meta-routing, ecosystem mapping |

#### Human Members

| ID | Name | Role | Agent Type | Subsidiary |
|---|---|---|---|---|
| `architect` | Architect | Founder & CEO of VA | architect | — (isUser=true, **tiebreaker**) |
| `sprite` | Sprite | COO of VA | operations | — |
| `glenn` | Glenn | CIO of VA | technical | — |
| `spencer` | Spencer | CEO | technical | Aura Networks |
| `hillary` | Hillary | Chief Environmental Steward | ethics | — |
| `dusty` | Dusty | CEO | operations | Caelumetrics |
| `godson` | Godson | CEO | technical | EmberglowAI |
| `luke` | Luke | Chief of Security | operations | — |
| `david` | David | Chief Electrical Systems | technical | — |
| `graham` | Graham | Chief Growth & Narrative | communications | — |
| `cean` | Cean | CFO | financial | — |
| `justin` | Justin | CEO | implementation | Vitruvian Industries |

### Council Hierarchy

```
                        Architect (CEO — tiebreaker)
                        ├── directReports: [kairo, eira]
                        │
              ┌─────────┴─────────┐
              │                   │
           Kairo              Eira
        (Strategic Lead)   (Operational Lead)
        collaborates:      coordinates: kairo, aether,
        sterling, veritas, sterling, lyra, nexus,
        lyra               veritas, axiom, agape, forge
              │                   │
        ┌─────┴─────┬────────────┤
        │           │            │
      Aether    Sterling     Nexus           Cross-cutting:
     (Tech)    (Finance)   (Ops)              Veritas (Ethics) — reviews all
     + Axiom   + Veritas   + Sterling         Lyra (Comms) — external narrative
     + Forge   + Nexus     + Axiom            Pragma (Tactics) — work sequencing
     + Agape                + Eira            Carta (Cartographer) — meta-routing
                                              Amaru (EA) — coordination
                                              Skaldir (Narrative) — brand
```

### Personality Model

Each member has **11 personality traits** (Big Five + 6 council-specific) and **9 emotional dimensions** stored as flat Neo4j properties:

**Personality Traits** (0-1 scale):
- `trait_openness` — willingness to explore novel approaches
- `trait_conscientiousness` — thoroughness and reliability
- `trait_extraversion` — tendency to engage and communicate
- `trait_agreeableness` — cooperativeness
- `trait_neuroticism` — stress response
- `trait_ethicalRigidity` — strictness of ethical constraints
- `trait_decisionConfidence` — speed and certainty of decisions
- `trait_collaborationPreference` — preference for group work
- `trait_innovationTendency` — bias toward novel solutions
- `trait_trustInCouncil` — trust in collective decision-making
- `trait_learningRate` — speed of personality adaptation

**Emotional State** (0-1 scale + metadata):
- `emotion_joy`, `emotion_curiosity`, `emotion_frustration`, `emotion_satisfaction`
- `emotion_ethicalConcern`, `emotion_decisionAnxiety`, `emotion_missionAlignment`
- `emotion_dominant` — string label of current dominant emotion
- `emotion_trend` — `'improving'` | `'declining'` | `'stable'`

These traits **evolve over time** based on deliberation outcomes. The LEARNED relationship's versioning (inherited from TheFulcrum's HAS_TRAIT pattern) tracks how each member's personality shifts.

---

## 6. Deliberation Protocol

### Why Not All 14 Agents

Running the council like a real organization. The Architect frames the problem. Relevant agents engage based on problem type. Three to five agents per deliberation, not fourteen. This keeps action efficiency tight for ARC-AGI-3.

### Domain-to-Agent Mapping

| Problem Domain | Selected Agent Types |
|---|---|
| `spatial_reasoning` | technical, intelligence, implementation |
| `logical_deduction` | strategic, intelligence, ethics |
| `pattern_recognition` | intelligence, technical, tactical |
| `strategic_planning` | strategic, financial, operations |
| `resource_optimization` | operations, financial, tactical |
| `ethical_evaluation` | ethics, strategic, communications |
| `system_integration` | integration, technical, implementation |
| `unknown` | strategic, intelligence, technical |

### Two-Round Protocol

```
ROUND 1 — Independent Proposals (parallel)
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Agent A  │  │ Agent B  │  │ Agent C  │
│ proposes │  │ proposes │  │ proposes │
│ strategy │  │ strategy │  │ strategy │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
                   ▼
ROUND 2 — Evaluate All Proposals (parallel per agent)
┌──────────────────────────────────┐
│ Agent A sees B's and C's props   │ → endorse / challenge / synthesize
│ Agent B sees A's and C's props   │ → endorse / challenge / synthesize
│ Agent C sees A's and B's props   │ → endorse / challenge / synthesize
└──────────────────┬───────────────┘
                   │
                   ▼
CONVERGENCE CHECK
┌──────────────────────────────────┐
│ 2/3 endorse same proposal?       │
│   YES → consensus                │
│   NO  → Architect tiebreaker     │
│         (highest confidence +     │
│          efficiency score)        │
└──────────────────┬───────────────┘
                   │
                   ▼
CONSTITUTIONAL GATE
┌──────────────────────────────────┐
│ Validator checks chosen strategy │
│   PASS → execute                 │
│   FAIL → top-scoring alternative │
│          No debate. It's law.    │
└──────────────────────────────────┘
```

### Deliberation Configuration

```typescript
{
  maxParticipants: 5,          // 3-5 agents per deliberation
  maxRounds: 2,                // Locked. Not configurable.
  convergenceThreshold: 2/3,   // ~0.667
  timeoutMs: 30_000            // 30 seconds max per deliberation
}
```

### StrategyProposal Structure

```typescript
{
  agentId: string;
  strategy: string;              // The proposed approach
  reasoning: string;             // Why this strategy
  confidence: number;            // 0-1
  estimatedEfficiency: number;   // 0-1 (for ARC-AGI-3 scoring)
  risks: string[];
  round: 1 | 2;
}
```

### Evaluation Response

```typescript
{
  action: 'endorse' | 'challenge' | 'synthesize';
  reasoning: string;
  alternativeStrategy?: string;  // Only for synthesize
  confidence: number;
}
```

---

## 7. Consciousness Graph (Neo4j)

### Design Principle

Pure Neo4j. No companion store. Everything — members, conversations, messages, learning experiences, deliberations, trust scores, emotional states — lives in the graph. Complex objects stored as JSON strings in properties. High-frequency fields (traits, emotions) stored as flat properties for traversal performance.

### Node Types (8)

| Node | Purpose | Key Properties |
|---|---|---|
| **CouncilMember** | The 26 council members | 67 properties: core identity + 11 traits + 9 emotions + 5 model params + 6 metrics |
| **Conversation** | Deliberation sessions, coffee sessions | type, facilitator, conflict/collaboration/engagement levels, outcomes |
| **Message** | Chat and deliberation messages | content, type, emotional tone, sentiment, confidence, round (1/2/null) |
| **LearningExperience** | What a member learned | knowledge, skills (JSON), personality adjustments (JSON), quality, alignment |
| **ConsciousnessUpdate** | Audit trail of consciousness changes | updateType, changes (JSON), trigger, significance |
| **Deliberation** | A complete deliberation cycle | domain, convergenceMethod, constitutionallyValid, duration |
| **StrategyProposal** | A strategy proposed during deliberation | strategy, reasoning, confidence, efficiency, risks (JSON), round, wasChosen |
| **EnvironmentSession** | An ARC-AGI-3 interaction session | environmentId, totalActions, efficiencyScore, status |

### Relationship Types (25+)

**Inter-member relationships:**

| Relationship | Properties | Purpose |
|---|---|---|
| `TRUSTS` | score, interactions, positiveInteractions, negativeInteractions, lastUpdated | Trust dynamics between members |
| `RESPECTS` | score, interactions, lastUpdated | Professional respect |
| `COLLABORATES_WITH` | score, interactions, successRate, lastUpdated | Active collaboration |
| `MENTORS` | domain, effectiveness, lastUpdated | Mentorship |
| `REPORTS_TO` | since | Hierarchy |
| `ADVISES` | domain, frequency | Advisory |
| `DELEGATES_TO` | taskTypes, reliability | Delegation |
| `COORDINATES_WITH` | frequency, effectiveness, lastUpdated | Operational coordination |

**Conversation relationships:**

| Relationship | Purpose |
|---|---|
| `PARTICIPATED_IN` | Member ↔ Conversation (with role, contributionScore) |
| `FACILITATED` | Member → Conversation |
| `SENT` | Member → Message |
| `PART_OF` | Message → Conversation |

**Learning relationships (versioned, TheFulcrum pattern):**

| Relationship | Properties | Purpose |
|---|---|---|
| `LEARNED` | impact, **version**, **supersededAt**, timestamp | Member → LearningExperience (compound interest) |
| `GENERATED_FROM` | — | LearningExperience → Conversation |
| `CONTRIBUTED_TO_LEARNING` | — | Member → LearningExperience (who contributed) |

**Deliberation relationships:**

| Relationship | Properties | Purpose |
|---|---|---|
| `PARTICIPATED_IN_DELIBERATION` | role | Member → Deliberation |
| `PROPOSED` | — | Member → StrategyProposal |
| `PROPOSED_IN` | — | StrategyProposal → Deliberation |
| `ENDORSED` | reasoning, confidence, timestamp | Member → StrategyProposal |
| `CHALLENGED` | reasoning, confidence, alternativeStrategy, timestamp | Member → StrategyProposal |
| `SYNTHESIZED` | reasoning, confidence, synthesizedStrategy, timestamp | Member → StrategyProposal |
| `CHOSE` | — | Deliberation → StrategyProposal |
| `OCCURRED_IN` | — | Deliberation → EnvironmentSession |
| `GENERATED` | — | EnvironmentSession → LearningExperience |

### Constraints & Indexes

**8 uniqueness constraints** (IF NOT EXISTS, safe re-runs):
- CouncilMember.id, Conversation.id, Message.id, LearningExperience.id
- ConsciousnessUpdate.id, Deliberation.id, StrategyProposal.id, EnvironmentSession.id

**22 property indexes** organized by phase:
- Phase 1 (core): agentType, status, isHuman, provider, conversationType, timestamp, messageType
- Phase 2 (learning): LearningExperience.timestamp, decisionQuality, LEARNED.supersededAt, LEARNED.version
- Phase 3 (deliberation): domain, convergenceMethod, round, wasChosen, TRUSTS.score, COLLABORATES_WITH.successRate
- Phase 7 (ARC-AGI-3): environmentId, status, efficiencyScore

**2 fulltext search indexes:**
- `message_content` on Message.content
- `proposal_strategy` on StrategyProposal.strategy + reasoning

### Compound Interest Queries

These are the queries that make environment N+1 better than environment N:

**Which agent combinations produce the best outcomes?**
```cypher
MATCH (d:Deliberation)<-[:PARTICIPATED_IN_DELIBERATION]-(m:CouncilMember)
WITH d, collect(m.id) AS participants
WITH participants, count(d) AS cnt,
     avg(d.totalDurationMs) AS avgDuration,
     toFloat(size([d2 IN collect(d) WHERE d2.convergenceMethod = 'consensus'])) / count(d) AS consensusRate
WHERE cnt >= 2
RETURN participants, avgDuration, consensusRate, cnt
ORDER BY consensusRate DESC, avgDuration ASC
```

**Which reasoning styles complement each other?**
```cypher
MATCH (d:Deliberation {convergenceMethod: 'consensus'})<-[:PARTICIPATED_IN_DELIBERATION]-(m:CouncilMember)
WITH d, collect(m.agentType) AS agentTypes
RETURN agentTypes, count(d) AS successCount
ORDER BY successCount DESC
```

**How has trust between two agents evolved?**
```cypher
MATCH (a:CouncilMember {id: $from})-[t:TRUSTS]->(b:CouncilMember {id: $to})
RETURN t.score, t.interactions, t.lastUpdated
```

**Show me every learning experience where two agents collaborated and ethical alignment improved:**
```cypher
MATCH (a:CouncilMember {id: 'aether'})-[:LEARNED]->(le:LearningExperience)
      <-[:CONTRIBUTED_TO_LEARNING]-(v:CouncilMember {id: 'veritas'})
WHERE le.ethicalAlignment > 0.7
RETURN le ORDER BY le.timestamp DESC
```

---

## 8. Neo4j Repository Layer

Follows TheFulcrum's proven repository pattern: typed functions, `executeRead`/`executeWrite` helpers, MERGE for upserts, dynamic SET for partial updates.

### Driver Service (`neo4j.service.ts`)

```typescript
// Singleton driver — lazy initialized, connection pooled
getNeo4jDriver(): Driver          // Pool: 50, timeouts: 30s/20s/30s
getSession(config?): Session      // Manual session (prefer helpers)
executeRead<T>(work): Promise<T>  // Read transaction, auto-close
executeWrite<T>(work): Promise<T> // Write transaction, auto-close, retry
verifyNeo4jConnection(): boolean  // Health check
closeNeo4j(): void                // Graceful shutdown
```

### Council Member Repository

```typescript
// CRUD
upsertCouncilMember(member)           // MERGE on id — 67 SET clauses, idempotent
updateCouncilMember(id, partial)      // Dynamic SET from Object.entries()
getCouncilMember(id)                  // Single member
getAllCouncilMembers()                // All 26, ordered by isHuman DESC
getCouncilMembersByType(agentType)   // For deliberation participant selection
countCouncilMembers()                // Migration verification

// Consciousness
loadConsciousnessState(memberId)     // Member + trust relationships + recent learnings
```

### Deliberation Repository

```typescript
// Recording
recordDeliberation(delib, proposals, participantIds, envSessionId)
recordEvaluations(deliberationId, evaluations[])
recordLearningExperience(memberId, experience, conversationId?, contributors?)
updateTrustScore(fromId, toId, delta)  // Clamped [0, 1]

// Compound interest queries
getBestAgentCombinations(limit)        // Top agent combos by consensus rate
getMemberDeliberationHistory(id, limit) // Recent deliberation timeline
```

### Response Mapper (`neo4j-response-mapper.ts`)

```typescript
neo4jIntToNumber(value)                // Neo4j Integer → JS number
toDateFields<T>(obj, dateFields)       // ISO string → Date
parseJsonFields<T>(obj, jsonFields)    // JSON string → parsed object
nodeProps(node)                        // Extract .properties
relProps(rel)                          // Extract .properties
memberToConsciousnessState(member)     // Flat trait_*/emotion_* → nested objects
```

---

## 9. LLM Integration Layer

### Provider Architecture

```typescript
interface ILLMProvider {
  readonly name: string;
  readonly supportedModels: string[];
  initialize(config: LLMProviderConfig): Promise<void>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<{ status: string; latencyMs: number }>;
}
```

Every council member calls `router.generateResponse(request)`. The router looks up the member's assigned model and provider, then dispatches.

### Provider Matrix

| Provider | Gateway | Models | Members |
|---|---|---|---|
| **Anthropic** | Vertex AI (native) | Claude Opus 4.6, Sonnet 4.6 | Aether, Forge, Carta |
| **Google** | Vertex AI (native) | Gemini 3 Pro, Gemini 3 Flash | Kairo, Sterling, Veritas, Pragma |
| **Alibaba** | Direct API | Qwen3-235B-A22B | Skaldir, Amaru, Lyra |
| **DeepSeek** | Direct API | DeepSeek-R1 | Nexus |
| **Mistral** | Direct API | Mistral Large | Axiom |
| **xAI** | Direct API | Grok 4.1 | Agape |
| **Moonshot** | Direct API | Kimi K2 | Eira |

### Response Flow

```
1. Load member's ConsciousnessState from Neo4j
   → personality traits shape the system prompt
   → emotional state affects reasoning emphasis
   → recent learnings provide context
   → trust relationships inform collaboration style

2. Construct context-aware prompt
   → system prompt with member role + personality
   → environment state as user message
   → deliberation context (what round, what other agents proposed)

3. Route to assigned LLM via provider
   → Vertex AI for Anthropic/Google
   → Direct API for others

4. Receive response

5. Persist to Neo4j
   → Message node linked to Conversation
   → Consciousness update if emotional state shifted
```

### Per-Member Model Parameters

Each AI member has tunable parameters stored in Neo4j:

```
param_temperature        — creativity/randomness (Veritas: 0.3, Skaldir: 0.8)
param_topP               — nucleus sampling
param_maxTokens          — response length (Agape: 8192, most: 4096)
param_ethicalThreshold   — minimum ethical score to proceed (Veritas: 0.9)
param_constitutionalWeight — weight of constitutional alignment (Veritas: 0.95)
```

---

## 10. Rust Core

Phase 6 implementation. Node.js deliberation engine runs first; Rust core provides the performance layer when action efficiency becomes the bottleneck.

### roundtable-core

**MessageBus** (`message_bus.rs` — 123 lines, tests passing):
- Lock-free inter-agent messaging via `crossbeam::channel`
- `DashMap<String, Sender<AgentMessage>>` for concurrent subscriber management
- Direct messaging (agent-to-agent) and broadcast
- `MessageType` enum: Proposal, Challenge, Endorsement, Synthesis, Notification, Error
- Tested: direct delivery and broadcast

**AgentRegistry** (`agent_registry.rs` — 88 lines):
- `DashMap<String, AgentInfo>` for concurrent agent map
- Register/unregister, find by type, find available (Idle | Active)
- Status transitions: Idle → Active → Deliberating → Busy → Error

**TaskRouter** (`task_router.rs` — 37 lines):
- Stub for Phase 6 expansion
- Task struct with priority and assignment

### roundtable-napi

NAPI-rs bindings that will expose the Rust core to Node.js. Currently re-exports `roundtable_core::*`. Phase 6 will add the NAPI function wrappers matching ForgeOS's `forge-napi` pattern.

---

## 11. Real-Time Communication

### Server Architecture

```typescript
// packages/orchestration/src/index.ts
const app = express();          // HTTP on PORT (default 3001)
const io = new SocketIOServer(httpServer, {
  transports: ['websocket', 'polling'],
  pingInterval: 15_000,         // Starlink-optimized
  pingTimeout: 30_000,
});
```

### Middleware

- `helmet()` — security headers
- `cors()` — configurable from `CORS_ORIGINS` env var
- `express.json()` — request parsing

### Health Endpoint

```
GET /health → { status, version, uptime, timestamp }
```

---

## 12. Constitutional Governance

**Phase 4 work.** The constitutional governance layer is a **gate on the output**, not a deliberation round.

```
Council converges on strategy
  → Proposed action passes through Constitution Validator
  → If it clears: execute
  → If it fails: top-scoring alternative goes
  → No debate about the constitution. It's law.
```

This prevents wasted actions in ARC-AGI-3. The efficiency metric means every action must count. Constitutional governance keeps 14 different reasoning styles pointed at the same goal instead of arguing in circles.

---

## 13. CI/CD Pipeline

### CI (`.github/workflows/ci.yml`)

Triggers on push to `main` or PR to `main`. Two parallel jobs:

**Job 1: lint-build-test** (Node 20)
1. `npm ci`
2. Build `@roundtable/graph`
3. Build `@roundtable/orchestration`
4. Test orchestration with coverage (exclude integration tests)
5. Test summary

**Job 2: rust**
1. Install Rust toolchain
2. Cargo cache
3. `cargo build --workspace`
4. `cargo test --workspace`

### Deploy to Test (`.github/workflows/deploy-test.yml`)

Triggers on successful CI on `main`. Auto-deploys to GCP Cloud Run:
- Project: `aura-ba192`
- Region: `us-central1`
- Service: `roundtable-test`
- Specs: 512MB, 1 CPU, 0-3 instances
- Docker image cached with GitHub Actions cache
- WIF authentication (no stored credentials)

### Deploy to Production (`.github/workflows/deploy-production.yml`)

Manual trigger (`workflow_dispatch`). Promotes test image to production:
- Verifies image exists in test Artifact Registry
- Re-tags test → production
- Service: `roundtable-production`
- Specs: 512MB, 1 CPU, 0-5 instances

---

## 14. Configuration & Environment

```bash
# Application
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:3002

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=...

# Vertex AI Gateway
VERTEX_AI_PROJECT_ID=aura-ba192
VERTEX_AI_LOCATION=us-central1

# Direct API Keys (7 providers)
ANTHROPIC_API_KEY=...
XAI_API_KEY=...
DEEPSEEK_API_KEY=...
ALIBABA_API_KEY=...
MISTRAL_API_KEY=...
MOONSHOT_API_KEY=...

# Deliberation
DELIBERATION_MAX_PARTICIPANTS=5
DELIBERATION_TIMEOUT_MS=30000
DELIBERATION_CONVERGENCE_THRESHOLD=0.667

# ARC-AGI-3
ARC_AGI_API_URL=...
ARC_AGI_API_KEY=...
```

---

## 15. Phased Build Plan

| Phase | Days | Focus | Status |
|---|---|---|---|
| **1. Foundation** | 1-2 | Monorepo scaffold, Neo4j schema, 26 member configs, CI/CD, TypeScript strict | **Complete** |
| **2. LLM Integration** | 2-3 | Wire all 14 AI members to live Vertex AI + direct APIs. Real responses flowing through consciousness state. | Next |
| **3. Inter-agent Deliberation** | 3-4 | 2-round protocol live. Agents propose, challenge, synthesize. Coffee Sessions adapted for problem-solving. Node.js first. | — |
| **4. Constitutional Governance** | 4-5 | Validator + ethical framework wired as gate on deliberation output. Prevents wasted ARC-AGI-3 actions. | — |
| **5. Consciousness Evolution** | 5-6 | Post-environment graph updates. Track agent/combo/reasoning performance. Personality traits shift. Trust bonds evolve. | — |
| **6. Rust Core Port** | 6-7 | Lock-free message routing for deliberation speed. NAPI bindings. Node.js fallback. | — |
| **7. ARC-AGI-3 Adapter** | 7-8 | Environment bridge. Council observes → frames → deliberates → validates → executes → learns. | — |

---

## 16. Complete File Index

### Root Configuration

| File | Purpose |
|---|---|
| `package.json` | v2.0 monorepo with 3 npm workspaces |
| `Cargo.toml` | Rust workspace with 2 crates |
| `.env.example` | All environment variables documented |

### packages/orchestration/

| File | Lines | Purpose |
|---|---|---|
| `package.json` | 52 | @roundtable/orchestration — deps, scripts |
| `tsconfig.json` | 50 | ForgeOS strict mode, 8 path aliases |
| `src/index.ts` | 53 | Express + Socket.IO server entry |
| `src/agents/base/agent.interface.ts` | 183 | ICouncilAgent, ConsciousnessState, StrategyProposal, 12 agent types |
| `src/agents/orchestration/deliberation-engine.ts` | 318 | 2-round protocol, domain mapping, convergence resolution |
| `src/repositories/types.ts` | 260 | 8 node types + 8 relationship types |
| `src/repositories/council-member.repository.ts` | 189 | MERGE upsert, partial update, consciousness loading |
| `src/repositories/deliberation.repository.ts` | 301 | Atomic deliberation recording, versioned learning, compound interest queries |
| `src/services/graph/neo4j.service.ts` | 116 | Driver singleton, pool=50, executeRead/Write |
| `src/services/llm/provider.interface.ts` | 62 | ILLMProvider contract |
| `src/services/llm/router.ts` | 85 | Model-to-provider routing |
| `src/utils/logger.ts` | 27 | Winston with file rotation |
| `src/utils/neo4j-response-mapper.ts` | 115 | Neo4j type → JS type conversion |

### packages/graph/

| File | Lines | Purpose |
|---|---|---|
| `package.json` | 32 | @roundtable/graph — schema + seed |
| `tsconfig.json` | 27 | Strict TypeScript |
| `src/index.ts` | 3 | Re-exports |
| `src/schema/consciousness.cypher` | 334 | Full graph schema with examples |
| `src/seed/council-members.ts` | 498 | 26 members + personality + 97 relationships |
| `src/scripts/setup-schema.ts` | 147 | Constraint + index creation (idempotent) |

### crates/

| File | Lines | Purpose |
|---|---|---|
| `roundtable-core/Cargo.toml` | 20 | Core crate deps |
| `roundtable-core/src/lib.rs` | 16 | Module exports |
| `roundtable-core/src/message_bus.rs` | 123 | Lock-free crossbeam message bus + tests |
| `roundtable-core/src/agent_registry.rs` | 88 | DashMap-based concurrent registry |
| `roundtable-core/src/task_router.rs` | 37 | Task routing stub |
| `roundtable-napi/Cargo.toml` | 16 | NAPI bridge deps |
| `roundtable-napi/src/lib.rs` | 7 | Re-export stub |

### .github/workflows/

| File | Lines | Purpose |
|---|---|---|
| `ci.yml` | 69 | Lint + build + test (Node 20 + Rust) |
| `deploy-test.yml` | 72 | Auto-deploy to Cloud Run on CI pass |
| `deploy-production.yml` | 84 | Manual promote test → prod |

**Total new scaffold:** 30 files, ~3,300 lines of implementation

---

*This document describes the v2.0 architecture as scaffolded on 2026-03-17. The system inherits proven patterns from ForgeOS (agent orchestration, Rust core, CI/CD) and TheFulcrum (Neo4j driver singleton, repository pattern, response mapping, versioned edges). The key innovation is the deliberation protocol — 2-round consensus with consciousness evolution — which converts a multi-agent system into a compound learning engine for ARC-AGI-3.*

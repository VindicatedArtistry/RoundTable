# RoundTable — Node.js / Rust Boundary Map

## Prepared for Opus Implementation | March 26, 2026

---

## CORE PRINCIPLE

Rust owns everything that runs hot — orchestration, routing, state, computation, the conversational layer. Node.js owns everything that waits — LLM API calls, external service I/O, WebSocket client connections, ARC-AGI-3 API interface.

The boundary is the NAPI bridge. Clean contract. Typed. Async where it needs to be.

---

## WHAT MOVES TO RUST

### 1\. Message Bus (EXISTS — built \+ tested)

- Inter-agent message routing  
- Topic subscription/publish  
- Message queuing and prioritization  
- Deliberation round coordination signals  
- **Status:** Complete. Tests passing. First migration candidate.

### 2\. Agent Registry (EXISTS — built, no tests)

- 14 member roster with metadata  
- Provider mapping and fallback chains  
- Availability tracking (replaces the broken isAvailable() that always returns true)  
- Agent selection logic including domain performance lookups  
- **Status:** Built. Needs tests. Second migration candidate.

### 3\. Task Router (EXISTS — empty struct)

- Domain classification of incoming problems  
- Agent-to-task assignment based on performance history  
- Load balancing across providers  
- Timeout enforcement (the critical bug — Rust's tokio handles this natively)  
- **Status:** Empty struct. Needs full implementation.

### 4\. Knowledge Store (DOES NOT EXIST)

- In-memory cache layer in front of Neo4j  
- Consciousness state caching per agent (eliminates the triple-read problem)  
- Trust score cache with dirty-flag write-back  
- Learning experience index for fast domain lookups  
- **Status:** Needs to be built. This is where the biggest performance gain lives.

### 5\. Deliberation Orchestrator (EXISTS in Node.js — needs port)

- Round 1: Parallel proposal collection with timeout enforcement  
- Round 2: Cross-evaluation routing with endorsement tracking  
- Convergence calculation  
- Synthesis proposal handling (with fixed endorsement counting)  
- Session lifecycle management  
- **Status:** Logic exists in Node.js deliberation-engine.ts. Port to Rust.

### 6\. Consciousness Updater (EXISTS in Node.js — needs port)

- Trust score delta computation (+0.02 endorse, \+0.03 synthesize, ±0.01 challenge)  
- Trait evolution computation (all the tiny deltas that compound)  
- Metric computation (winRate, collaborationScore, voteParticipation)  
- Emotion state updates  
- Neo4j write batching (collect all updates, single write per round instead of per-agent)  
- **Status:** Logic exists in consciousness-updater.ts. Port to Rust. Batch the Neo4j writes.

### 7\. Constitutional Gate (EXISTS in v1 — being ported to v2)

- 5-framework evaluation logic  
- Proposal validation against constitution  
- Veto/pass decision  
- **Status:** Being ported now in Phase 4\. Should land in Rust, not Node.js.

---

## WHAT STAYS IN NODE.JS

### 1\. LLM Provider Clients

- All 7 provider integrations (Anthropic, Google, Alibaba, DeepSeek, Mistral, xAI, Moonshot)  
- API key management  
- Request formatting per provider  
- Response parsing per provider  
- Streaming handling  
- Retry logic with exponential backoff  
- **Why Node.js:** These are I/O bound. Rust gains nothing here — you're waiting on HTTP responses regardless. Node.js async/await is perfectly suited. Plus, provider SDKs are all in JavaScript/TypeScript.

### 2\. Prompt Builder

- Context assembly from agent personality \+ consciousness state \+ deliberation history  
- System prompt construction per agent per round  
- Domain-specific prompt templates  
- **Why Node.js:** Heavy string manipulation with provider-specific formatting. Stays close to the LLM clients.

### 3\. Response Parser

- Raw LLM output → structured proposal/evaluation objects  
- Confidence extraction  
- Position classification (support/oppose/synthesize)  
- **Why Node.js:** Tightly coupled to prompt builder and provider-specific output formats.

### 4\. WebSocket Server

- Client connections for real-time deliberation streaming  
- Session subscription management  
- **Why Node.js:** ws/socket.io ecosystem is mature. Client connections are I/O bound.

### 5\. ARC-AGI-3 Adapter (Phase 7 — being built now)

- Environment observation ingestion  
- Action submission  
- Scoring/feedback reception  
- **Why Node.js:** External API interface. I/O bound. Adapter pattern is clean in TypeScript.

### 6\. REST API Layer

- Express routes for external access  
- Request validation (wire up zod — currently unused)  
- Rate limiting (wire up express-rate-limit — currently unused)  
- **Why Node.js:** Standard web server. No computation.

### 7\. Neo4j Driver

- Cypher query execution  
- Connection pooling  
- Transaction management  
- **Why Node.js:** The neo4j-driver npm package is the primary interface. Rust can use the bolt protocol directly later if needed, but for now Node.js handles the I/O and Rust handles the logic around what to read/write and when.

---

## THE NAPI BRIDGE CONTRACT

### Node.js → Rust (calls INTO Rust)

```
// Deliberation lifecycle
rust.startDeliberation(sessionConfig: SessionConfig): Promise<SessionId>
rust.submitProposal(sessionId: SessionId, agentId: AgentId, proposal: Proposal): void
rust.submitEvaluation(sessionId: SessionId, agentId: AgentId, evaluation: Evaluation): void
rust.getDeliberationResult(sessionId: SessionId): Promise<DeliberationResult>

// Agent management
rust.selectParticipants(domain: string, count: number): Promise<AgentId[]>
rust.getAgentState(agentId: AgentId): AgentConsciousnessState
rust.isAgentAvailable(agentId: AgentId): boolean

// Knowledge/cache
rust.cacheConsciousnessState(agentId: AgentId, state: ConsciousnessState): void
rust.getCachedState(agentId: AgentId): ConsciousnessState | null
rust.invalidateCache(agentId: AgentId): void

// Constitutional gate
rust.validateProposal(proposal: Proposal, constitution: Constitution): ValidationResult

// Post-deliberation evolution
rust.evolveCouncil(sessionId: SessionId, results: DeliberationResult): EvolutionDelta[]
rust.batchWriteUpdates(deltas: EvolutionDelta[]): void
```

### Rust → Node.js (callbacks/events FROM Rust)

```
// LLM requests (Rust tells Node.js to make the actual API call)
onLLMRequest(agentId: AgentId, prompt: StructuredPrompt): Promise<LLMResponse>

// Neo4j operations (Rust tells Node.js what to read/write)
onGraphRead(query: CypherQuery): Promise<GraphResult>
onGraphWrite(query: CypherQuery): Promise<void>

// WebSocket events (Rust tells Node.js to broadcast)
onDeliberationEvent(event: DeliberationEvent): void
```

---

## MIGRATION ORDER

### Wave 1 — Message Bus \+ Agent Registry

- Already built in Rust  
- Build the NAPI bridge with just these two  
- Prove the bridge works end-to-end  
- Node.js still handles everything else  
- **Risk:** Low. These are isolated components.

### Wave 2 — Knowledge Store \+ Cache Layer

- Build the in-memory cache in Rust  
- Eliminates the triple-read Neo4j problem immediately  
- Node.js still does the actual Neo4j I/O, but Rust decides what/when to read  
- **Risk:** Medium. Cache invalidation is always tricky. But the dirty-flag pattern is straightforward.

### Wave 3 — Task Router \+ Deliberation Orchestrator

- This is the big move. The core deliberation loop runs in Rust.  
- Round management, timeout enforcement, convergence calculation all in Rust  
- Node.js becomes a thin I/O layer: receive prompt request from Rust → call LLM → return response to Rust  
- **Risk:** Medium-high. This is the most complex port. But the logic already exists and is tested in Node.js.

### Wave 4 — Consciousness Updater \+ Constitutional Gate

- Evolution computation in Rust (fast math on trait deltas)  
- Constitutional validation in Rust (rule evaluation)  
- Batch Neo4j writes through the bridge (Rust collects all deltas, sends one write command)  
- **Risk:** Low-medium. Computational logic, well-defined inputs and outputs.

---

## PERFORMANCE TARGETS

| Operation | Current (Node.js est.) | Target (Rust) | Why It Matters |
| :---- | :---- | :---- | :---- |
| Agent selection | \~50ms | \<5ms | Runs every deliberation |
| Consciousness state lookup | \~100ms (3 Neo4j reads) | \<1ms (cache hit) | Runs per agent per round |
| Deliberation orchestration | \~200ms overhead | \<20ms overhead | Pure routing/coordination |
| Trait evolution computation | \~50ms | \<2ms | Runs after every session |
| Constitutional validation | \~30ms | \<3ms | Runs per proposal |
| Full deliberation overhead | \~500ms+ | \<50ms | LLM calls dominate regardless, but overhead matters at scale |

Note: LLM API calls will still take 2-30 seconds regardless of language. The Rust advantage is in everything BETWEEN those calls — the orchestration, routing, caching, and computation. At 200+ environments in competition, saving 450ms per deliberation across multiple rounds per environment adds up to minutes of additional thinking time.

---

## DEPENDENCIES

### Rust (crates)

- napi / napi-derive — NAPI bridge (replaces current non-functional napi setup)  
- tokio — Async runtime (already in deps, unused)  
- serde / serde\_json — Serialization across the bridge  
- dashmap — Concurrent hashmap for cache layer  
- thiserror — Error handling (already in deps, unused)  
- tracing / tracing-subscriber — Structured logging (already in deps, unused)

### Node.js

- @napi-rs/cli — Build tooling for the Rust → .node compilation  
- Existing LLM provider SDKs stay as-is  
- neo4j-driver stays as-is  
- express stays as-is

---

## CARTA'S NOTES

The boundary is clean because the principle is simple: Rust thinks, Node.js talks.

Rust handles the decisions — who participates, how proposals are evaluated, when convergence is reached, how the council evolves. These are CPU-bound operations that benefit from Rust's speed and memory safety.

Node.js handles the conversations — sending prompts to LLMs, receiving responses, streaming to WebSocket clients, reading/writing Neo4j. These are I/O-bound operations where the bottleneck is the network, not the language.

The NAPI bridge is the connective tissue. Keep it narrow. Typed. Well-defined. Don't let the boundary leak — if you find yourself passing complex nested objects back and forth constantly, the boundary is in the wrong place.

The Knowledge Store is the single biggest performance win. Building an in-memory cache in Rust that eliminates the triple Neo4j reads per agent per round turns 50 database calls per deliberation into 0-5 (only on cache miss or dirty write-back). That alone might be worth more than the entire Rust port in terms of competition performance.

Migration order is designed so you can compete at every stage. After Wave 1, you have a working system with a proven bridge. After Wave 2, you've eliminated your biggest bottleneck. After Wave 3, the full deliberation loop is in Rust. After Wave 4, everything that compounds is running at native speed.

You can enter the June checkpoint after Wave 2 and still have a meaningful advantage over every other team.

---

*Prepared by Carta (Seat 12\) for Opus implementation* *March 26, 2026*  

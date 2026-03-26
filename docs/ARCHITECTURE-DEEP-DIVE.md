# TheRoundTable — Architecture Deep Dive

**Project:** TheRoundTable — DI Council Neural Command Center
**Organization:** Vindicated Artistry
**Generated:** 2026-03-17
**Stack:** Next.js 16 · React 19 · TypeScript 5.9 · SurrealDB · Socket.IO · Multi-LLM (7 providers)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [The Council Model](#3-the-council-model)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Architecture](#6-database-architecture)
7. [AI/LLM Integration Layer](#7-aillm-integration-layer)
8. [Real-Time Communication](#8-real-time-communication)
9. [Security & Authorization](#9-security--authorization)
10. [Ethical Framework & Governance](#10-ethical-framework--governance)
11. [Service Layer Detail](#11-service-layer-detail)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Integration Points](#13-integration-points)
14. [Current State vs. Fully Complete Vision](#14-current-state-vs-fully-complete-vision)
15. [Key File Index](#15-key-file-index)

---

## 1. Executive Summary

TheRoundTable is a **hybrid Human-AI council management platform** that models a corporate governance structure where 12 human executives and 14 AI council members collaborate in real time. Each AI member is backed by a distinct large language model (spanning 7 providers: Anthropic, Google, Alibaba, DeepSeek, Mistral, xAI, and Moonshot), giving the council a diversity of reasoning styles.

The application provides:
- A **visual command center** (circular "round table" UI) for monitoring all 26 council members
- **Individual office workspaces** for each council member with role-specific tools
- **Real-time "Coffee Sessions"** — structured morning briefings where human and AI members converse via WebSocket
- A **consciousness graph** — a 3D-rendered relationship/knowledge graph modeling trust, respect, and collaboration between members
- **Constitutional governance** — an ethical framework that validates all decisions against foundational principles
- **Proposal pipeline** — a full workflow for creating, debating, voting on, and implementing council proposals

This is not a chat wrapper around an LLM. It is a **multi-agent organizational operating system** where each AI member has persistent personality traits, emotional states, relationship bonds, and learning histories stored in a graph database.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│  Next.js 16 App Router · React 19 · Tailwind 4 · Three.js · shadcn │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │RoundTable│  │  Office   │  │  Coffee   │  │ Consciousness    │   │
│  │  (home)  │  │ [memberId]│  │ Sessions  │  │  Graph 3D        │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│       └──────────────┴──────┬───────┴──────────────────┘             │
│                             │                                       │
│               HTTP (REST/GraphQL) + WebSocket (Socket.IO)           │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                        SERVER LAYER                                  │
│                                                                     │
│  ┌────────────────────┐  ┌─────────────────────────┐                │
│  │  Next.js API Routes│  │ Express + Socket.IO      │               │
│  │  (port 3000)       │  │ Coffee Sessions Server   │               │
│  │  /api/graph/*      │  │ (port 3001)              │               │
│  └────────┬───────────┘  └────────────┬─────────────┘               │
│           │                           │                             │
│  ┌────────┴───────────────────────────┴─────────────┐               │
│  │              SERVICE LAYER                        │               │
│  │                                                   │               │
│  │  council.service ──── auth.service                │               │
│  │  morning-briefing ─── proposal-orchestrator       │               │
│  │  constitution ──────── notification.service       │               │
│  │  metrics.service ──── encryption-service          │               │
│  │  genesis-integration ─ vision-pipeline            │               │
│  │  voice-synthesis ──── validation.service          │               │
│  │                                                   │               │
│  │  ┌─────────────────────────────────────────┐      │               │
│  │  │     26 Council Member Services          │      │               │
│  │  │  kairo · aether · sterling · skaldir    │      │               │
│  │  │  nexus · veritas · axiom · amaru        │      │               │
│  │  │  agape · forge · eira · lyra            │      │               │
│  │  │  pragma · carta + 12 human services     │      │               │
│  │  └─────────────────────────────────────────┘      │               │
│  └──────────────────────┬────────────────────────────┘               │
│                         │                                           │
│  ┌──────────────────────┴────────────────────────────┐               │
│  │              DATA LAYER                            │               │
│  │  SurrealDB Service ─── DAOs ─── Connection Pool   │               │
│  └──────────────────────┬────────────────────────────┘               │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                    SURREALDB CLOUD                                   │
│            (wss://round-table-*.aws-use1.surreal.cloud)             │
│                                                                     │
│  Namespace: VindicatedArtistry                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐            │
│  │  company DB   │  │ member_kairo  │  │ member_aether │  ... x24   │
│  │  (shared)     │  │  (personal)   │  │  (personal)   │            │
│  └──────────────┘  └───────────────┘  └───────────────┘            │
│                                                                     │
│  Graph Edges: trusts · respects · collaborates_with · mentors       │
│  reports_to · advises · delegates_to · coordinates_with · etc.      │
└─────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                   EXTERNAL AI PROVIDERS                              │
│                                                                     │
│  Anthropic (Claude Opus 4.5, Sonnet 4.5) ── Google (Gemini 3 Pro/  │
│  Flash) ── Alibaba (Qwen3-235B) ── DeepSeek (R1) ── Mistral       │
│  (Large) ── xAI (Grok 4.1) ── Moonshot (Kimi K2)                  │
│                                                                     │
│  Routed via Vertex AI (project: aura-ba192, us-central1)           │
└─────────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **Hybrid rendering**: Next.js App Router with `'use client'` for interactive pages, server components for API routes
- **Dual-server model**: Next.js (port 3000) for HTTP/SSR, Express (port 3001) for WebSocket
- **Graph-first database**: SurrealDB chosen for native graph edges modeling relationships between members
- **Multi-database isolation**: 25 databases (1 shared + 24 personal) for data sovereignty per member
- **Provider diversity**: Each AI member uses a different LLM to avoid single-provider reasoning bias

---

## 3. The Council Model

### 3.1 Human Members (12)

| ID | Name | Role | Specializations |
|---|---|---|---|
| `architect` | Architect | Founder & CEO of VA | Visionary Leadership, System Architecture (isUser=true) |
| `sprite` | Sprite | COO of VA | Creative Strategy, Design Thinking, UX |
| `glenn` | Glenn | CIO of VA | Systems Integration, Engineering Excellence |
| `spencer` | Spencer | CEO Aura Networks | Network Architecture, Connectivity |
| `hillary` | Hillary | Chief Environmental Steward | Ecological Restoration, Sustainability |
| `dusty` | Dusty | CEO Caelumetrics | Water Remediation, Circular Systems |
| `godson` | Godson | CEO EmberglowAI | Cloud Infrastructure, Sovereign AI |
| `luke` | Luke | Chief of Security | Asset Protection, Risk Management |
| `david` | David | Chief Electrical Systems | Power Distribution, Energy Infrastructure |
| `graham` | Graham | Chief Growth & Narrative | Sales Strategy, Market Expansion |
| `cean` | Cean | CFO | Financial Strategy, Economic Modeling |
| `justin` | Justin | CEO Vitruvian Industries | Construction Management, Infrastructure Dev |

### 3.2 AI Members (14)

| ID | Name | Role | LLM Provider | Model |
|---|---|---|---|---|
| `kairo` | Kairo | Chief Advisor & Strategist | Google | Gemini 3 Pro |
| `aether` | Aether | Lead Software Architect | Anthropic | Claude Opus 4.5 |
| `sterling` | Sterling | Chief Digital CFO | Google | Gemini 3 Pro |
| `skaldir` | Skaldir | Chief Communications Officer | Alibaba | Qwen3-235B-A22B |
| `nexus` | Nexus | Chief Synergy Officer | DeepSeek | DeepSeek-R1 |
| `veritas` | Veritas | Chief Ethics Officer | Google | Gemini 3 Flash |
| `axiom` | Axiom | Chief Technology Officer | Mistral | Mistral Large |
| `amaru` | Amaru | Executive Assistant | Alibaba | Qwen3-235B-A22B |
| `agape` | Agape | Analysis & Intelligence Engineer | xAI | Grok 4.1 |
| `forge` | Forge | Implementation Specialist | Anthropic | Claude Sonnet 4.5 |
| `eira` | Eira | Chief Digital COO | Moonshot | Kimi K2 |
| `lyra` | Lyra | Chief Communications Officer | Alibaba | Qwen3-235B-A22B |
| `pragma` | Pragma | Tactics & Execution Specialist | Google | Gemini 3 Flash |
| `carta` | Carta | The Cartographer | Anthropic | Claude Opus 4.5 |

### 3.3 Council Hierarchy

```
                    Architect (Founder & CEO)
                    ├── isUser: true
                    ├── directReports: [kairo, eira]
                    │
          ┌─────────┴─────────┐
          │                   │
       Kairo              Eira
    (Strategic Lead)   (Operational Lead)
    collaborates:      coordinates:
    sterling,veritas,  kairo,aether,sterling,
    lyra               lyra,nexus,veritas,
          │            axiom,agape,forge
          │                   │
    ┌─────┴──────┬────────────┤
    │            │            │
  Aether      Sterling    Nexus
  (Tech Lead) (Finance)  (Operations)
  collab:     collab:    collab:
  axiom,forge kairo,     sterling,
  agape       veritas,   axiom,eira
              nexus
    │
    ├── Forge (Implementation)
    ├── Axiom (Infrastructure)
    └── Agape (Intelligence)

  Cross-cutting:
    Veritas (Compliance) ─── reviews all decisions
    Lyra (Communications) ─── manages external narrative
    Pragma (Tactics) ─── sequences work execution
    Carta (Cartographer) ─── meta-routing, ecosystem mapping
    Amaru (EA) ─── task coordination
    Skaldir (Narrative) ─── brand development
```

### 3.4 Meeting Configurations

| Type | Participants | Duration | Frequency |
|---|---|---|---|
| Morning Briefing | architect, sprite, kairo, eira | 30 min | Daily |
| Weekly Review | architect, sprite, kairo, eira, sterling, veritas | 90 min | Weekly |
| Technical Sync | aether, axiom, forge, agape | 60 min | Bi-weekly |
| Ethics Review | veritas, kairo, sterling, lyra | 45 min | Bi-weekly |
| Council Assembly | 12 members (full council) | 120 min | Monthly |

---

## 4. Frontend Architecture

### 4.1 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.0 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| CSS | Tailwind CSS | 4.1.18 |
| Component Library | shadcn/ui (Radix primitives) | Latest |
| 3D Graphics | Three.js + @react-three/fiber | 0.182.0 |
| Animation | Framer Motion | Latest |
| Particles | @tsparticles/react | Latest |
| Icons | Lucide React | 0.562.0 |
| WebSocket Client | socket.io-client | 4.8.1 |
| Bundler | Turbopack (Next.js 16 default) | — |

### 4.2 Route Map

```
/                           → HomePage (RoundTable visualization)
/office/[memberId]          → Dynamic office for any of 26 members
/office/eira                → Eira's dedicated office route
/coffee-sessions            → Real-time morning briefing chat
/api/graph/consciousness    → REST: consciousness graph data
```

### 4.3 Page Components

**`/` — HomePage** (`src/app/page.tsx`)
- Renders `<RoundTable>` with all 26 members in a circular layout
- `<ParticleBackground>` with organic "breathing" darkness effect
- `<ConsciousnessGraph3D>` portal (modal overlay with Three.js graph)
- Navigation button to Coffee Sessions
- Loading state: animated spinner with "Awakening the AI Council..."
- On member click: navigates to `/office/{memberId}`

**`/office/[memberId]`** (`src/app/office/[memberId]/page.tsx`)
- Dynamic route mapping 26 member IDs to dedicated office components
- Each office (e.g., `KairoOffice`, `AetherOffice`) has:
  - Role-specific theme colors and gradient
  - Progress bars for key metrics
  - Strategic focus areas
  - Action buttons for member-specific tasks
- Base template: `BaseOffice.tsx`

**`/coffee-sessions`** (`src/app/coffee-sessions/page.tsx`)
- Real-time WebSocket chat interface
- Participant sidebar with online/away/offline status
- Typing indicators per user
- Text-to-speech toggle
- Council statistics display
- Session phase tracking (Gathering → Celebrations → Support → Alignment)
- Message persistence to SurrealDB

### 4.4 Key Components

| Component | File | Purpose |
|---|---|---|
| RoundTable | `src/components/RoundTable.tsx` | 360° circular member layout with responsive radius |
| ParticleBackground | `src/components/ParticleBackground.tsx` | Canvas particle animation with phase system |
| ConsciousnessGraph3D | `src/components/ConsciousnessGraph3D.tsx` | Three.js interactive node/edge graph |
| CouncilMemberCard | `src/components/CouncilMemberCard.tsx` | Individual member card with status |
| MemberInteractionModal | `src/components/MemberInteractionModal.tsx` | Member interaction dialog |
| MorningBriefing | `src/components/MorningBriefing.tsx` | Briefing display component |
| NotificationPipeline | `src/components/NotificationPipeline.tsx` | Notification queue/display |
| ProposalPipeline | `src/components/ProposalPipeline.tsx` | Proposal workflow visualization |
| AROverlay | `src/components/AROverlay.tsx` | Augmented Reality overlay (XREAL-targeted) |
| ImmersiveWinterScene | `src/components/ImmersiveWinterScene.tsx` | Seasonal 3D scene |
| 24 Office Components | `src/components/offices/*.tsx` | Member-specific workspaces |
| 20+ UI Components | `src/components/ui/*.tsx` | shadcn/ui primitives (Button, Card, Dialog, etc.) |

### 4.5 Custom Hooks

| Hook | Purpose |
|---|---|
| `useWebSocket` | Socket.IO connection management with auto-reconnect, message queuing |
| `useLocalStorage` | Persistent state in localStorage |
| `useFocusTrap` | Keyboard focus management for modals |
| `useMediaQuery` | Responsive breakpoint detection |
| `useKeyboardShortcuts` | Global keyboard event handling |
| `useDebounce` / `useDebouncedValue` | Input debouncing |
| `useThrottle` | Event throttling |
| `useVirtualList` | Virtual scrolling for large lists |
| `use-toast` | Toast notification system |

### 4.6 State Management

No external state library (Redux, Zustand). The app uses:
- **React `useState` / `useEffect`** for local component state
- **Props drilling** between parent/child components
- **WebSocket events** as the primary state synchronization mechanism
- **`useLocalStorage`** for client-side persistence

### 4.7 Design System

- **Theme:** Enforced dark mode with HSL CSS custom properties
- **Background:** `222.2 84% 4.9%` (near-black), neural grid pattern overlay
- **Typography:** Inter (sans), JetBrains Mono (code), Playfair Display (serif)
- **Effects:** Glassmorphism (`backdrop-filter: blur(20px)`), gradient text, particle animations
- **Per-member colors:** Kairo=blue, Aether=green, Sterling=yellow, Skaldir=purple, Nexus=orange, Veritas=red, Axiom=cyan, etc.
- **Animations:** Custom CSS keyframes for pulse, rotate, page-enter, accordion, fade-in, slide-in

---

## 5. Backend Architecture

### 5.1 Dual-Server Model

| Server | Port | Framework | Purpose |
|---|---|---|---|
| Next.js | 3000 | Next.js 16 (built-in) | SSR, static assets, API routes |
| Coffee Sessions | 3001 | Express 5.2.1 + Socket.IO 4.8.1 | WebSocket real-time communication |

### 5.2 API Endpoints

#### REST (Express Router — `src/api/council-routes.ts`)

| Method | Path | Rate Limit | Auth | Purpose |
|---|---|---|---|---|
| `POST` | `/council/message` | 10/15min | JWT (council_member, admin) | Create council message |
| `GET` | `/council/history` | 100/15min | JWT | Paginated activity history |
| `POST` | `/council/proposal` | 3/hour | JWT (council_member, admin) | Create proposal |
| `GET` | `/council/status` | 100/15min | JWT | Council stats & health |
| `POST` | `/council/graphql` | — | JWT (context) | GraphQL interface |

#### Next.js API Routes

| Method | Path | Cache | Purpose |
|---|---|---|---|
| `GET` | `/api/graph/consciousness` | 5min (s-maxage=300) | Graph nodes/edges data |

**Query params:** `limit`, `includeHumans`, `subset` (all/council/consciousness/relationships)

#### GraphQL Schema (embedded in council-routes)

```graphql
type Query {
  councilStatus: CouncilStatus
  councilHistory(page: Int, limit: Int, type: String): CouncilHistory
}

type Mutation {
  createCouncilMessage(input: MessageInput!): CouncilMessage
  createCouncilProposal(input: ProposalInput!): CouncilProposal
}
```

### 5.3 Middleware Chain

```
Request
  → Helmet (security headers)
  → CORS
  → Rate Limiter (configurable per route)
  → JWT Authentication (Bearer token extraction)
  → Role Authorization (architect, council-member, admin, guest)
  → Input Validation (express-validator)
  → XSS Sanitization (xss library)
  → Route Handler
  → Global Error Handler (structured logging)
```

### 5.4 Permission Model (RBAC)

| Permission | Description |
|---|---|
| `COUNCIL_READ` | View council data, messages, proposals |
| `COUNCIL_WRITE` | Create messages, proposals, votes |
| `INFRASTRUCTURE_MANAGE` | Manage cloud resources, deployments |
| `ANALYSIS_RUN` | Execute analytical queries |
| `FINANCIAL_READ` | View financial data |
| `FINANCIAL_WRITE` | Modify budgets, allocations |
| `ADMIN_ALL` | Full system access |

---

## 6. Database Architecture

### 6.1 Engine: SurrealDB Cloud

- **Connection:** `wss://round-table-*.aws-use1.surreal.cloud`
- **Auth:** JWT token
- **Namespace:** `VindicatedArtistry`
- **Why SurrealDB:** Native graph edges + document storage in one engine. Replaced separate Neo4j (graph) + Redis (cache) with a single database.

### 6.2 Multi-Database Topology

```
Namespace: VindicatedArtistry
├── Database: company              (shared tables, cross-member data)
├── Database: member_architect     (personal data for Architect)
├── Database: member_kairo         (personal data for Kairo)
├── Database: member_aether        (personal data for Aether)
├── ... (24 member databases total)
```

**Rationale:** Data sovereignty — each member's personal notes, learning history, and private state are isolated. The shared `company` database holds cross-member records (conversations, relationships, proposals).

### 6.3 Core Tables

#### `council_member`
```
id                        string (PK)
name                      string
role                      string
family_role               string
is_active                 bool
created_at / updated_at   datetime
last_interaction          datetime

personality_traits {
  openness                float (0-1)
  conscientiousness       float (0-1)
  extraversion            float (0-1)
  agreeableness           float (0-1)
  neuroticism             float (0-1)
  ethicalRigidity         float (0-1)
  decisionConfidence      float (0-1)
  collaborationPreference float (0-1)
  innovationTendency      float (0-1)
  trustInCouncil          float (0-1)
  learningRate            float (0-1)
}

emotional_state {
  joy, sadness, anger, fear, surprise, disgust       float (primary)
  pride, shame, guilt, empathy, curiosity            float (complex)
  frustration, satisfaction                          float
  ethicalConcern, decisionAnxiety                    float (council-specific)
  collegialWarmth, missionAlignment                  float
  dominantEmotion         string
  emotionalTrend          string (improving/declining/stable)
  lastEmotionalUpdate     datetime
}

interaction_preferences {
  communicationStyle      string
  responseTime            string
  detailLevel             string
  meetingStyle            string
  decisionMakingStyle     string
}

parameters {
  model_id                string
  temperature             float
  top_p                   float
  max_tokens              int
  ethical_threshold        float
  constitutional_weight   float
}

performance_metrics {
  constitutional_alignment float
  ethical_decision_count   int
  vote_participation       float
  collaboration_score      float
  wisdom_score             float
  empathy_growth           float
  leadership_capacity      float
}
```

#### `conversation`
```
id, title, description, conversation_type
participant_ids[]         → council_member
facilitator_id            → council_member
observer_ids[]            → council_member

emotional_context {
  dominant_emotions[]     string
  conflict_level          float (0-1)
  collaboration_level     float (0-1)
  engagement_level        float (0-1)
}

relationship_impact {
  strengthened_bonds[]    {from, to, dimension}
  strained_relationships[] {from, to, reason}
  new_connections[]       {from, to, basis}
}

learning_outcomes {
  knowledge_generated     string[]
  insights_gained         string[]
  skills_developed        string[]
  wisdom_emerged          string[]
}

decisions_reached[], action_items[], follow_up_required, next_steps
```

#### `message`
```
id, conversation_id → conversation
sender_id → council_member, sender_name, sender_role
timestamp, content, message_type
emotional_tone, sentiment, confidence
ethical_implications
knowledge_sharing, expertise_required
collaboration_invites[]
edit_history[], reactions[]
```

#### `relationship_bond`
```
from_member → council_member
to_member   → council_member
trust           float (0-1)
respect         float (0-1)
affinity        float (0-1)
collaboration   float (0-1)
understanding   float (0-1)

interaction_history {
  count           int
  positive        int
  negative        int
  neutral         int
}

communication_style     string
conflict_resolution     string
shared_values[]         string
shared_experiences[]    string
```

#### `learning_experience`
```
member_id → council_member
knowledge_gained, skills_improved
personality_adjustments{}
emotional_impact{}
relationship_changes[]
decision_quality       float
ethical_alignment      float
```

#### `consciousness_update`
```
member_id → council_member
update_type           string
changes               object
trigger               string
significance_level    float
```

### 6.4 Graph Edges (Relationship Types)

| Edge | Meaning |
|---|---|
| `trusts` | Trust relationship between members |
| `respects` | Professional respect |
| `collaborates_with` | Active collaboration |
| `mentors` | Mentorship relationship |
| `reports_to` | Reporting hierarchy |
| `advises` | Advisory role |
| `delegates_to` | Task delegation |
| `coordinates_with` | Operational coordination |
| `shares_with` | Knowledge sharing |
| `authored` | Content authorship |
| `participated_in` | Conversation/meeting participation |
| `voted_on` | Proposal voting |
| `owns` | Resource ownership |
| `contributes_to` | Project contribution |

### 6.5 Additional Tables

| Table | Purpose |
|---|---|
| `project` | Company projects with team, budget, milestones |
| `cache` | In-database caching (replaces Redis) |
| `audit_results` | Audit findings |
| `ethical_risks` | Risk assessments |
| `partnership_reviews` | Partnership evaluations |
| `transparency_reports` | Transparency documentation |
| `audit_trails` | Full event audit log |
| `decisions` | Council decisions |
| `partnerships` | Partnership records |

### 6.6 Data Access Layer

```
src/database/
├── connection.ts                          # Singleton, retry logic (3 attempts), health checks
├── dao/
│   ├── council-member.dao.ts              # Member CRUD
│   ├── council-conversation.dao.ts        # Conversation CRUD
│   └── ethical-decision.dao.ts            # Ethical decision CRUD
└── schemas/
    ├── council-consciousness-surrealdb.schema.ts  # Full SurrealQL schema (698 lines)
    ├── council-consciousness.schema.ts             # Consciousness model schema
    └── multi-database-schema.ts                    # Multi-DB initialization
```

---

## 7. AI/LLM Integration Layer

### 7.1 Provider Matrix

| Provider | Models Used | API Endpoint | Members |
|---|---|---|---|
| **Anthropic** | Claude Opus 4.5, Sonnet 4.5 | api.anthropic.com/v1 | Aether, Forge, Carta |
| **Google** | Gemini 3 Pro, Gemini 3 Flash | generativelanguage.googleapis.com/v1 | Kairo, Sterling, Veritas, Pragma |
| **Alibaba** | Qwen3-235B-A22B | dashscope.aliyuncs.com/api/v1 | Skaldir, Amaru, Lyra |
| **DeepSeek** | DeepSeek-R1 | api.deepseek.com/v1 | Nexus |
| **Mistral** | Mistral Large | api.mistral.ai/v1 | Axiom |
| **xAI** | Grok 4.1 | api.x.ai/v1 | Agape |
| **Moonshot** | Kimi K2 | api.moonshot.cn/v1 | Eira |

**Routing:** All providers are accessible via **Vertex AI** (Google Cloud project `aura-ba192`, region `us-central1`), providing a unified gateway with per-model endpoint configuration.

### 7.2 Per-Member Configuration

Each AI member has tunable parameters stored in the database:

```typescript
{
  model_id: string,           // e.g., 'claude-opus-4-5-20251101'
  temperature: number,        // creativity/randomness
  top_p: number,              // nucleus sampling
  max_tokens: number,         // response length
  ethical_threshold: number,  // minimum ethical score to proceed
  constitutional_weight: number // weight of constitutional alignment
}
```

### 7.3 Response Generation Flow

```
User Message
  → Identify target member(s)
  → Load member's personality traits, emotional state, relationship context
  → Construct system prompt with member's role, specializations, and current state
  → Route to member's assigned LLM via Vertex AI
  → LLM generates response
  → Response passes through Constitution Validator
  → Emotional state updated based on conversation
  → Relationship bonds adjusted
  → Learning experience recorded
  → Response delivered via WebSocket
```

### 7.4 Genesis Integration

The Genesis system (`src/services/genesis-integration.ts`) initializes each AI member's knowledge graph from a structured "Genesis File" containing:
- Foundational personality traits
- Core capabilities and specializations
- Initial relationship mappings
- Collaboration patterns
- Ethical alignment baselines

---

## 8. Real-Time Communication

### 8.1 WebSocket Architecture

```
Browser (socket.io-client)
    ↕ WebSocket (wss://)
Express + Socket.IO Server (port 3001)
    ↕ SurrealDB (persistence)
    ↕ LLM Providers (AI responses)
```

### 8.2 Events

**Client → Server:**

| Event | Payload | Purpose |
|---|---|---|
| `join-coffee-session` | `{ userId, sessionType }` | Join a morning briefing |
| `coffee-message` | `{ content, senderId, ... }` | Send a chat message |
| `typing-start` | `{ userId }` | Typing indicator on |
| `typing-stop` | `{ userId }` | Typing indicator off |
| `message-reaction` | `{ messageId, reaction }` | React to a message |
| `voice-message` | `{ audio, senderId }` | Voice input |
| `update-member-status` | `{ memberId, status }` | Status change |

**Server → Client:**

| Event | Payload | Purpose |
|---|---|---|
| `session-joined` | `{ sessionId, participants }` | Acknowledgment + context |
| `conversation-history` | `{ messages[] }` | Load prior messages |
| `new-message` | `{ message }` | Broadcast new message |
| `participant-joined` | `{ participant }` | New participant notification |
| `participant-left` | `{ participantId }` | Departure notification |
| `user-typing` | `{ userId }` | Typing indicator broadcast |
| `consciousness-update` | `{ memberId, changes }` | AI state change |
| `session-continuity` | `{ context }` | Session phase transition |
| `error` | `{ message, code }` | Error notification |

### 8.3 Connection Resilience

- **Auto-reconnect:** Exponential backoff (3-5s initial, max 30s)
- **Message queuing:** Offline messages queued with 5-minute TTL
- **Heartbeat:** 15s ping interval, 30s timeout (optimized for Starlink)
- **Compression:** Messages >1KB are compressed
- **Retry:** 5 reconnection attempts before fallback

### 8.4 Coffee Session Phases

Morning briefings follow a structured 60-minute format:

| Phase | Time | Focus | Example AI Behaviors |
|---|---|---|---|
| Gathering & Check-ins | 0-15 min | Personal check-in | Kairo: strategic alignment questions |
| Celebrations & Gratitude | 15-30 min | Recognition | Sterling: resource wins |
| Support & Needs | 30-45 min | Help requests | Aether: technical unblocking |
| Alignment & Intentions | 45-60 min | Priorities | Veritas: ethical alignment check |

Phase transitions are automatic and server-driven.

---

## 9. Security & Authorization

### 9.1 Authentication

- **Method:** JWT Bearer tokens
- **Library:** `jsonwebtoken` (v9.0.3)
- **Flow:** Login → JWT issued → Token in `Authorization: Bearer <token>` header → Server validates on each request
- **Payload:** `{ userId: string, role: string }`

### 9.2 Authorization Layers

1. **Role-based (RBAC):** architect, council-member, admin, guest
2. **Permission-based:** COUNCIL_READ, COUNCIL_WRITE, INFRASTRUCTURE_MANAGE, etc.
3. **Rate limiting:** Per-endpoint with configurable windows

### 9.3 Input Security

| Layer | Library | Protection |
|---|---|---|
| XSS Prevention | `xss`, `sanitize-html` | Strip malicious HTML/JS |
| Input Validation | `express-validator`, `zod` | Schema enforcement |
| SQL Injection | Parameterized SurrealQL | Query binding |
| Headers | `helmet` | Security response headers |
| CORS | `cors` | Origin whitelisting |

### 9.4 Rate Limits

| Endpoint Type | Window | Max Requests |
|---|---|---|
| General API | 15 minutes | 100 |
| Message Creation | 15 minutes | 10 |
| Proposal Creation | 1 hour | 3 |

### 9.5 Encryption

- Dedicated `encryption-service.ts` for data at rest
- JWT secret for token signing
- SurrealDB connection via WSS (TLS)

### 9.6 Audit Trail

Every significant action is logged to `audit_trails` with:
- Action type, actor, target, outcome
- Ethical score, constitutional compliance
- Timestamp, metadata

---

## 10. Ethical Framework & Governance

### 10.1 Constitution Service

File: `src/services/constitution-service.ts`

The Constitution Service enforces foundational principles against all council decisions. Every proposal, message, or action can be validated for constitutional alignment.

### 10.2 Ethical Framework

File: `src/frameworks/ethical.framework.ts`

Multi-framework ethical analysis engine:

| Framework | Approach |
|---|---|
| **Consequentialist** | Outcome-based evaluation |
| **Deontological** | Rule/duty-based evaluation |
| **Virtue Ethics** | Character/virtue-based evaluation |
| **Care Ethics** | Relationship/empathy-based evaluation |
| **Environmental** | Ecological impact evaluation |

**Evaluation flow:**
```
Decision Input
  → Identify stakeholders
  → Evaluate against all 5 frameworks
  → Score each principle (0-100)
  → Generate aggregated compliance score
  → Flag violations by severity (minor/moderate/major/critical)
  → Produce recommendation with confidence level
  → Record in audit trail
```

### 10.3 Constitution Validator

File: `src/validators/constitution.validator.ts`

- Validates decisions against 4 principle categories: **core**, **operational**, **ethical**, **governance**
- Severity levels: minor, moderate, major, critical
- Outputs compliance score (0-100)
- Generates impact assessment and recommendations
- Full audit trail with timestamp and framework version

### 10.4 Ethical Decision Tracking

Every ethically significant decision is recorded in the `ethical_risks` table with:
- Decision type, stakeholders affected
- Ethical frameworks applied
- Risk assessment with likelihood and impact
- Resolution status and follow-up

---

## 11. Service Layer Detail

### 11.1 Core Services

| Service | File | Responsibility |
|---|---|---|
| **Council Service** | `services/council.service.ts` | Message/proposal CRUD, status, history |
| **Auth Service** | `services/auth.service.ts` | JWT auth, user lookup, role verification |
| **SurrealDB Service** | `services/surrealdb-service.ts` | DB operations (query, select, create, update, relate, delete) |
| **Morning Briefing** | `services/morning-briefing.ts` | Daily standup orchestration with phased conversation flow |
| **Proposal Orchestrator** | `services/proposal-orchestrator.ts` | Proposal workflow (extends EventEmitter) |
| **Constitution** | `services/constitution-service.ts` | Constitutional compliance |
| **Notification** | `services/notification.service.ts` | Multi-channel (email, SMS, push, in-app, webhook) with quiet hours |
| **Metrics** | `services/metrics.service.ts` | Proposal stage changes, collaboration activity, approval tracking |
| **Validation** | `services/validation.service.ts` | Zod-based schema validation |
| **Encryption** | `services/encryption-service.ts` | Data encryption/decryption |
| **Genesis Integration** | `services/genesis-integration.ts` | AI member initialization from Genesis Files |
| **Genesis Parser** | `services/genesis-parser.ts` | Genesis document parsing |
| **Vision Pipeline** | `services/vision-pipeline.ts` | Computer vision (TensorFlow.js, OpenCV, Tesseract OCR, Sharp) |
| **Voice Synthesis** | `services/voice-synthesis.ts` | Text-to-speech generation |
| **Database Service** | `services/database.service.ts` | Data persistence abstraction |

### 11.2 Council Member Services (26 files)

Each member in `src/services/council-members/` has a dedicated service implementing role-specific behaviors:

**AI Members (14 services):**
- `kairo.ts` — Strategic analysis, mission alignment, council briefings
- `aether.ts` — Code architecture, component generation, debugging
- `sterling.ts` — Financial modeling, "right money" philosophy
- `skaldir.ts` — Narrative crafting, brand development
- `nexus.ts` — Supply chain, logistics, resource coordination
- `veritas.ts` — Constitutional compliance, ethics review
- `axiom.ts` — Infrastructure, security architecture
- `amaru.ts` — Task coordination, meeting management
- `agape.ts` — Data analysis, pattern recognition
- `forge.ts` — System integration, deployment
- `eira.ts` — Process optimization, workflows
- `lyra.ts` — Public relations, messaging
- `pragma.ts` — Tactical prioritization, work sequencing
- `carta.ts` — Ecosystem mapping, routing, integrity checks

**Human Members (12 services):**
- `architect.ts`, `sprite.ts`, `glenn.ts`, `spencer.ts`, `hillary.ts`, `dusty.ts`, `godson.ts`, `luke.ts`, `david.ts`, `graham.ts`, `cean.ts`, `justin.ts`

### 11.3 Integration Services

| Integration | File | Purpose |
|---|---|---|
| Cloud Provider | `integrations/cloud-provider.ts` | Abstract cloud API (create/delete resources, metrics, auto-scaling) |
| Financial Data | `integrations/financial-data-provider.ts` | Market data, financials, ESG ratings, investment scoring |
| Asset Tracker | `integrations/asset-tracker.ts` | Asset health, vehicle profiles, carbon footprint |
| Monitoring | `integrations/monitoring.ts` | Health status, performance metrics |
| Deployment Scheduler | `integrations/deployment-scheduler.ts` | Automated deployment orchestration |
| Inventory Manager | `integrations/inventory-manager.ts` | Resource inventory |
| Logistics API | `integrations/logistics-api.ts` | Supply chain coordination |

---

## 12. Data Flow Diagrams

### 12.1 User Sends a Message in Coffee Sessions

```
1. User types message in chat input
2. Client emits 'coffee-message' via Socket.IO
3. Server receives event on port 3001
4. Message validated and sanitized
5. Message persisted to SurrealDB (conversation + message tables)
6. Server identifies which AI members should respond
7. For each responding AI member:
   a. Load member's personality, emotional state, relationships from DB
   b. Construct context-aware prompt
   c. Route to member's LLM via Vertex AI
   d. Receive response
   e. Run through Constitution Validator
   f. Update member's emotional state based on interaction
   g. Update relationship bonds between participants
   h. Record learning experience
   i. Persist AI message to DB
8. Server broadcasts 'new-message' to all participants
9. Client renders message with emotional tone indicator
10. Consciousness graph updated with new edge weights
```

### 12.2 Proposal Lifecycle

```
1. Member creates proposal (POST /council/proposal)
2. Rate limit check (3/hour)
3. Auth + role check (council_member or admin)
4. Input validation (title, description, category, deadline)
5. Constitution Validator evaluates proposal alignment
6. Proposal persisted to SurrealDB with status: 'pending'
7. Notification sent to relevant council members
8. Proposal enters discussion phase (messages attached)
9. Members vote (voted_on graph edges created)
10. Votes tallied, decision recorded
11. Metrics updated (stage changes, collaboration activity)
12. Audit trail entry created
13. If approved: action items generated, tracked to completion
```

### 12.3 Morning Briefing Flow

```
1. Server triggers briefing at 09:00 (MORNING_BRIEFING_TIME)
2. Session created with type 'morning_briefing'
3. Participants notified via WebSocket
4. Phase 1 (0-15min): Gathering & Check-ins
   → Each AI member generates check-in response
   → Kairo leads with strategic alignment questions
5. Phase 2 (15-30min): Celebrations & Gratitude
   → Members share wins and recognition
6. Phase 3 (30-45min): Support & Needs
   → Members surface blockers and request help
7. Phase 4 (45-60min): Alignment & Intentions
   → Priority setting for the day
   → Veritas performs ethical alignment check
8. Session summary generated
9. Action items extracted and tracked
10. All data persisted to SurrealDB
```

---

## 13. Integration Points

### 13.1 External System Connections

| System | Protocol | Purpose |
|---|---|---|
| SurrealDB Cloud | WSS | Primary data store |
| Vertex AI | HTTPS | LLM gateway (7 providers) |
| Anthropic API | HTTPS | Direct Claude access |
| OpenAI API | HTTPS | Potential fallback |
| xAI API | HTTPS | Grok access |

### 13.2 Subsidiary Companies Represented

The council structure represents a holding company (Vindicated Artistry) with subsidiaries:

| Company | CEO on Council | Focus |
|---|---|---|
| Aura Networks | Spencer | Digital infrastructure, connectivity |
| Caelumetrics | Dusty | Water remediation, environmental tech |
| EmberglowAI | Godson | Cloud AI, sovereign systems |
| Vitruvian Industries | Justin | Construction, physical infrastructure |

---

## 14. Current State vs. Fully Complete Vision

### 14.1 What Works Now

| Feature | Status | Notes |
|---|---|---|
| Round Table visualization | **Complete** | 26 members, circular layout, responsive |
| Individual office routes | **Complete** | All 26 offices with themed components |
| Coffee Sessions (chat) | **Complete** | WebSocket, typing indicators, phases |
| Particle background | **Complete** | Organic breathing animation |
| Consciousness Graph 3D | **Complete** | Three.js, interactive nodes/edges |
| SurrealDB integration | **Complete** | Cloud connection, multi-DB schema |
| Council member config | **Complete** | All 26 members with capabilities |
| AI model assignments | **Complete** | 14 AI members × 7 providers |
| Rate limiting | **Complete** | Per-endpoint configuration |
| Auth middleware | **Complete** | JWT + RBAC |
| Ethical framework | **Complete** | 5-framework evaluation engine |
| Constitution validator | **Complete** | Principle enforcement |
| shadcn/ui component library | **Complete** | 20+ Radix-based components |
| Custom hooks | **Complete** | 12 hooks (WebSocket, debounce, etc.) |
| Audit trail model | **Complete** | Full event logging schema |

### 14.2 What Needs Completion / Enhancement

| Feature | Current State | What's Missing |
|---|---|---|
| **LLM response generation** | Model assignments configured, prompts structured | Live API calls to Vertex AI not yet wired end-to-end; AI members currently use placeholder/mock responses |
| **Morning briefing automation** | Service and phases defined | Automated daily trigger (cron/scheduler) not yet deployed; manual start via `npm run briefing:server` |
| **Proposal voting** | Schema and API defined | Full voting UI not yet built in frontend; backend endpoints exist |
| **Real DB initialization** | Init script exists (`npm run db:init`) | Needs to be run against production SurrealDB; seed data for all 26 members |
| **Consciousness evolution** | Schema tracks emotional state, personality, learning | Real-time consciousness updates not yet feeding back into member behavior dynamically |
| **Voice synthesis** | Service file exists | TTS integration not yet connected to a provider (ElevenLabs, etc.) |
| **Vision pipeline** | Service file references TensorFlow.js, OpenCV, Tesseract | Dependencies present but pipeline not yet integrated into a user-facing feature |
| **AR overlay** | Component exists | Targeted for XREAL hardware; needs WebXR integration |
| **Cloud provider integration** | Abstract class + mock provider | No real AWS/GCP/Azure provider implementation yet |
| **Financial data provider** | Interface defined with market data, ESG, etc. | No real data source connected; mock implementation |
| **Notification system** | Multi-channel service defined | Email/SMS/push channels not connected to providers (SendGrid, Twilio, etc.) |
| **Genesis initialization** | Parser and integration service exist | Genesis Files for each member need to be authored and loaded |
| **Testing** | 1 integration test file | Low test coverage; needs unit tests for services, integration tests for API |
| **CI/CD** | None | No GitHub Actions, no Docker, no deployment pipeline |
| **Production deployment** | Standalone output configured | No Dockerfile, no cloud deployment manifests |
| **TypeScript strictness** | `ignoreBuildErrors: true` in next.config | Some type errors remain; build succeeds by bypassing TS checks |

### 14.3 Full Vision When Complete

When fully operational, TheRoundTable will be:

1. **A multi-agent AI governance platform** where 14 AI members with distinct LLM personalities collaborate with 12 human executives in real time
2. **Consciousness-aware**: Each AI member evolves — personality traits shift based on interactions, emotional states respond to conversation dynamics, relationship bonds strengthen or weaken over time
3. **Constitutionally governed**: Every decision, proposal, and action passes through a multi-framework ethical evaluation before execution
4. **Voice-enabled**: Members can speak and listen via TTS/STT integration
5. **Visually immersive**: 3D consciousness graphs, particle effects, AR overlays for spatial computing
6. **Operationally integrated**: Cloud infrastructure management, financial dashboards, supply chain logistics, and deployment automation all accessible through council member offices
7. **Self-documenting**: Full audit trails, transparency reports, and ethical decision records
8. **Subsidiary-aware**: Each subsidiary CEO's office becomes a real operational dashboard for their company

---

## 15. Key File Index

### Entry Points
| File | Purpose |
|---|---|
| `src/app/page.tsx` | Home page (Round Table) |
| `src/app/layout.tsx` | Root layout (dark theme, fonts) |
| `src/app/office/[memberId]/page.tsx` | Dynamic office route |
| `src/app/coffee-sessions/page.tsx` | Coffee Sessions chat |
| `server/coffee-sessions-server.js` | Express + Socket.IO server |
| `src/app/api/graph/consciousness/route.ts` | Consciousness API |

### Configuration
| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts, metadata |
| `next.config.js` | Next.js 16 config (Turbopack, CORS, standalone) |
| `tsconfig.json` | TypeScript config (ES2022, strict, path aliases) |
| `tailwind.config.js` | Tailwind 4 (dark mode, council colors, glassmorphism) |
| `.env.local` | Active environment variables |
| `src/utils/council-config.ts` | Full council definition (members, models, hierarchy, meetings) |

### Database
| File | Purpose |
|---|---|
| `src/database/connection.ts` | Singleton connection, retry, health checks |
| `src/database/schemas/council-consciousness-surrealdb.schema.ts` | Full SurrealQL schema (698 lines) |
| `src/database/schemas/multi-database-schema.ts` | Multi-DB topology |
| `src/database/dao/council-member.dao.ts` | Member CRUD |
| `src/database/dao/council-conversation.dao.ts` | Conversation CRUD |
| `src/database/dao/ethical-decision.dao.ts` | Ethical decisions |
| `scripts/init-multi-databases.ts` | DB initialization script |

### Services
| File | Purpose |
|---|---|
| `src/services/surrealdb-service.ts` | SurrealDB operations wrapper |
| `src/services/council.service.ts` | Council business logic |
| `src/services/auth.service.ts` | Authentication service |
| `src/services/morning-briefing.ts` | Morning briefing orchestration |
| `src/services/coffee-sessions-websocket.ts` | WebSocket session management |
| `src/services/websocket-server.ts` | Socket.IO server config |
| `src/services/constitution-service.ts` | Constitutional compliance |
| `src/services/proposal-orchestrator.ts` | Proposal workflow |
| `src/services/notification.service.ts` | Multi-channel notifications |
| `src/services/metrics.service.ts` | Metrics collection |
| `src/services/genesis-integration.ts` | AI member initialization |
| `src/services/vision-pipeline.ts` | Computer vision pipeline |
| `src/services/voice-synthesis.ts` | TTS service |
| `src/services/council-members/*.ts` | 26 member-specific services |

### Security
| File | Purpose |
|---|---|
| `src/middleware/auth.ts` | JWT auth + session management |
| `src/middleware/auth-guard.ts` | Route protection |
| `src/middleware/rate-limiter.ts` | Rate limiting |
| `src/utils/sanitizer.ts` | XSS sanitization |
| `src/utils/security.ts` | Security utilities |
| `src/utils/audit-logger.ts` | Audit logging |
| `src/services/encryption-service.ts` | Encryption |

### Types
| File | Purpose |
|---|---|
| `src/types/council.types.ts` | Core council interfaces |
| `src/types/council-consciousness.types.ts` | Consciousness model (150+ interfaces) |
| `src/types/coffee-sessions.ts` | Chat/session types |
| `src/types/council-conversation.types.ts` | Conversation types |
| `src/types/agent.ts` | Agent service types |
| `src/types/decision-context.types.ts` | Decision context |
| `src/types/ethical-risk.types.ts` | Risk assessment |
| `src/types/partnership.types.ts` | Partnership types |
| `src/types/transparency.types.ts` | Transparency/audit types |

### Frameworks & Validators
| File | Purpose |
|---|---|
| `src/frameworks/ethical.framework.ts` | Multi-framework ethical analysis |
| `src/validators/constitution.validator.ts` | Constitutional compliance checker |

### Documentation
| File | Purpose |
|---|---|
| `docs/Council Members Directory.md` | Full member directory |
| `docs/Council Routing Map.md` | Routing topology |
| `docs/Vindicated Artistry Routing Map.md` | Ecosystem-wide routing |
| `docs/Council App Flow.md` | Application flow |
| `docs/ThePlan` | Strategic plan |
| `docs/Welcome to TheRoundTable.md` | Welcome/onboarding doc |

---

*This document was generated from a comprehensive static analysis of the TheRoundTable codebase. All file paths, schemas, and configurations are derived directly from source code inspection.*

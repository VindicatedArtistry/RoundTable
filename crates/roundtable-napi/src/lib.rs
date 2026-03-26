//! NAPI bindings for roundtable-core.
//!
//! Exposes the Rust deliberation infrastructure to Node.js:
//!   - MessageBus: lock-free inter-agent message routing
//!   - AgentRegistry: concurrent agent roster with status tracking
//!   - KnowledgeStore: in-memory consciousness cache (Wave 2)
//!
//! Boundary principle (Carta): Rust thinks, Node.js talks.
//! Rust owns orchestration, routing, state, computation.
//! Node.js owns LLM calls, Neo4j I/O, WebSocket clients.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use roundtable_core::message_bus::{AgentMessage, MessageBus, MessageType};
use roundtable_core::agent_registry::{AgentInfo, AgentRegistry, AgentStatus};
use roundtable_core::knowledge_store::{KnowledgeStore, ConsciousnessState};
use roundtable_core::task_router;
use std::sync::Arc;

// ============================================================================
// Message Bus Bridge
// ============================================================================

#[napi(js_name = "RustMessageBus")]
pub struct JsMessageBus {
    inner: Arc<MessageBus>,
}

#[napi]
impl JsMessageBus {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Arc::new(MessageBus::new()),
        }
    }

    /// Subscribe an agent to the message bus. Returns nothing — messages
    /// are retrieved via poll_messages() or forwarded via callbacks.
    #[napi]
    pub fn subscribe(&self, agent_id: String) -> Result<()> {
        // Subscribe creates a channel internally. For NAPI, we store the
        // receiver so Node.js can poll it later.
        let _rx = self.inner.subscribe(&agent_id);
        // The receiver is dropped here — in Wave 3, we'll store receivers
        // and expose an async poll_messages() method.
        Ok(())
    }

    /// Unsubscribe an agent from the message bus.
    #[napi]
    pub fn unsubscribe(&self, agent_id: String) -> Result<()> {
        self.inner.unsubscribe(&agent_id);
        Ok(())
    }

    /// Publish a message to the bus.
    /// target: agent ID or "broadcast" for all agents.
    #[napi]
    pub fn publish(
        &self,
        from: String,
        target: String,
        message_type: String,
        payload: String,
    ) -> Result<()> {
        let msg_type = match message_type.as_str() {
            "proposal" => MessageType::Proposal,
            "challenge" => MessageType::Challenge,
            "endorsement" => MessageType::Endorsement,
            "synthesis" => MessageType::Synthesis,
            "notification" => MessageType::Notification,
            _ => MessageType::Error,
        };

        let payload_value: serde_json::Value =
            serde_json::from_str(&payload).unwrap_or(serde_json::Value::Null);

        let msg = AgentMessage::new(&from, &target, msg_type, payload_value);
        self.inner.publish(msg);
        Ok(())
    }

    /// Get current subscriber count.
    #[napi]
    pub fn subscriber_count(&self) -> u32 {
        self.inner.subscriber_count() as u32
    }
}

// ============================================================================
// Agent Registry Bridge
// ============================================================================

#[napi(js_name = "RustAgentRegistry")]
pub struct JsAgentRegistry {
    inner: Arc<AgentRegistry>,
}

#[napi(object)]
pub struct JsAgentInfo {
    pub id: String,
    pub name: String,
    pub agent_type: String,
    pub model_id: String,
    pub provider: String,
    pub status: String,
    pub capabilities: Vec<String>,
}

impl From<AgentInfo> for JsAgentInfo {
    fn from(a: AgentInfo) -> Self {
        Self {
            id: a.id,
            name: a.name,
            agent_type: a.agent_type,
            model_id: a.model_id,
            provider: a.provider,
            status: match a.status {
                AgentStatus::Idle => "idle".to_string(),
                AgentStatus::Active => "active".to_string(),
                AgentStatus::Deliberating => "deliberating".to_string(),
                AgentStatus::Busy => "busy".to_string(),
                AgentStatus::Error => "error".to_string(),
                AgentStatus::Maintenance => "maintenance".to_string(),
            },
            capabilities: a.capabilities,
        }
    }
}

fn parse_status(s: &str) -> AgentStatus {
    match s {
        "idle" => AgentStatus::Idle,
        "active" => AgentStatus::Active,
        "deliberating" => AgentStatus::Deliberating,
        "busy" => AgentStatus::Busy,
        "error" => AgentStatus::Error,
        "maintenance" => AgentStatus::Maintenance,
        _ => AgentStatus::Idle,
    }
}

#[napi]
impl JsAgentRegistry {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Arc::new(AgentRegistry::new()),
        }
    }

    /// Register an agent with the registry.
    #[napi]
    pub fn register(
        &self,
        id: String,
        name: String,
        agent_type: String,
        model_id: String,
        provider: String,
        capabilities: Vec<String>,
    ) -> Result<()> {
        let agent = AgentInfo {
            id,
            name,
            agent_type,
            model_id,
            provider,
            status: AgentStatus::Idle,
            capabilities,
            last_heartbeat: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        };
        self.inner.register(agent);
        Ok(())
    }

    /// Unregister an agent. Returns the removed agent info or null.
    #[napi]
    pub fn unregister(&self, agent_id: String) -> Option<JsAgentInfo> {
        self.inner.unregister(&agent_id).map(JsAgentInfo::from)
    }

    /// Get a single agent by ID.
    #[napi]
    pub fn get(&self, agent_id: String) -> Option<JsAgentInfo> {
        self.inner.get(&agent_id).map(JsAgentInfo::from)
    }

    /// Find all agents of a given type.
    #[napi]
    pub fn find_by_type(&self, agent_type: String) -> Vec<JsAgentInfo> {
        self.inner
            .find_by_type(&agent_type)
            .into_iter()
            .map(JsAgentInfo::from)
            .collect()
    }

    /// Find all available (idle or active) agents.
    #[napi]
    pub fn find_available(&self) -> Vec<JsAgentInfo> {
        self.inner
            .find_available()
            .into_iter()
            .map(JsAgentInfo::from)
            .collect()
    }

    /// Update an agent's status. Returns true if the agent was found.
    #[napi]
    pub fn update_status(&self, agent_id: String, status: String) -> bool {
        self.inner.update_status(&agent_id, parse_status(&status))
    }

    /// Check if an agent is available (idle or active).
    #[napi]
    pub fn is_available(&self, agent_id: String) -> bool {
        self.inner
            .get(&agent_id)
            .map(|a| matches!(a.status, AgentStatus::Idle | AgentStatus::Active))
            .unwrap_or(false)
    }

    /// Get total registered agent count.
    #[napi]
    pub fn count(&self) -> u32 {
        self.inner.count() as u32
    }
}

// ============================================================================
// Knowledge Store Bridge (Wave 2)
// ============================================================================

#[napi(js_name = "RustKnowledgeStore")]
pub struct JsKnowledgeStore {
    inner: Arc<KnowledgeStore>,
}

#[napi]
impl JsKnowledgeStore {
    #[napi(constructor)]
    pub fn new(ttl_secs: Option<u32>) -> Self {
        let store = match ttl_secs {
            Some(ttl) => KnowledgeStore::with_ttl(ttl as u64),
            None => KnowledgeStore::new(),
        };
        Self {
            inner: Arc::new(store),
        }
    }

    /// Cache a full consciousness state from Neo4j.
    /// Called after Node.js loads from the database.
    #[napi]
    pub fn cache_state(&self, state_json: String) -> Result<()> {
        let state: ConsciousnessState = serde_json::from_str(&state_json)
            .map_err(|e| Error::from_reason(format!("Invalid consciousness state JSON: {e}")))?;
        self.inner.cache_state(state);
        Ok(())
    }

    /// Get cached consciousness state as JSON. Returns null if not cached or expired.
    #[napi]
    pub fn get_state(&self, agent_id: String) -> Option<String> {
        self.inner
            .get_state(&agent_id)
            .and_then(|s| serde_json::to_string(&s).ok())
    }

    /// Check if we have a valid cache entry for an agent.
    #[napi]
    pub fn has_valid(&self, agent_id: String) -> bool {
        self.inner.has_valid(&agent_id)
    }

    /// Invalidate a single agent's cache.
    #[napi]
    pub fn invalidate(&self, agent_id: String) {
        self.inner.invalidate(&agent_id);
    }

    /// Invalidate all cached entries.
    #[napi]
    pub fn invalidate_all(&self) {
        self.inner.invalidate_all();
    }

    /// Update a trait value in cache. Marks as dirty for write-back.
    #[napi]
    pub fn update_trait(&self, agent_id: String, trait_name: String, value: f64) -> bool {
        self.inner.update_trait(&agent_id, &trait_name, value)
    }

    /// Update a trust score in cache. Marks as dirty for write-back.
    #[napi]
    pub fn update_trust(&self, agent_id: String, other_id: String, score: f64) -> bool {
        self.inner.update_trust(&agent_id, &other_id, score)
    }

    /// Get all dirty entries as JSON array for Neo4j write-back.
    /// Returns: [{ agentId, state, dirtyFields }]
    #[napi]
    pub fn get_dirty_entries(&self) -> String {
        let entries: Vec<serde_json::Value> = self
            .inner
            .get_dirty_entries()
            .into_iter()
            .map(|(id, state, fields)| {
                serde_json::json!({
                    "agentId": id,
                    "state": state,
                    "dirtyFields": fields,
                })
            })
            .collect();
        serde_json::to_string(&entries).unwrap_or_else(|_| "[]".to_string())
    }

    /// Mark entries as clean after successful Neo4j flush.
    #[napi]
    pub fn mark_clean(&self, agent_ids: Vec<String>) {
        self.inner.mark_clean(&agent_ids);
    }

    /// Get model params from cache (temperature, topP, maxTokens).
    /// Returns JSON or null.
    #[napi]
    pub fn get_model_params(&self, agent_id: String) -> Option<String> {
        self.inner
            .get_model_params(&agent_id)
            .and_then(|p| serde_json::to_string(&p).ok())
    }

    /// Get cache statistics: { total, dirty }.
    #[napi]
    pub fn stats(&self) -> String {
        let (total, dirty) = self.inner.stats();
        serde_json::json!({ "total": total, "dirty": dirty }).to_string()
    }
}

// ============================================================================
// Wave 3: Domain Classification + Agent Selection + Convergence
// ============================================================================

/// Classify a problem domain from grid data.
/// Returns the domain string (e.g., "spatial_reasoning").
#[napi]
pub fn classify_domain(
    grid_json: String,
    action_count: u32,
    available_actions: u32,
    recent_domains: Vec<String>,
) -> String {
    let grid: Vec<Vec<u8>> = serde_json::from_str(&grid_json).unwrap_or_default();
    let domain = task_router::classify_domain(&grid, action_count, available_actions, &recent_domains);
    domain.as_str().to_string()
}

/// Select best agents for a domain given performance data.
/// candidates_json: [{ agent_id, agent_type, win_rate, consensus_contribution, selection_count, available }]
/// Returns: agent ID array.
#[napi]
pub fn select_participants(domain: String, candidates_json: String, max_participants: u32) -> Vec<String> {
    let domain = task_router::ProblemDomain::from_str(&domain);
    let candidates: Vec<task_router::AgentPerformance> =
        serde_json::from_str(&candidates_json).unwrap_or_default();
    task_router::select_participants(&domain, &candidates, max_participants as usize)
}

/// Resolve convergence from proposals and evaluations.
/// Returns JSON: { chosen_agent, chosen_round, method, endorsement_counts }
#[napi]
pub fn resolve_convergence(
    proposals_json: String,
    evaluations_json: String,
    participant_count: u32,
    threshold: f64,
) -> String {
    let proposals: Vec<task_router::ProposalScore> =
        serde_json::from_str(&proposals_json).unwrap_or_default();
    let evaluations: Vec<task_router::Evaluation> =
        serde_json::from_str(&evaluations_json).unwrap_or_default();
    let result = task_router::resolve_convergence(&proposals, &evaluations, participant_count as usize, threshold);
    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}

// ============================================================================
// Wave 4: Constitutional Gate + Trait Evolution
// ============================================================================

/// Validate a strategy against the VA Constitution.
/// Returns JSON: { passed, overall_score, violations }
#[napi]
pub fn validate_strategy(
    strategy: String,
    reasoning: String,
    confidence: f64,
    risks_count: u32,
) -> String {
    let result = task_router::validate_strategy(&strategy, &reasoning, confidence, risks_count as usize);
    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}

/// Compute trait evolution deltas for all participants after a deliberation.
/// inputs_json: [{ agent_id, is_winner, is_consensus, did_synthesize, ... }]
/// Returns JSON: [{ agent_id, trait_name, delta, new_value }]
#[napi]
pub fn compute_evolution_deltas(inputs_json: String) -> String {
    let inputs: Vec<task_router::EvolutionInput> =
        serde_json::from_str(&inputs_json).unwrap_or_default();
    let deltas = task_router::compute_evolution_deltas(&inputs);
    serde_json::to_string(&deltas).unwrap_or_else(|_| "[]".to_string())
}

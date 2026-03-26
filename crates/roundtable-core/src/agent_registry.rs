//! Agent registry — discovery and registration of council agents.
//! Adapted from ForgeOS forge-core agent_registry.

use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentStatus {
    Idle,
    Active,
    Deliberating,
    Busy,
    Error,
    Maintenance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    pub agent_type: String,
    pub model_id: String,
    pub provider: String,
    pub status: AgentStatus,
    pub capabilities: Vec<String>,
    pub last_heartbeat: u64,
}

pub struct AgentRegistry {
    agents: Arc<DashMap<String, AgentInfo>>,
}

impl AgentRegistry {
    pub fn new() -> Self {
        Self {
            agents: Arc::new(DashMap::new()),
        }
    }

    pub fn register(&self, agent: AgentInfo) {
        self.agents.insert(agent.id.clone(), agent);
    }

    pub fn unregister(&self, agent_id: &str) -> Option<AgentInfo> {
        self.agents.remove(agent_id).map(|(_, v)| v)
    }

    pub fn get(&self, agent_id: &str) -> Option<AgentInfo> {
        self.agents.get(agent_id).map(|entry| entry.clone())
    }

    pub fn find_by_type(&self, agent_type: &str) -> Vec<AgentInfo> {
        self.agents
            .iter()
            .filter(|entry| entry.agent_type == agent_type)
            .map(|entry| entry.clone())
            .collect()
    }

    pub fn find_available(&self) -> Vec<AgentInfo> {
        self.agents
            .iter()
            .filter(|entry| matches!(entry.status, AgentStatus::Idle | AgentStatus::Active))
            .map(|entry| entry.clone())
            .collect()
    }

    pub fn update_status(&self, agent_id: &str, status: AgentStatus) -> bool {
        if let Some(mut entry) = self.agents.get_mut(agent_id) {
            entry.status = status;
            true
        } else {
            false
        }
    }

    pub fn count(&self) -> usize {
        self.agents.len()
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

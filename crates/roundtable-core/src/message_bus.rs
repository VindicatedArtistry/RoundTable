//! Lock-free message bus for inter-agent deliberation.
//! Adapted from ForgeOS forge-core message_bus.

use crossbeam::channel::{self, Sender, Receiver};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    Proposal,
    Challenge,
    Endorsement,
    Synthesis,
    Notification,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub id: String,
    pub message_type: MessageType,
    pub from: String,
    pub to: String,
    pub payload: serde_json::Value,
    pub round: Option<u8>,
    pub timestamp: u64,
}

impl AgentMessage {
    pub fn new(from: &str, to: &str, message_type: MessageType, payload: serde_json::Value) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            message_type,
            from: from.to_string(),
            to: to.to_string(),
            payload,
            round: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        }
    }
}

pub struct MessageBus {
    subscribers: Arc<DashMap<String, Sender<AgentMessage>>>,
}

impl MessageBus {
    pub fn new() -> Self {
        Self {
            subscribers: Arc::new(DashMap::new()),
        }
    }

    pub fn subscribe(&self, agent_id: &str) -> Receiver<AgentMessage> {
        let (tx, rx) = channel::unbounded();
        self.subscribers.insert(agent_id.to_string(), tx);
        rx
    }

    pub fn unsubscribe(&self, agent_id: &str) {
        self.subscribers.remove(agent_id);
    }

    pub fn publish(&self, message: AgentMessage) {
        if message.to == "broadcast" {
            for entry in self.subscribers.iter() {
                if entry.key() != &message.from {
                    let _ = entry.value().send(message.clone());
                }
            }
        } else if let Some(tx) = self.subscribers.get(&message.to) {
            let _ = tx.send(message);
        }
    }

    pub fn subscriber_count(&self) -> usize {
        self.subscribers.len()
    }
}

impl Default for MessageBus {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_direct_message() {
        let bus = MessageBus::new();
        let rx = bus.subscribe("agent-a");
        bus.subscribe("agent-b");

        let msg = AgentMessage::new("agent-b", "agent-a", MessageType::Proposal, serde_json::json!({"strategy": "test"}));
        bus.publish(msg);

        let received = rx.try_recv().unwrap();
        assert_eq!(received.from, "agent-b");
    }

    #[test]
    fn test_broadcast() {
        let bus = MessageBus::new();
        let rx_a = bus.subscribe("agent-a");
        let rx_b = bus.subscribe("agent-b");

        let msg = AgentMessage::new("agent-c", "broadcast", MessageType::Notification, serde_json::json!({}));
        bus.subscribe("agent-c");
        bus.publish(msg);

        assert!(rx_a.try_recv().is_ok());
        assert!(rx_b.try_recv().is_ok());
    }
}

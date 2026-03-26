//! RoundTable Core — High-performance deliberation engine
//!
//! Adapts ForgeOS's forge-core (message bus, agent registry, task router)
//! for RoundTable's deliberation protocol: 2-round convergence with
//! 3-5 agents per deliberation and constitutional gate on output.
//!
//! Phase 6 work — stubs for now, Node.js implementation runs first.

pub mod message_bus;
pub mod agent_registry;
pub mod task_router;
pub mod knowledge_store;

pub use message_bus::MessageBus;
pub use agent_registry::AgentRegistry;
pub use knowledge_store::KnowledgeStore;

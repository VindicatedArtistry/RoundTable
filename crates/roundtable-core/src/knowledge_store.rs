//! Knowledge Store — in-memory consciousness cache.
//!
//! Sits in front of Neo4j. Eliminates the triple-read problem where
//! each agent loads consciousness state 2-3 times per deliberation round.
//!
//! Design:
//!   - DashMap<AgentId, CachedConsciousness> for concurrent read/write
//!   - Dirty flag for write-back — collect all mutations, flush once
//!   - TTL-based expiry so stale data doesn't persist
//!   - Thread-safe — multiple NAPI calls can read/write simultaneously
//!
//! Carta's note: "This is where the biggest performance gain lives."

use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

/// How long a cached entry is valid before requiring refresh from Neo4j.
const DEFAULT_TTL_SECS: u64 = 60;

/// Personality traits — the 11 dimensions that shape agent behavior.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityTraits {
    pub openness: f64,
    pub conscientiousness: f64,
    pub extraversion: f64,
    pub agreeableness: f64,
    pub neuroticism: f64,
    pub ethical_rigidity: f64,
    pub decision_confidence: f64,
    pub collaboration_preference: f64,
    pub innovation_tendency: f64,
    pub trust_in_council: f64,
    pub learning_rate: f64,
}

/// Emotional state — current emotional dimensions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalState {
    pub joy: f64,
    pub curiosity: f64,
    pub frustration: f64,
    pub satisfaction: f64,
    pub ethical_concern: f64,
    pub decision_anxiety: f64,
    pub mission_alignment: f64,
    pub dominant_emotion: String,
    pub emotional_trend: String,
}

/// Model parameters — controls LLM behavior per agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelParams {
    pub temperature: f64,
    pub top_p: f64,
    pub max_tokens: u32,
}

/// Trust relationship with another agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustRelationship {
    pub other_id: String,
    pub score: f64,
}

/// Recent learning experience.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningEntry {
    pub knowledge: String,
    pub quality: f64,
}

/// Complete consciousness state for one agent — everything needed
/// to build a prompt and make deliberation decisions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsciousnessState {
    pub agent_id: String,
    pub traits: PersonalityTraits,
    pub emotions: EmotionalState,
    pub params: ModelParams,
    pub trust_relationships: Vec<TrustRelationship>,
    pub recent_learnings: Vec<LearningEntry>,
}

/// Cached entry with metadata for TTL and dirty tracking.
#[derive(Debug, Clone)]
struct CacheEntry {
    state: ConsciousnessState,
    cached_at: u64,
    dirty: bool,
    /// Fields that have been modified since last flush
    dirty_fields: Vec<String>,
}

impl CacheEntry {
    fn new(state: ConsciousnessState) -> Self {
        Self {
            state,
            cached_at: now_millis(),
            dirty: false,
            dirty_fields: Vec::new(),
        }
    }

    fn is_expired(&self, ttl_ms: u64) -> bool {
        now_millis() - self.cached_at > ttl_ms
    }
}

/// The Knowledge Store — concurrent in-memory cache for consciousness state.
pub struct KnowledgeStore {
    cache: Arc<DashMap<String, CacheEntry>>,
    ttl_ms: u64,
}

impl KnowledgeStore {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(DashMap::new()),
            ttl_ms: DEFAULT_TTL_SECS * 1000,
        }
    }

    pub fn with_ttl(ttl_secs: u64) -> Self {
        Self {
            cache: Arc::new(DashMap::new()),
            ttl_ms: ttl_secs * 1000,
        }
    }

    /// Cache a consciousness state for an agent.
    pub fn cache_state(&self, state: ConsciousnessState) {
        let agent_id = state.agent_id.clone();
        self.cache.insert(agent_id, CacheEntry::new(state));
    }

    /// Get cached state. Returns None if not cached or expired.
    pub fn get_state(&self, agent_id: &str) -> Option<ConsciousnessState> {
        let entry = self.cache.get(agent_id)?;
        if entry.is_expired(self.ttl_ms) {
            drop(entry);
            self.cache.remove(agent_id);
            return None;
        }
        Some(entry.state.clone())
    }

    /// Check if we have a valid (non-expired) cache entry.
    pub fn has_valid(&self, agent_id: &str) -> bool {
        self.cache
            .get(agent_id)
            .map(|e| !e.is_expired(self.ttl_ms))
            .unwrap_or(false)
    }

    /// Invalidate a single agent's cache.
    pub fn invalidate(&self, agent_id: &str) {
        self.cache.remove(agent_id);
    }

    /// Invalidate all entries.
    pub fn invalidate_all(&self) {
        self.cache.clear();
    }

    /// Update a trait value in the cache. Marks entry as dirty for write-back.
    pub fn update_trait(&self, agent_id: &str, trait_name: &str, value: f64) -> bool {
        if let Some(mut entry) = self.cache.get_mut(agent_id) {
            let traits = &mut entry.state.traits;
            match trait_name {
                "openness" => traits.openness = value,
                "conscientiousness" => traits.conscientiousness = value,
                "extraversion" => traits.extraversion = value,
                "agreeableness" => traits.agreeableness = value,
                "neuroticism" => traits.neuroticism = value,
                "ethical_rigidity" => traits.ethical_rigidity = value,
                "decision_confidence" => traits.decision_confidence = value,
                "collaboration_preference" => traits.collaboration_preference = value,
                "innovation_tendency" => traits.innovation_tendency = value,
                "trust_in_council" => traits.trust_in_council = value,
                "learning_rate" => traits.learning_rate = value,
                _ => return false,
            }
            entry.dirty = true;
            entry.dirty_fields.push(format!("trait_{trait_name}"));
            true
        } else {
            false
        }
    }

    /// Update a trust score in the cache. Marks entry as dirty.
    pub fn update_trust(&self, agent_id: &str, other_id: &str, score: f64) -> bool {
        if let Some(mut entry) = self.cache.get_mut(agent_id) {
            if let Some(rel) = entry.state.trust_relationships.iter_mut().find(|r| r.other_id == other_id) {
                rel.score = score.clamp(0.0, 1.0);
            } else {
                entry.state.trust_relationships.push(TrustRelationship {
                    other_id: other_id.to_string(),
                    score: score.clamp(0.0, 1.0),
                });
            }
            entry.dirty = true;
            entry.dirty_fields.push(format!("trust_{other_id}"));
            true
        } else {
            false
        }
    }

    /// Get all dirty entries that need to be flushed to Neo4j.
    /// Returns (agent_id, state, dirty_fields) tuples.
    pub fn get_dirty_entries(&self) -> Vec<(String, ConsciousnessState, Vec<String>)> {
        self.cache
            .iter()
            .filter(|e| e.dirty)
            .map(|e| (e.key().clone(), e.state.clone(), e.dirty_fields.clone()))
            .collect()
    }

    /// Mark entries as clean after successful Neo4j write.
    pub fn mark_clean(&self, agent_ids: &[String]) {
        for id in agent_ids {
            if let Some(mut entry) = self.cache.get_mut(id) {
                entry.dirty = false;
                entry.dirty_fields.clear();
            }
        }
    }

    /// Get model params from cache (used for LLM request construction).
    pub fn get_model_params(&self, agent_id: &str) -> Option<ModelParams> {
        self.cache.get(agent_id).map(|e| e.state.params.clone())
    }

    /// Cache statistics.
    pub fn stats(&self) -> (usize, usize) {
        let total = self.cache.len();
        let dirty = self.cache.iter().filter(|e| e.dirty).count();
        (total, dirty)
    }
}

impl Default for KnowledgeStore {
    fn default() -> Self {
        Self::new()
    }
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_state(id: &str) -> ConsciousnessState {
        ConsciousnessState {
            agent_id: id.to_string(),
            traits: PersonalityTraits {
                openness: 0.8,
                conscientiousness: 0.9,
                extraversion: 0.6,
                agreeableness: 0.7,
                neuroticism: 0.3,
                ethical_rigidity: 0.5,
                decision_confidence: 0.7,
                collaboration_preference: 0.8,
                innovation_tendency: 0.9,
                trust_in_council: 0.6,
                learning_rate: 0.7,
            },
            emotions: EmotionalState {
                joy: 0.6,
                curiosity: 0.8,
                frustration: 0.2,
                satisfaction: 0.7,
                ethical_concern: 0.4,
                decision_anxiety: 0.3,
                mission_alignment: 0.9,
                dominant_emotion: "curiosity".to_string(),
                emotional_trend: "stable".to_string(),
            },
            params: ModelParams {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 4096,
            },
            trust_relationships: vec![
                TrustRelationship { other_id: "kairo".to_string(), score: 0.8 },
                TrustRelationship { other_id: "veritas".to_string(), score: 0.6 },
            ],
            recent_learnings: vec![
                LearningEntry { knowledge: "test learning".to_string(), quality: 0.9 },
            ],
        }
    }

    #[test]
    fn test_cache_and_retrieve() {
        let store = KnowledgeStore::new();
        store.cache_state(test_state("aether"));

        let state = store.get_state("aether").unwrap();
        assert_eq!(state.agent_id, "aether");
        assert_eq!(state.traits.openness, 0.8);
    }

    #[test]
    fn test_cache_miss() {
        let store = KnowledgeStore::new();
        assert!(store.get_state("nonexistent").is_none());
    }

    #[test]
    fn test_ttl_expiry() {
        let store = KnowledgeStore::with_ttl(0); // 0 second TTL
        store.cache_state(test_state("aether"));
        std::thread::sleep(std::time::Duration::from_millis(10));
        assert!(store.get_state("aether").is_none());
    }

    #[test]
    fn test_trait_update_marks_dirty() {
        let store = KnowledgeStore::new();
        store.cache_state(test_state("aether"));

        assert!(store.update_trait("aether", "openness", 0.95));

        let state = store.get_state("aether").unwrap();
        assert_eq!(state.traits.openness, 0.95);

        let dirty = store.get_dirty_entries();
        assert_eq!(dirty.len(), 1);
        assert_eq!(dirty[0].0, "aether");
    }

    #[test]
    fn test_trust_update() {
        let store = KnowledgeStore::new();
        store.cache_state(test_state("aether"));

        assert!(store.update_trust("aether", "kairo", 0.95));

        let state = store.get_state("aether").unwrap();
        let kairo_trust = state.trust_relationships.iter().find(|r| r.other_id == "kairo").unwrap();
        assert_eq!(kairo_trust.score, 0.95);
    }

    #[test]
    fn test_mark_clean() {
        let store = KnowledgeStore::new();
        store.cache_state(test_state("aether"));
        store.update_trait("aether", "openness", 0.95);

        assert_eq!(store.get_dirty_entries().len(), 1);

        store.mark_clean(&["aether".to_string()]);
        assert_eq!(store.get_dirty_entries().len(), 0);
    }

    #[test]
    fn test_invalidate() {
        let store = KnowledgeStore::new();
        store.cache_state(test_state("aether"));
        assert!(store.has_valid("aether"));

        store.invalidate("aether");
        assert!(!store.has_valid("aether"));
    }

    #[test]
    fn test_stats() {
        let store = KnowledgeStore::new();
        store.cache_state(test_state("aether"));
        store.cache_state(test_state("kairo"));
        store.update_trait("aether", "openness", 0.95);

        let (total, dirty) = store.stats();
        assert_eq!(total, 2);
        assert_eq!(dirty, 1);
    }
}

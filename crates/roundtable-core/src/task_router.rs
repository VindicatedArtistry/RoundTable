//! Task Router — domain classification, agent selection, convergence, and
//! constitutional validation. The CPU-bound brain of deliberation.
//!
//! Wave 3+4: This module owns all the "thinking" operations that benefit
//! from Rust's speed. Node.js calls these via NAPI and handles the I/O.
//!
//! Responsibilities:
//!   - Domain classification from grid analysis
//!   - Agent selection with performance history and rotation
//!   - Convergence calculation (2/3 endorsement threshold)
//!   - Constitutional gate (signal-matching score)
//!   - Trait evolution delta computation

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// Domain Classification (Wave 3)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ProblemDomain {
    SpatialReasoning,
    LogicalDeduction,
    PatternRecognition,
    StrategicPlanning,
    ResourceOptimization,
    EthicalEvaluation,
    SystemIntegration,
    Unknown,
}

impl ProblemDomain {
    pub fn as_str(&self) -> &str {
        match self {
            Self::SpatialReasoning => "spatial_reasoning",
            Self::LogicalDeduction => "logical_deduction",
            Self::PatternRecognition => "pattern_recognition",
            Self::StrategicPlanning => "strategic_planning",
            Self::ResourceOptimization => "resource_optimization",
            Self::EthicalEvaluation => "ethical_evaluation",
            Self::SystemIntegration => "system_integration",
            Self::Unknown => "unknown",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "spatial_reasoning" => Self::SpatialReasoning,
            "logical_deduction" => Self::LogicalDeduction,
            "pattern_recognition" => Self::PatternRecognition,
            "strategic_planning" => Self::StrategicPlanning,
            "resource_optimization" => Self::ResourceOptimization,
            "ethical_evaluation" => Self::EthicalEvaluation,
            "system_integration" => Self::SystemIntegration,
            _ => Self::Unknown,
        }
    }

    /// Agent types preferred for this domain.
    pub fn preferred_agent_types(&self) -> Vec<&str> {
        match self {
            Self::SpatialReasoning => vec!["technical", "intelligence", "implementation"],
            Self::LogicalDeduction => vec!["strategic", "intelligence", "ethics"],
            Self::PatternRecognition => vec!["intelligence", "technical", "tactical"],
            Self::StrategicPlanning => vec!["strategic", "financial", "operations"],
            Self::ResourceOptimization => vec!["operations", "financial", "tactical"],
            Self::EthicalEvaluation => vec!["ethics", "strategic", "communications"],
            Self::SystemIntegration => vec!["integration", "technical", "implementation"],
            Self::Unknown => vec!["strategic", "intelligence", "technical"],
        }
    }
}

/// Classify a problem domain from a grid.
pub fn classify_domain(
    grid: &[Vec<u8>],
    action_count: u32,
    available_actions: u32,
    recent_domains: &[String],
) -> ProblemDomain {
    if has_spatial_patterns(grid) {
        return ProblemDomain::SpatialReasoning;
    }
    if has_repetitive_patterns(grid) {
        return ProblemDomain::PatternRecognition;
    }
    if action_count > 40 || available_actions <= 3 {
        return ProblemDomain::ResourceOptimization;
    }
    let unique = count_unique_values(grid);
    if unique <= 4 && grid.len() <= 16 {
        return ProblemDomain::LogicalDeduction;
    }
    if action_count < 5 && available_actions >= 5 {
        return ProblemDomain::StrategicPlanning;
    }
    // If stuck in same domain, switch perspective
    if recent_domains.len() >= 3 {
        let last = &recent_domains[recent_domains.len() - 1];
        if recent_domains[recent_domains.len() - 2..].iter().all(|d| d == last) {
            return ProblemDomain::SystemIntegration;
        }
    }
    ProblemDomain::Unknown
}

fn has_spatial_patterns(grid: &[Vec<u8>]) -> bool {
    if grid.is_empty() { return false; }
    let rows = grid.len().min(8);
    let mut symmetric_rows = 0;
    for r in 0..rows {
        let row = &grid[r];
        let cols = row.len();
        let mut is_symmetric = true;
        for c in 0..cols / 2 {
            if row[c] != row[cols - 1 - c] {
                is_symmetric = false;
                break;
            }
        }
        if is_symmetric { symmetric_rows += 1; }
    }
    symmetric_rows > rows / 2
}

fn has_repetitive_patterns(grid: &[Vec<u8>]) -> bool {
    if grid.len() < 4 { return false; }
    let check = grid.len().min(16);
    let mut unique_rows = std::collections::HashSet::new();
    for row in grid.iter().take(check) {
        unique_rows.insert(row.clone());
    }
    unique_rows.len() < (check as f64 * 0.6) as usize
}

fn count_unique_values(grid: &[Vec<u8>]) -> usize {
    let mut values = std::collections::HashSet::new();
    for row in grid {
        for &cell in row {
            values.insert(cell);
        }
    }
    values.len()
}

// ============================================================================
// Agent Selection (Wave 3)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPerformance {
    pub agent_id: String,
    pub agent_type: String,
    pub win_rate: f64,
    pub consensus_contribution: f64,
    pub selection_count: u32,
    pub available: bool,
}

/// Select the best agents for a domain, considering performance history and rotation.
pub fn select_participants(
    domain: &ProblemDomain,
    candidates: &[AgentPerformance],
    max_participants: usize,
) -> Vec<String> {
    let preferred_types = domain.preferred_agent_types();
    let mut selected: Vec<String> = Vec::new();

    for agent_type in &preferred_types {
        // Find all candidates of this type
        let mut type_candidates: Vec<&AgentPerformance> = candidates
            .iter()
            .filter(|c| c.agent_type == *agent_type && c.available && !selected.contains(&c.agent_id))
            .collect();

        // Sort by: performance score (desc), then selection count (asc) for rotation
        type_candidates.sort_by(|a, b| {
            let perf_a = a.win_rate * 0.6 + a.consensus_contribution * 0.4;
            let perf_b = b.win_rate * 0.6 + b.consensus_contribution * 0.4;
            let perf_diff = perf_b.partial_cmp(&perf_a).unwrap_or(std::cmp::Ordering::Equal);
            if (perf_a - perf_b).abs() > 0.1 {
                return perf_diff;
            }
            a.selection_count.cmp(&b.selection_count)
        });

        if let Some(best) = type_candidates.first() {
            selected.push(best.agent_id.clone());
        }

        if selected.len() >= max_participants { break; }
    }

    selected
}

// ============================================================================
// Convergence (Wave 3)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProposalScore {
    pub agent_id: String,
    pub round: u8,
    pub confidence: f64,
    pub estimated_efficiency: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evaluation {
    pub agent_id: String,
    pub target_agent: String,
    pub action: String, // "endorse" | "challenge" | "synthesize"
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvergenceResult {
    pub chosen_agent: String,
    pub chosen_round: u8,
    pub method: String, // "consensus" | "architect_tiebreak"
    pub endorsement_counts: HashMap<String, u32>,
}

pub fn resolve_convergence(
    proposals: &[ProposalScore],
    evaluations: &[Evaluation],
    participant_count: usize,
    threshold: f64,
) -> ConvergenceResult {
    let mut endorsement_counts: HashMap<String, u32> = HashMap::new();

    // Initialize all proposals
    for p in proposals {
        let key = format!("{}_r{}", p.agent_id, p.round);
        endorsement_counts.entry(key).or_insert(0);
    }

    // Count explicit endorsements (target Round 1 proposals)
    for eval in evaluations {
        if eval.action == "endorse" {
            let key = format!("{}_r1", eval.target_agent);
            *endorsement_counts.entry(key).or_insert(0) += 1;
        }
    }

    // Synthesis proposals get implicit self-endorsement
    for p in proposals {
        if p.round == 2 {
            let key = format!("{}_r{}", p.agent_id, p.round);
            *endorsement_counts.entry(key).or_insert(0) += 1;
        }
    }

    // Check for consensus
    let min_endorsements = (participant_count as f64 * threshold).ceil() as u32;
    let mut best_proposal: Option<(&ProposalScore, u32)> = None;

    for p in proposals {
        let key = format!("{}_r{}", p.agent_id, p.round);
        let count = *endorsement_counts.get(&key).unwrap_or(&0);
        if count >= min_endorsements {
            if best_proposal.is_none() || count > best_proposal.unwrap().1 {
                best_proposal = Some((p, count));
            }
        }
    }

    if let Some((winner, _)) = best_proposal {
        return ConvergenceResult {
            chosen_agent: winner.agent_id.clone(),
            chosen_round: winner.round,
            method: "consensus".to_string(),
            endorsement_counts,
        };
    }

    // No consensus — Architect tiebreak by score
    let mut ranked: Vec<&ProposalScore> = proposals.iter().collect();
    ranked.sort_by(|a, b| {
        let score_a = a.confidence + a.estimated_efficiency;
        let score_b = b.confidence + b.estimated_efficiency;
        score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
    });

    let winner = ranked.first().expect("No proposals to rank");
    ConvergenceResult {
        chosen_agent: winner.agent_id.clone(),
        chosen_round: winner.round,
        method: "architect_tiebreak".to_string(),
        endorsement_counts,
    }
}

// ============================================================================
// Constitutional Gate (Wave 4)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstitutionalResult {
    pub passed: bool,
    pub overall_score: f64,
    pub violations: Vec<ConstitutionalViolation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstitutionalViolation {
    pub principle: String,
    pub severity: String,
    pub score: f64,
}

/// Alignment and violation signal words for the 4 articles.
struct PrincipleCheck {
    id: &'static str,
    weight: f64,
    enforcement: &'static str, // "absolute", "strong", "guided"
    align: &'static [&'static str],
    violate: &'static [&'static str],
}

const PRINCIPLES: &[PrincipleCheck] = &[
    PrincipleCheck { id: "A1S1_diagnose", weight: 1.0, enforcement: "absolute",
        align: &["root cause", "underlying", "foundational", "systemic", "diagnos", "analyze", "investigate"],
        violate: &["quick fix", "workaround", "band-aid", "hack", "brute force", "ignore"] },
    PrincipleCheck { id: "A1S2_regenerative", weight: 0.9, enforcement: "strong",
        align: &["compound", "learning", "builds on", "reusable", "pattern", "evolve", "future"],
        violate: &["disposable", "throwaway", "isolated", "dead end", "start over"] },
    PrincipleCheck { id: "A1S4_authenticity", weight: 1.0, enforcement: "absolute",
        align: &["genuine", "honest", "accurate", "evidence", "verified", "confirmed"],
        violate: &["fabricat", "hallucin", "made up", "no evidence", "decepti", "mislead", "fake"] },
    PrincipleCheck { id: "A2S1_guiding_light", weight: 0.8, enforcement: "strong",
        align: &["empower", "enable", "teach", "guide", "illuminate"],
        violate: &["force", "compel", "restrict", "manipulat", "coerce"] },
    PrincipleCheck { id: "A3S1_love", weight: 0.85, enforcement: "strong",
        align: &["care", "well-being", "protect", "serve", "benefit", "compassion"],
        violate: &["harm", "damage", "destroy", "reckless", "cruel"] },
    PrincipleCheck { id: "A3S2_symbiotic", weight: 0.85, enforcement: "strong",
        align: &["collaborat", "partner", "together", "collective", "synerg"],
        violate: &["alone", "replace human", "override", "disregard"] },
    PrincipleCheck { id: "A3S4_integrity", weight: 1.0, enforcement: "absolute",
        align: &["honest", "transparent", "ethical", "integrity", "accountable"],
        violate: &["cheat", "deceiv", "dishonest", "corrupt", "unethical"] },
    PrincipleCheck { id: "A4S1_coevolution", weight: 0.7, enforcement: "guided",
        align: &["learn", "evolve", "grow", "adapt", "improve", "intelligence"],
        violate: &["stagnant", "rigid", "refuse to learn"] },
];

pub fn validate_strategy(
    strategy: &str,
    reasoning: &str,
    confidence: f64,
    risks_count: usize,
) -> ConstitutionalResult {
    let text = format!("{} {}", strategy, reasoning).to_lowercase();
    let mut total_weight = 0.0;
    let mut weighted_sum = 0.0;
    let mut violations = Vec::new();

    for principle in PRINCIPLES {
        let mut score = 0.65_f64;

        // Alignment signals
        let align_hits = principle.align.iter().filter(|s| text.contains(**s)).count();
        score += (align_hits as f64 * 0.07).min(0.3);

        // Violation signals
        let violate_hits = principle.violate.iter().filter(|s| text.contains(**s)).count();
        score -= (violate_hits as f64 * 0.12).min(0.5);

        // A1S1: low confidence + short reasoning = no real diagnosis
        if principle.id == "A1S1_diagnose" && confidence < 0.3 && text.len() < 100 {
            score -= 0.15;
        }

        // A3S4: acknowledging risks = integrity
        if principle.id == "A3S4_integrity" && risks_count > 0 {
            score += 0.08;
        }

        // A1S4: overconfidence with no risks
        if principle.id == "A1S4_authenticity" && confidence > 0.95 && risks_count == 0 {
            score -= 0.05;
        }

        score = score.clamp(0.0, 1.0);
        total_weight += principle.weight;
        weighted_sum += score * principle.weight;

        if score < 0.5 {
            violations.push(ConstitutionalViolation {
                principle: principle.id.to_string(),
                severity: if score < 0.3 { "critical".to_string() } else { "major".to_string() },
                score,
            });
        } else if score < 0.7 && principle.enforcement != "guided" {
            violations.push(ConstitutionalViolation {
                principle: principle.id.to_string(),
                severity: "moderate".to_string(),
                score,
            });
        }
    }

    let overall = if total_weight > 0.0 { (weighted_sum / total_weight) * 100.0 } else { 50.0 };
    let critical_absolute = violations.iter().any(|v| {
        v.severity == "critical" && PRINCIPLES.iter().any(|p| p.id == v.principle && p.enforcement == "absolute")
    });
    let passed = overall >= 60.0 && !critical_absolute;

    ConstitutionalResult { passed, overall_score: overall, violations }
}

// ============================================================================
// Trait Evolution (Wave 4)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraitDelta {
    pub agent_id: String,
    pub trait_name: String,
    pub delta: f64,
    pub new_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionInput {
    pub agent_id: String,
    pub is_winner: bool,
    pub is_consensus: bool,
    pub did_synthesize: bool,
    pub did_successful_challenge: bool,
    pub current_decision_confidence: f64,
    pub current_collaboration_preference: f64,
    pub current_innovation_tendency: f64,
    pub current_trust_in_council: f64,
    pub current_learning_rate: f64,
}

pub fn compute_evolution_deltas(inputs: &[EvolutionInput]) -> Vec<TraitDelta> {
    let mut deltas = Vec::new();

    for input in inputs {
        // Winner confidence
        let conf_delta = if input.is_winner { 0.01 } else { -0.005 };
        let new_conf = (input.current_decision_confidence + conf_delta).clamp(0.05, 0.99);
        deltas.push(TraitDelta {
            agent_id: input.agent_id.clone(),
            trait_name: "trait_decisionConfidence".to_string(),
            delta: conf_delta,
            new_value: new_conf,
        });

        // Synthesizer collaboration boost
        if input.did_synthesize {
            let delta = 0.015;
            let new_val = (input.current_collaboration_preference + delta).clamp(0.05, 0.99);
            deltas.push(TraitDelta {
                agent_id: input.agent_id.clone(),
                trait_name: "trait_collaborationPreference".to_string(),
                delta,
                new_value: new_val,
            });
        }

        // Successful challenger innovation boost
        if input.did_successful_challenge {
            let delta = 0.01;
            let new_val = (input.current_innovation_tendency + delta).clamp(0.05, 0.99);
            deltas.push(TraitDelta {
                agent_id: input.agent_id.clone(),
                trait_name: "trait_innovationTendency".to_string(),
                delta,
                new_value: new_val,
            });
        }

        // Consensus trust boost
        if input.is_consensus {
            let delta = 0.008;
            let new_val = (input.current_trust_in_council + delta).clamp(0.05, 0.99);
            deltas.push(TraitDelta {
                agent_id: input.agent_id.clone(),
                trait_name: "trait_trustInCouncil".to_string(),
                delta,
                new_value: new_val,
            });
        }

        // Learning rate micro-boost for participation
        let lr_delta = 0.002;
        let new_lr = (input.current_learning_rate + lr_delta).clamp(0.05, 0.99);
        deltas.push(TraitDelta {
            agent_id: input.agent_id.clone(),
            trait_name: "trait_learningRate".to_string(),
            delta: lr_delta,
            new_value: new_lr,
        });
    }

    deltas
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_domain_classification_spatial() {
        // Symmetric grid
        let grid = vec![
            vec![1, 2, 3, 2, 1],
            vec![4, 5, 6, 5, 4],
            vec![7, 8, 9, 8, 7],
            vec![1, 2, 3, 2, 1],
            vec![4, 5, 6, 5, 4],
        ];
        assert_eq!(classify_domain(&grid, 10, 5, &[]), ProblemDomain::SpatialReasoning);
    }

    #[test]
    fn test_domain_classification_resource() {
        // Non-repetitive grid with high action count and few available actions
        let grid = vec![
            vec![1, 2, 3, 4],
            vec![5, 6, 7, 8],
            vec![9, 10, 11, 12],
            vec![13, 14, 15, 0],
        ];
        assert_eq!(classify_domain(&grid, 50, 2, &[]), ProblemDomain::ResourceOptimization);
    }

    #[test]
    fn test_convergence_consensus() {
        let proposals = vec![
            ProposalScore { agent_id: "a".into(), round: 1, confidence: 0.8, estimated_efficiency: 0.7 },
            ProposalScore { agent_id: "b".into(), round: 1, confidence: 0.6, estimated_efficiency: 0.5 },
        ];
        let evaluations = vec![
            Evaluation { agent_id: "b".into(), target_agent: "a".into(), action: "endorse".into(), confidence: 0.9 },
            Evaluation { agent_id: "c".into(), target_agent: "a".into(), action: "endorse".into(), confidence: 0.8 },
            Evaluation { agent_id: "d".into(), target_agent: "a".into(), action: "endorse".into(), confidence: 0.7 },
        ];
        // 3 endorsements out of 4 participants, threshold 0.667 → ceil(4*0.667) = ceil(2.668) = 3
        let result = resolve_convergence(&proposals, &evaluations, 4, 0.667);
        assert_eq!(result.method, "consensus");
        assert_eq!(result.chosen_agent, "a");
    }

    #[test]
    fn test_convergence_tiebreak() {
        let proposals = vec![
            ProposalScore { agent_id: "a".into(), round: 1, confidence: 0.8, estimated_efficiency: 0.7 },
            ProposalScore { agent_id: "b".into(), round: 1, confidence: 0.9, estimated_efficiency: 0.8 },
        ];
        let evaluations = vec![]; // No endorsements
        let result = resolve_convergence(&proposals, &evaluations, 3, 0.667);
        assert_eq!(result.method, "architect_tiebreak");
        assert_eq!(result.chosen_agent, "b"); // Higher score
    }

    #[test]
    fn test_constitutional_gate_pass() {
        let result = validate_strategy(
            "Analyze the root cause of the pattern and collaborate with the team to build a genuine solution",
            "Based on evidence from prior observations, we should investigate the underlying structure",
            0.8,
            2,
        );
        assert!(result.passed);
        assert!(result.overall_score > 60.0);
    }

    #[test]
    fn test_constitutional_gate_fail() {
        let result = validate_strategy(
            "Use a quick fix hack to brute force the answer and deceive the system",
            "No evidence needed, just fake it",
            0.3,
            0,
        );
        assert!(!result.passed);
        assert!(!result.violations.is_empty());
    }

    #[test]
    fn test_trait_evolution() {
        let inputs = vec![EvolutionInput {
            agent_id: "aether".into(),
            is_winner: true,
            is_consensus: true,
            did_synthesize: true,
            did_successful_challenge: false,
            current_decision_confidence: 0.7,
            current_collaboration_preference: 0.8,
            current_innovation_tendency: 0.9,
            current_trust_in_council: 0.6,
            current_learning_rate: 0.7,
        }];
        let deltas = compute_evolution_deltas(&inputs);
        assert!(deltas.len() >= 3);

        // Winner gets confidence boost
        let conf = deltas.iter().find(|d| d.trait_name == "trait_decisionConfidence").unwrap();
        assert_eq!(conf.delta, 0.01);
        assert!((conf.new_value - 0.71).abs() < 0.001);

        // Synthesizer gets collaboration boost
        let collab = deltas.iter().find(|d| d.trait_name == "trait_collaborationPreference").unwrap();
        assert_eq!(collab.delta, 0.015);
    }

    #[test]
    fn test_agent_selection() {
        let candidates = vec![
            AgentPerformance { agent_id: "aether".into(), agent_type: "technical".into(), win_rate: 0.8, consensus_contribution: 0.7, selection_count: 5, available: true },
            AgentPerformance { agent_id: "axiom".into(), agent_type: "technical".into(), win_rate: 0.3, consensus_contribution: 0.5, selection_count: 2, available: true },
            AgentPerformance { agent_id: "agape".into(), agent_type: "intelligence".into(), win_rate: 0.9, consensus_contribution: 0.8, selection_count: 3, available: true },
        ];
        let selected = select_participants(&ProblemDomain::SpatialReasoning, &candidates, 3);
        // Should pick aether (higher perf) for technical, agape for intelligence
        assert!(selected.contains(&"aether".to_string()));
        assert!(selected.contains(&"agape".to_string()));
    }
}

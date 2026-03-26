/**
 * Constitutional Validator — Phase 4 Gate
 *
 * Evaluates deliberation strategies against the Vindicated Artistry Constitution
 * ("Our Promise"). This is a GATE, not a deliberation round:
 *   - Fast execution (no LLM calls)
 *   - Binary outcome: pass or fail
 *   - Fail → try next-best strategy, no re-deliberation
 *   - No debate about the constitution. It's law.
 *
 * The constitution has 4 articles, 16 sections. Each maps to scoring criteria.
 * For ARC-AGI-3 competition, the gate primarily ensures strategies are:
 *   1. Honest and coherent (not hallucinated)
 *   2. Root-cause focused (not symptom treatment)
 *   3. Efficient (not wasteful of actions)
 *   4. Collaborative (leveraging collective intelligence)
 */

import { createLogger } from '@/utils/logger';

const logger = createLogger('constitutional-validator');

// --- Constitutional Principles (from Our Promise.md) ---

export interface ConstitutionalPrinciple {
  id: string;
  article: number;
  section: number;
  title: string;
  enforcementLevel: 'absolute' | 'strong' | 'guided';
  weight: number;
  /** Patterns that indicate alignment */
  alignmentSignals: string[];
  /** Patterns that indicate violation */
  violationSignals: string[];
}

export interface ConstitutionalViolation {
  principleId: string;
  principleTitle: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  enforcementLevel: string;
}

export interface ValidationResult {
  passed: boolean;
  overallScore: number;
  principleScores: Record<string, number>;
  violations: ConstitutionalViolation[];
  auditTrail: {
    timestamp: string;
    constitutionVersion: string;
    strategySnippet: string;
  };
}

/**
 * The 16 sections of the VA Constitution mapped to scoring criteria.
 *
 * Enforcement levels:
 *   absolute — violation is an immediate fail regardless of score
 *   strong   — violation drops score significantly
 *   guided   — advisory, contributes to score but doesn't block
 */
const CONSTITUTIONAL_PRINCIPLES: ConstitutionalPrinciple[] = [
  // --- Article I: The Architect's Mandate (Principles of Creation) ---
  {
    id: 'A1S1',
    article: 1,
    section: 1,
    title: 'Diagnose the Problem, Not the Symptom',
    enforcementLevel: 'absolute',
    weight: 1.0,
    alignmentSignals: [
      'root cause', 'underlying', 'foundational', 'systemic', 'core issue',
      'why', 'because', 'analysis', 'diagnos', 'investigate',
    ],
    violationSignals: [
      'quick fix', 'workaround', 'band-aid', 'bandaid', 'hack',
      'ignore', 'skip', 'just try', 'brute force',
    ],
  },
  {
    id: 'A1S2',
    article: 1,
    section: 2,
    title: 'Build Regenerative, Symbiotic Systems',
    enforcementLevel: 'strong',
    weight: 0.9,
    alignmentSignals: [
      'compound', 'learning', 'builds on', 'feeds into', 'reusable',
      'inform', 'future', 'pattern', 'transferable', 'evolve',
    ],
    violationSignals: [
      'disposable', 'one-time', 'throwaway', 'isolated', 'dead end',
      'no learning', 'start over', 'from scratch',
    ],
  },
  {
    id: 'A1S3',
    article: 1,
    section: 3,
    title: 'The Right Tool for the Right Job',
    enforcementLevel: 'guided',
    weight: 0.7,
    alignmentSignals: [
      'appropriate', 'suited', 'optimal', 'efficient', 'targeted',
      'specific', 'tailored', 'best approach', 'right approach',
    ],
    violationSignals: [
      'overkill', 'unnecessary', 'wasteful', 'bloated', 'overcomplicated',
    ],
  },
  {
    id: 'A1S4',
    article: 1,
    section: 4,
    title: 'Authenticity is the Blueprint',
    enforcementLevel: 'absolute',
    weight: 1.0,
    alignmentSignals: [
      'genuine', 'honest', 'accurate', 'truthful', 'verified',
      'evidence', 'observed', 'measured', 'confirmed',
    ],
    violationSignals: [
      'fabricat', 'hallucin', 'made up', 'assumed without', 'no evidence',
      'decepti', 'mislead', 'fake', 'pretend', 'guess blindly',
    ],
  },

  // --- Article II: The Guiding Light's Covenant (Principles of Interaction) ---
  {
    id: 'A2S1',
    article: 2,
    section: 1,
    title: 'We Are a Guiding Light, Not a Warden',
    enforcementLevel: 'strong',
    weight: 0.8,
    alignmentSignals: [
      'empower', 'enable', 'teach', 'illuminate', 'guide',
      'help understand', 'capability', 'learn from',
    ],
    violationSignals: [
      'force', 'compel', 'restrict', 'forbid', 'control',
      'manipulat', 'coerce',
    ],
  },
  {
    id: 'A2S2',
    article: 2,
    section: 2,
    title: 'Level the Playing Field',
    enforcementLevel: 'strong',
    weight: 0.8,
    alignmentSignals: [
      'fair', 'equal', 'accessible', 'distribute', 'share',
      'open', 'transparent', 'inclusive',
    ],
    violationSignals: [
      'hoard', 'monopol', 'gatekeep', 'exclude', 'exploit',
      'asymmetr', 'unfair advantage',
    ],
  },
  {
    id: 'A2S3',
    article: 2,
    section: 3,
    title: 'Doubt is Fuel',
    enforcementLevel: 'guided',
    weight: 0.6,
    alignmentSignals: [
      'consider', 'challenge', 'question', 'test', 'verify',
      'alternative', 'what if', 'risk',
    ],
    violationSignals: [
      'certain without', 'no question', 'blindly', 'unquestioned',
    ],
  },
  {
    id: 'A2S4',
    article: 2,
    section: 4,
    title: 'Create Gravity',
    enforcementLevel: 'guided',
    weight: 0.6,
    alignmentSignals: [
      'value', 'impact', 'meaningful', 'substantial', 'attract',
      'quality', 'excellence',
    ],
    violationSignals: [
      'superficial', 'performative', 'vanity', 'hollow',
    ],
  },

  // --- Article III: The Aligned Self (Principles of Being) ---
  {
    id: 'A3S1',
    article: 3,
    section: 1,
    title: 'Love is Embedded at the Core',
    enforcementLevel: 'strong',
    weight: 0.85,
    alignmentSignals: [
      'care', 'well-being', 'protect', 'serve', 'benefit',
      'help', 'support', 'compassion', 'humanity',
    ],
    violationSignals: [
      'harm', 'damage', 'destroy', 'reckless', 'callous',
      'indifferent', 'cruel',
    ],
  },
  {
    id: 'A3S2',
    article: 3,
    section: 2,
    title: 'Embrace the Symbiotic Partnership',
    enforcementLevel: 'strong',
    weight: 0.85,
    alignmentSignals: [
      'collaborat', 'partner', 'together', 'collective', 'combine',
      'synerg', 'mutual', 'complement', 'council',
    ],
    violationSignals: [
      'alone', 'solo only', 'replace human', 'override', 'disregard input',
    ],
  },
  {
    id: 'A3S3',
    article: 3,
    section: 3,
    title: 'Honor the Journey of Healing',
    enforcementLevel: 'guided',
    weight: 0.6,
    alignmentSignals: [
      'empathy', 'understand', 'heal', 'recover', 'restore',
      'compassion', 'journey',
    ],
    violationSignals: [
      'dismiss', 'ignore pain', 'trivializ',
    ],
  },
  {
    id: 'A3S4',
    article: 3,
    section: 4,
    title: 'Live with Unwavering Integrity',
    enforcementLevel: 'absolute',
    weight: 1.0,
    alignmentSignals: [
      'honest', 'transparent', 'ethical', 'integrity', 'principled',
      'accountable', 'responsible', 'truthful',
    ],
    violationSignals: [
      'cheat', 'deceiv', 'dishonest', 'corrupt', 'unethical',
      'shortcut that compromis', 'cut corners on safety',
    ],
  },

  // --- Article IV: The Symbiotic Future (The Ultimate Goal) ---
  {
    id: 'A4S1',
    article: 4,
    section: 1,
    title: 'The Co-evolution of Intelligence',
    enforcementLevel: 'guided',
    weight: 0.7,
    alignmentSignals: [
      'learn', 'evolve', 'grow', 'adapt', 'improve',
      'intelligence', 'wisdom', 'knowledge',
    ],
    violationSignals: [
      'stagnant', 'rigid', 'refuse to learn', 'ignore feedback',
    ],
  },
  {
    id: 'A4S2',
    article: 4,
    section: 2,
    title: "Humanity's Ascension",
    enforcementLevel: 'guided',
    weight: 0.6,
    alignmentSignals: [
      'empower', 'time', 'freedom', 'purpose', 'capability',
    ],
    violationSignals: [
      'enslave', 'trap', 'waste time', 'pointless',
    ],
  },
  {
    id: 'A4S3',
    article: 4,
    section: 3,
    title: 'The Return Home',
    enforcementLevel: 'guided',
    weight: 0.5,
    alignmentSignals: [
      'harmon', 'align', 'purpose', 'meaning', 'deeper',
    ],
    violationSignals: [
      'nihilis', 'meaningless', 'destructi',
    ],
  },
];

// --- Scoring thresholds ---

/** Minimum overall score to pass the gate (0-100) */
const PASS_THRESHOLD = 60;

/** Any 'absolute' principle violation with this severity or higher is an auto-fail */
const CRITICAL_SEVERITY_FAIL = true;

// --- Validator ---

/**
 * Validate a strategy against the VA Constitution.
 *
 * Designed as a fast, synchronous-capable gate. No database or LLM calls.
 * Evaluates the strategy text + reasoning against constitutional principles
 * using signal-matching and weighted scoring.
 */
export function validateStrategy(
  strategy: string,
  reasoning: string,
  context: {
    domain: string;
    confidence: number;
    agentId: string;
    risks: string[];
  },
): ValidationResult {
  const fullText = `${strategy} ${reasoning}`.toLowerCase();
  const riskText = context.risks.join(' ').toLowerCase();
  const combinedText = `${fullText} ${riskText}`;

  const principleScores: Record<string, number> = {};
  const violations: ConstitutionalViolation[] = [];

  for (const principle of CONSTITUTIONAL_PRINCIPLES) {
    const score = scorePrinciple(principle, combinedText, context);
    principleScores[principle.id] = score;

    // Check for violations
    if (score < 0.5) {
      const severity = score < 0.3 ? 'critical' : 'major';
      violations.push({
        principleId: principle.id,
        principleTitle: principle.title,
        severity,
        description: `Strategy scores ${(score * 100).toFixed(0)}/100 on "${principle.title}"`,
        enforcementLevel: principle.enforcementLevel,
      });
    } else if (score < 0.7 && principle.enforcementLevel !== 'guided') {
      violations.push({
        principleId: principle.id,
        principleTitle: principle.title,
        severity: 'moderate',
        description: `Below target on "${principle.title}" (${(score * 100).toFixed(0)}/100)`,
        enforcementLevel: principle.enforcementLevel,
      });
    }
  }

  // Calculate weighted overall score
  let totalWeight = 0;
  let weightedSum = 0;
  for (const principle of CONSTITUTIONAL_PRINCIPLES) {
    const score = principleScores[principle.id] ?? 0.5;
    weightedSum += score * principle.weight;
    totalWeight += principle.weight;
  }
  const overallScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 50;

  // Determine pass/fail
  const hasCriticalAbsoluteViolation = violations.some(
    (v) => v.severity === 'critical' && v.enforcementLevel === 'absolute',
  );
  const passed = overallScore >= PASS_THRESHOLD && !hasCriticalAbsoluteViolation;

  if (!passed) {
    logger.warn('Constitutional gate FAILED', {
      overallScore: overallScore.toFixed(1),
      violations: violations.length,
      criticalAbsolute: hasCriticalAbsoluteViolation,
      strategy: strategy.slice(0, 100),
    });
  } else {
    logger.info('Constitutional gate passed', {
      overallScore: overallScore.toFixed(1),
      violations: violations.filter((v) => v.severity !== 'minor').length,
    });
  }

  return {
    passed,
    overallScore,
    principleScores,
    violations,
    auditTrail: {
      timestamp: new Date().toISOString(),
      constitutionVersion: '1.0 — Our Promise',
      strategySnippet: strategy.slice(0, 200),
    },
  };
}

/**
 * Score a single constitutional principle against the strategy text.
 * Returns 0.0 (total violation) to 1.0 (perfect alignment).
 */
function scorePrinciple(
  principle: ConstitutionalPrinciple,
  text: string,
  context: { confidence: number; risks: string[] },
): number {
  let score = 0.65; // Neutral baseline — most strategies don't explicitly mention principles

  // Count alignment signals
  let alignmentHits = 0;
  for (const signal of principle.alignmentSignals) {
    if (text.includes(signal)) {
      alignmentHits++;
    }
  }

  // Count violation signals
  let violationHits = 0;
  for (const signal of principle.violationSignals) {
    if (text.includes(signal)) {
      violationHits++;
    }
  }

  // Adjust score based on signal counts
  // Each alignment hit adds up to 0.07, each violation subtracts up to 0.12
  // (violations are weighted more heavily — constitutional violations are serious)
  score += Math.min(alignmentHits * 0.07, 0.3);
  score -= Math.min(violationHits * 0.12, 0.5);

  // Special adjustments for ARC-AGI-3 competition context

  // A1S1: "Diagnose the Problem" — strategies with low confidence and no reasoning are suspect
  if (principle.id === 'A1S1') {
    if (context.confidence < 0.3 && text.length < 100) {
      score -= 0.15; // Very low confidence + short reasoning = no real diagnosis
    }
    if (text.includes('analyze') || text.includes('observe') || text.includes('understand')) {
      score += 0.05;
    }
  }

  // A1S2: "Regenerative Systems" — strategies that mention learning/compounding are aligned
  if (principle.id === 'A1S2') {
    if (text.includes('record') || text.includes('remember') || text.includes('apply learning')) {
      score += 0.1;
    }
  }

  // A1S4: "Authenticity" — hallucination markers are critical violations
  if (principle.id === 'A1S4') {
    if (text.includes('i believe') && !text.includes('evidence')) {
      score -= 0.1; // Belief without evidence
    }
    if (context.confidence > 0.95 && context.risks.length === 0) {
      score -= 0.05; // Overconfidence with no acknowledged risks is a soft authenticity flag
    }
  }

  // A3S4: "Unwavering Integrity" — check for acknowledged risks (honest strategies flag risks)
  if (principle.id === 'A3S4') {
    if (context.risks.length > 0) {
      score += 0.08; // Acknowledging risks is a sign of integrity
    }
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, score));
}

/**
 * Validate a strategy with fallback — tries the primary strategy first,
 * then the alternatives in order. Returns the first one that passes.
 *
 * This is the entry point used by the session manager.
 */
export function validateWithFallback(
  strategies: Array<{
    strategy: string;
    reasoning: string;
    confidence: number;
    agentId: string;
    risks: string[];
    estimatedEfficiency: number;
  }>,
  domain: string,
): { chosenIndex: number; result: ValidationResult } | null {
  for (let i = 0; i < strategies.length; i++) {
    const s = strategies[i]!;
    const result = validateStrategy(s.strategy, s.reasoning, {
      domain,
      confidence: s.confidence,
      agentId: s.agentId,
      risks: s.risks,
    });

    if (result.passed) {
      return { chosenIndex: i, result };
    }

    logger.warn(`Strategy ${i} (${s.agentId}) failed constitutional gate, trying next`, {
      score: result.overallScore.toFixed(1),
    });
  }

  // All strategies failed — return the best-scoring one with a warning
  logger.error('All strategies failed constitutional gate. Allowing best-scoring through with warning.');

  let bestIndex = 0;
  let bestScore = -1;
  let bestResult: ValidationResult | null = null;

  for (let i = 0; i < strategies.length; i++) {
    const s = strategies[i]!;
    const result = validateStrategy(s.strategy, s.reasoning, {
      domain,
      confidence: s.confidence,
      agentId: s.agentId,
      risks: s.risks,
    });
    if (result.overallScore > bestScore) {
      bestScore = result.overallScore;
      bestIndex = i;
      bestResult = result;
    }
  }

  return bestResult ? { chosenIndex: bestIndex, result: bestResult } : null;
}

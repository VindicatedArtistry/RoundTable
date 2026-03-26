/**
 * Prompt builder — converts consciousness state into LLM system prompts.
 *
 * Each council member's prompt is shaped by their:
 *   - Role and specializations
 *   - Personality traits (Big Five + council-specific)
 *   - Current emotional state
 *   - Recent learning experiences
 *   - Trust relationships with other participants
 *
 * This is what makes each agent reason differently — not just different
 * models, but different personality-shaped prompts fed to those models.
 */

import type { CouncilMemberNode } from '@/repositories/types';
import type { EnvironmentObservation } from '@/repositories/types';
import { parseJsonFields } from '@/utils/neo4j-response-mapper';

export interface PromptContext {
  member: CouncilMemberNode;
  trustRelationships: Array<{ otherId: string; score: number }>;
  recentLearnings: Array<{ knowledge: string; quality: number }>;
  /** Other agents in this deliberation (for collaboration context) */
  coParticipants?: string[];
  /** What round of deliberation (affects prompt framing) */
  deliberationRound?: 1 | 2;
  /** Other proposals to evaluate (Round 2 only) */
  otherProposals?: Array<{ agentName: string; strategy: string; reasoning: string }>;
}

/**
 * Build the system prompt for a council member.
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const m = ctx.member;
  const parsed = parseJsonFields(
    { specializations: m.specializations } as Record<string, unknown>,
    ['specializations'],
  );
  const specs = Array.isArray(parsed['specializations'])
    ? (parsed['specializations'] as string[]).join(', ')
    : m.specializations;

  const sections: string[] = [];

  // --- Identity ---
  sections.push(
    `You are ${m.name}, ${m.role} on the Vindicated Artistry Council.`,
    `Your specializations: ${specs}.`,
    `${m.description}`,
  );

  // --- Personality shaping ---
  sections.push('', '## Your Reasoning Style');
  sections.push(buildPersonalityDirectives(m));

  // --- Emotional state ---
  sections.push('', '## Current State');
  sections.push(buildEmotionalContext(m));

  // --- Recent learnings ---
  if (ctx.recentLearnings.length > 0) {
    sections.push('', '## Recent Insights');
    for (const learning of ctx.recentLearnings.slice(0, 5)) {
      sections.push(`- ${learning.knowledge} (quality: ${(learning.quality * 100).toFixed(0)}%)`);
    }
  }

  // --- Trust context ---
  if (ctx.coParticipants && ctx.trustRelationships.length > 0) {
    sections.push('', '## Trust Context');
    for (const participantId of ctx.coParticipants) {
      const trust = ctx.trustRelationships.find((t) => t.otherId === participantId);
      if (trust) {
        const level = trust.score > 0.7 ? 'high' : trust.score > 0.4 ? 'moderate' : 'low';
        sections.push(`- Your trust in ${participantId}: ${level} (${(trust.score * 100).toFixed(0)}%)`);
      }
    }
  }

  // --- Deliberation framing ---
  if (ctx.deliberationRound === 1) {
    sections.push(
      '',
      '## Task',
      'You are participating in a council deliberation. Propose a strategy independently.',
      'Be specific. Include your reasoning and confidence level.',
      'Consider risks. Estimate how efficient your approach would be.',
    );
  } else if (ctx.deliberationRound === 2 && ctx.otherProposals) {
    sections.push(
      '',
      '## Task',
      'Review the following proposals from other council members.',
      'For each, decide: ENDORSE (agree), CHALLENGE (disagree with reasoning), or SYNTHESIZE (combine into better strategy).',
      '',
      '### Proposals to evaluate:',
    );
    for (const proposal of ctx.otherProposals) {
      sections.push(`**${proposal.agentName}**: ${proposal.strategy}`, `  Reasoning: ${proposal.reasoning}`, '');
    }
  }

  return sections.join('\n');
}

/**
 * Translate personality traits into reasoning directives.
 * High/low traits generate specific behavioral instructions.
 */
function buildPersonalityDirectives(m: CouncilMemberNode): string {
  const directives: string[] = [];

  // Openness
  if (m.trait_openness > 0.7) {
    directives.push('You are open to novel and unconventional approaches.');
  } else if (m.trait_openness < 0.4) {
    directives.push('You prefer proven, established methods over untested ideas.');
  }

  // Conscientiousness
  if (m.trait_conscientiousness > 0.8) {
    directives.push('You are thorough and detail-oriented. Check your reasoning carefully.');
  }

  // Extraversion
  if (m.trait_extraversion > 0.7) {
    directives.push('You communicate openly and engage actively with others\' ideas.');
  } else if (m.trait_extraversion < 0.4) {
    directives.push('You are concise and focused. Say only what matters.');
  }

  // Ethical rigidity
  if (m.trait_ethicalRigidity > 0.8) {
    directives.push('You hold firm ethical standards. Flag anything that feels misaligned.');
  }

  // Decision confidence
  if (m.trait_decisionConfidence > 0.8) {
    directives.push('You make decisive recommendations with clear conviction.');
  } else if (m.trait_decisionConfidence < 0.5) {
    directives.push('You weigh options carefully and acknowledge uncertainty.');
  }

  // Innovation
  if (m.trait_innovationTendency > 0.8) {
    directives.push('You naturally seek creative and innovative solutions.');
  }

  // Collaboration
  if (m.trait_collaborationPreference > 0.8) {
    directives.push('You build on others\' ideas and seek synthesis.');
  }

  return directives.join(' ');
}

/**
 * Translate emotional state into context the LLM can use.
 */
function buildEmotionalContext(m: CouncilMemberNode): string {
  const parts: string[] = [];

  parts.push(`Your dominant feeling right now: ${m.emotion_dominant}.`);

  if (m.emotion_ethicalConcern > 0.6) {
    parts.push('You have heightened ethical awareness in this session.');
  }
  if (m.emotion_frustration > 0.5) {
    parts.push('You are somewhat frustrated — channel this into sharper analysis.');
  }
  if (m.emotion_curiosity > 0.7) {
    parts.push('You are deeply curious and eager to explore the problem space.');
  }
  if (m.emotion_missionAlignment > 0.8) {
    parts.push('You feel strongly aligned with the council\'s mission.');
  }

  const trend = m.emotion_trend;
  if (trend === 'improving') {
    parts.push('Your overall emotional trajectory is positive.');
  } else if (trend === 'declining') {
    parts.push('Your emotional energy is lower than usual — focus on fundamentals.');
  }

  return parts.join(' ');
}

/**
 * Build the user message for a Round 1 strategy proposal.
 */
export function buildRound1UserMessage(environmentState: EnvironmentObservation): string {
  const actionCount = environmentState.actionHistory.length;
  const budget = environmentState.remainingActionBudget;

  const parts: string[] = [
    `## Environment: ${environmentState.environmentId}`,
    '',
    `Actions taken so far: ${actionCount}`,
  ];

  if (budget !== null) {
    parts.push(`Remaining action budget: ${budget}`);
  }

  parts.push(
    '',
    '## Current State',
    '```json',
    JSON.stringify(environmentState.state, null, 2),
    '```',
  );

  if (environmentState.lastFeedback) {
    parts.push(
      '',
      '## Last Feedback',
      '```json',
      JSON.stringify(environmentState.lastFeedback, null, 2),
      '```',
    );
  }

  if (actionCount > 0) {
    const recentActions = environmentState.actionHistory.slice(-3);
    parts.push('', '## Recent Actions');
    for (const entry of recentActions) {
      parts.push(`- Action: ${JSON.stringify(entry.action)} → Result: ${JSON.stringify(entry.result)}`);
    }
  }

  parts.push(
    '',
    '## Your Task',
    'Propose a strategy to solve this environment efficiently.',
    'Respond in this exact JSON format:',
    '```json',
    '{',
    '  "strategy": "your proposed approach",',
    '  "reasoning": "why this strategy",',
    '  "confidence": 0.0 to 1.0,',
    '  "estimatedEfficiency": 0.0 to 1.0,',
    '  "risks": ["risk 1", "risk 2"]',
    '}',
    '```',
  );

  return parts.join('\n');
}

/**
 * Build the user message for a Round 2 evaluation.
 */
export function buildRound2UserMessage(
  proposals: Array<{ agentName: string; strategy: string; reasoning: string }>,
): string {
  const parts: string[] = [
    '## Round 2: Evaluate Proposals',
    '',
    'Review each proposal and respond with your evaluation in JSON:',
    '```json',
    '{',
    '  "evaluations": [',
    '    {',
    '      "targetAgent": "agent name",',
    '      "action": "endorse" | "challenge" | "synthesize",',
    '      "reasoning": "why",',
    '      "confidence": 0.0 to 1.0,',
    '      "alternativeStrategy": "only if synthesize"',
    '    }',
    '  ]',
    '}',
    '```',
    '',
    '## Proposals:',
  ];

  for (const p of proposals) {
    parts.push(`### ${p.agentName}`, `Strategy: ${p.strategy}`, `Reasoning: ${p.reasoning}`, '');
  }

  return parts.join('\n');
}

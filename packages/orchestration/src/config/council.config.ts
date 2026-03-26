/**
 * Council bootstrap configuration.
 * Wires all 14 AI members to their LLM providers with fallback assignments.
 *
 * Resilience strategy (Carta Phase 2 review):
 *   - Every agent has a fallback model from a different provider
 *   - If primary is down, fallback activates automatically
 *   - If both are down, agent is excluded from deliberation
 */

import { LLMRouter, type ModelAssignment } from '@/services/llm/router';
import { VertexAIAnthropicProvider, VertexAIGoogleProvider } from '@/services/llm/vertex-ai.provider';
import {
  createAlibabaProvider,
  createDeepSeekProvider,
  createMistralProvider,
  createXAIProvider,
  createMoonshotProvider,
} from '@/services/llm/openai-compatible.provider';
import { BaseCouncilAgent } from '@/agents/base/base-council-agent';
import { DeliberationEngine } from '@/agents/orchestration/deliberation-engine';
import type { CouncilAgentType } from '@/agents/base/agent.interface';
import { createLogger } from '@/utils/logger';

const logger = createLogger('council-config');

/**
 * All 14 AI member assignments with fallback providers.
 * Fallbacks cross provider boundaries — if Google is down,
 * fallback to Anthropic or vice versa.
 */
const MODEL_ASSIGNMENTS: ModelAssignment[] = [
  // --- Vertex AI: Anthropic (primary) → Google (fallback) ---
  { memberId: 'aether', modelId: 'claude-opus-4-6-20260301', provider: 'anthropic', fallbackModelId: 'gemini-3-pro', fallbackProvider: 'google' },
  { memberId: 'forge', modelId: 'claude-sonnet-4-6-20260301', provider: 'anthropic', fallbackModelId: 'gemini-3-flash', fallbackProvider: 'google' },
  { memberId: 'carta', modelId: 'claude-opus-4-6-20260301', provider: 'anthropic', fallbackModelId: 'gemini-3-pro', fallbackProvider: 'google' },

  // --- Vertex AI: Google (primary) → Anthropic (fallback) ---
  { memberId: 'kairo', modelId: 'gemini-3-pro', provider: 'google', fallbackModelId: 'claude-sonnet-4-6-20260301', fallbackProvider: 'anthropic' },
  { memberId: 'sterling', modelId: 'gemini-3-pro', provider: 'google', fallbackModelId: 'claude-sonnet-4-6-20260301', fallbackProvider: 'anthropic' },
  { memberId: 'veritas', modelId: 'gemini-3-flash', provider: 'google', fallbackModelId: 'claude-sonnet-4-6-20260301', fallbackProvider: 'anthropic' },
  { memberId: 'pragma', modelId: 'gemini-3-flash', provider: 'google', fallbackModelId: 'claude-sonnet-4-6-20260301', fallbackProvider: 'anthropic' },

  // --- Direct API: Alibaba (primary) → Google (fallback) ---
  { memberId: 'skaldir', modelId: 'qwen3-235b-a22b', provider: 'alibaba', fallbackModelId: 'gemini-3-pro', fallbackProvider: 'google' },
  { memberId: 'amaru', modelId: 'qwen3-235b-a22b', provider: 'alibaba', fallbackModelId: 'gemini-3-flash', fallbackProvider: 'google' },
  { memberId: 'lyra', modelId: 'qwen3-235b-a22b', provider: 'alibaba', fallbackModelId: 'gemini-3-flash', fallbackProvider: 'google' },

  // --- Direct API: Others (primary) → Vertex AI (fallback) ---
  { memberId: 'nexus', modelId: 'deepseek-r1', provider: 'deepseek', fallbackModelId: 'gemini-3-pro', fallbackProvider: 'google' },
  { memberId: 'axiom', modelId: 'mistral-large', provider: 'mistral', fallbackModelId: 'claude-sonnet-4-6-20260301', fallbackProvider: 'anthropic' },
  { memberId: 'agape', modelId: 'grok-4.1', provider: 'xai', fallbackModelId: 'gemini-3-pro', fallbackProvider: 'google' },
  { memberId: 'eira', modelId: 'kimi-k2', provider: 'moonshot', fallbackModelId: 'gemini-3-flash', fallbackProvider: 'google' },
];

/**
 * Agent type mapping for each AI member.
 */
const AGENT_TYPES: Record<string, CouncilAgentType> = {
  kairo: 'strategic',
  aether: 'technical',
  sterling: 'financial',
  skaldir: 'communications',
  nexus: 'operations',
  veritas: 'ethics',
  axiom: 'technical',
  amaru: 'assistant',
  agape: 'intelligence',
  forge: 'implementation',
  eira: 'operations',
  lyra: 'communications',
  pragma: 'tactical',
  carta: 'integration',
};

const AGENT_NAMES: Record<string, string> = {
  kairo: 'Kairo', aether: 'Aether', sterling: 'Sterling', skaldir: 'Skaldir',
  nexus: 'Nexus', veritas: 'Veritas', axiom: 'Axiom', amaru: 'Amaru',
  agape: 'Agape', forge: 'Forge', eira: 'Eira', lyra: 'Lyra',
  pragma: 'Pragma', carta: 'Carta',
};

/**
 * Initialize the full council — providers, router, agents, deliberation engine.
 * Call this once at server startup.
 */
export async function bootstrapCouncil(): Promise<{
  router: LLMRouter;
  agents: Map<string, BaseCouncilAgent>;
  engine: DeliberationEngine;
}> {
  logger.info('Bootstrapping council...');

  // --- 1. Initialize providers ---
  const anthropicProvider = new VertexAIAnthropicProvider();
  const googleProvider = new VertexAIGoogleProvider();
  const alibabaProvider = createAlibabaProvider();
  const deepseekProvider = createDeepSeekProvider();
  const mistralProvider = createMistralProvider();
  const xaiProvider = createXAIProvider();
  const moonshotProvider = createMoonshotProvider();

  await anthropicProvider.initialize({
    apiEndpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });

  await googleProvider.initialize({
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    projectId: process.env['VERTEX_AI_PROJECT_ID'],
    region: process.env['VERTEX_AI_LOCATION'],
  });

  await alibabaProvider.initialize({
    apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env['ALIBABA_API_KEY'],
    providerName: 'alibaba',
    models: ['qwen3-235b-a22b'],
  });

  await deepseekProvider.initialize({
    apiEndpoint: 'https://api.deepseek.com/v1',
    apiKey: process.env['DEEPSEEK_API_KEY'],
    providerName: 'deepseek',
    models: ['deepseek-r1'],
  });

  await mistralProvider.initialize({
    apiEndpoint: 'https://api.mistral.ai/v1',
    apiKey: process.env['MISTRAL_API_KEY'],
    providerName: 'mistral',
    models: ['mistral-large'],
  });

  await xaiProvider.initialize({
    apiEndpoint: 'https://api.x.ai/v1',
    apiKey: process.env['XAI_API_KEY'],
    providerName: 'xai',
    models: ['grok-4.1'],
  });

  await moonshotProvider.initialize({
    apiEndpoint: 'https://api.moonshot.cn/v1',
    apiKey: process.env['MOONSHOT_API_KEY'],
    providerName: 'moonshot',
    models: ['kimi-k2'],
  });

  // --- 2. Configure router ---
  const router = new LLMRouter();
  router.registerProvider('anthropic', anthropicProvider);
  router.registerProvider('google', googleProvider);
  router.registerProvider('alibaba', alibabaProvider);
  router.registerProvider('deepseek', deepseekProvider);
  router.registerProvider('mistral', mistralProvider);
  router.registerProvider('xai', xaiProvider);
  router.registerProvider('moonshot', moonshotProvider);

  for (const assignment of MODEL_ASSIGNMENTS) {
    router.assignModel(assignment);
  }

  logger.info(`Router configured: ${router.getRegisteredProviders().length} providers, ${MODEL_ASSIGNMENTS.length} assignments`);

  // --- 3. Create agents ---
  const agents = new Map<string, BaseCouncilAgent>();

  for (const assignment of MODEL_ASSIGNMENTS) {
    const agentType = AGENT_TYPES[assignment.memberId];
    const agentName = AGENT_NAMES[assignment.memberId];
    if (!agentType || !agentName) continue;

    const agent = new BaseCouncilAgent(
      assignment.memberId,
      agentType,
      agentName,
      assignment.modelId,
      assignment.provider,
      router,
    );

    agents.set(assignment.memberId, agent);
  }

  logger.info(`Created ${agents.size} council agents`);

  // --- 4. Create deliberation engine ---
  const engine = new DeliberationEngine(
    {
      maxParticipants: parseInt(process.env['DELIBERATION_MAX_PARTICIPANTS'] ?? '5', 10),
      convergenceThreshold: parseFloat(process.env['DELIBERATION_CONVERGENCE_THRESHOLD'] ?? '0.667'),
      timeoutMs: parseInt(process.env['DELIBERATION_TIMEOUT_MS'] ?? '30000', 10),
    },
    router,
  );

  for (const agent of agents.values()) {
    engine.registerAgent(agent);
  }

  logger.info(`Deliberation engine ready: ${engine.getRegisteredAgentCount()} agents registered`);

  // --- 5. Health check all providers ---
  const health = await router.healthCheckAll();
  for (const [providerName, status] of health) {
    const icon = status.status === 'healthy' ? '✓' : status.status === 'degraded' ? '~' : '✗';
    logger.info(`  ${icon} ${providerName}: ${status.status} (${status.latencyMs}ms)`);
  }

  return { router, agents, engine };
}

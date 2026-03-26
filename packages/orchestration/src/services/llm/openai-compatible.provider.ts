/**
 * OpenAI-compatible provider — generic implementation for providers
 * that expose an OpenAI-compatible chat completions API.
 *
 * Covers 7 of 14 AI members across 5 providers:
 *   Alibaba (Qwen3-235B):  Skaldir, Amaru, Lyra
 *   DeepSeek (R1):          Nexus
 *   Mistral (Large):        Axiom
 *   xAI (Grok 4.1):        Agape
 *   Moonshot (Kimi K2):    Eira
 *
 * All these providers support the OpenAI /v1/chat/completions format.
 * One implementation, five providers.
 */

import { createLogger } from '@/utils/logger';
import type {
  ILLMProvider,
  LLMProviderConfig,
  GenerateRequest,
  GenerateResponse,
} from './provider.interface';

const logger = createLogger('openai-compatible');

export interface OpenAICompatibleConfig extends LLMProviderConfig {
  /** Display name for logging */
  providerName: string;
  /** Supported model IDs */
  models: string[];
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAICompatibleProvider implements ILLMProvider {
  readonly name: string;
  readonly supportedModels: string[];

  private config: OpenAICompatibleConfig | null = null;

  constructor(name: string, models: string[]) {
    this.name = name;
    this.supportedModels = models;
  }

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.config = config as OpenAICompatibleConfig;
    logger.info(`${this.name} provider initialized`, { endpoint: config.apiEndpoint });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.config) throw new Error(`${this.name} provider not initialized`);

    const startTime = Date.now();

    const messages = [
      { role: 'system' as const, content: request.systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const body = {
      model: request.modelId,
      messages,
      temperature: request.temperature,
      top_p: request.topP,
      max_tokens: request.maxTokens,
    };

    const response = await fetch(`${this.config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.name} API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    const content = data.choices[0]?.message?.content ?? '';

    return {
      content,
      modelId: request.modelId,
      provider: this.name,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      latencyMs: Date.now() - startTime,
    };
  }

  private lastHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private static readonly HEALTH_CACHE_MS = 30_000;

  async isAvailable(): Promise<boolean> {
    if (!this.config?.apiKey) return false;

    if (Date.now() - this.lastHealthCheck < OpenAICompatibleProvider.HEALTH_CACHE_MS) {
      return this.lastHealthy;
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      this.lastHealthy = response.ok;
      this.lastHealthCheck = Date.now();
      return response.ok;
    } catch {
      this.lastHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latencyMs: number }> {
    if (!this.config) return { status: 'unhealthy', latencyMs: 0 };

    const start = Date.now();
    const available = await this.isAvailable();
    return {
      status: available ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Factory functions for each direct API provider.
 * Each returns a configured OpenAICompatibleProvider instance.
 */

export function createAlibabaProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('alibaba', ['qwen3-235b-a22b']);
}

export function createDeepSeekProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('deepseek', ['deepseek-r1']);
}

export function createMistralProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('mistral', ['mistral-large']);
}

export function createXAIProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('xai', ['grok-4.1']);
}

export function createMoonshotProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('moonshot', ['kimi-k2']);
}

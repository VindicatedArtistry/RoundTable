/**
 * Vertex AI provider — handles Anthropic (Claude) and Google (Gemini) models.
 * These are native on Vertex AI, routed through the aura-ba192 project.
 *
 * Covers 7 of 14 AI members:
 *   Anthropic: Aether (Opus 4.6), Forge (Sonnet 4.6), Carta (Opus 4.6)
 *   Google:    Kairo (Gemini 3 Pro), Sterling (Gemini 3 Pro),
 *              Veritas (Gemini 3 Flash), Pragma (Gemini 3 Flash)
 */

import Anthropic from '@anthropic-ai/sdk';
import { VertexAI } from '@google-cloud/vertexai';
import { createLogger } from '@/utils/logger';
import type {
  ILLMProvider,
  LLMProviderConfig,
  GenerateRequest,
  GenerateResponse,
} from './provider.interface';

const logger = createLogger('vertex-ai');

export class VertexAIAnthropicProvider implements ILLMProvider {
  readonly name = 'vertex-ai-anthropic';
  readonly supportedModels = ['claude-opus-4-6-20260301', 'claude-sonnet-4-6-20260301'];

  private client: Anthropic | null = null;
  private config: LLMProviderConfig | null = null;

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.config = config;

    // Anthropic SDK supports Vertex AI natively via environment or explicit config
    this.client = new Anthropic({
      apiKey: config.apiKey ?? process.env['ANTHROPIC_API_KEY'],
    });

    logger.info('Anthropic provider initialized via Vertex AI');
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.client) throw new Error('Anthropic provider not initialized');

    const startTime = Date.now();

    const response = await this.client.messages.create({
      model: request.modelId,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      system: request.systemPrompt,
      messages: request.messages.map((m) => ({
        role: m.role === 'system' ? 'user' as const : m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      content,
      modelId: request.modelId,
      provider: this.name,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      latencyMs: Date.now() - startTime,
    };
  }

  private lastHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private static readonly HEALTH_CACHE_MS = 30_000; // Cache health status for 30s

  async isAvailable(): Promise<boolean> {
    if (!this.client) return false;

    // Use cached health status if recent enough (avoid hammering the API)
    if (Date.now() - this.lastHealthCheck < VertexAIAnthropicProvider.HEALTH_CACHE_MS) {
      return this.lastHealthy;
    }

    try {
      await this.client.messages.count_tokens({
        model: this.supportedModels[0]!,
        messages: [{ role: 'user', content: 'ping' }],
      });
      this.lastHealthy = true;
      this.lastHealthCheck = Date.now();
      return true;
    } catch {
      this.lastHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latencyMs: number }> {
    if (!this.client) return { status: 'unhealthy', latencyMs: 0 };

    const start = Date.now();
    const available = await this.isAvailable();
    return {
      status: available ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - start,
    };
  }
}

export class VertexAIGoogleProvider implements ILLMProvider {
  readonly name = 'vertex-ai-google';
  readonly supportedModels = ['gemini-3-pro', 'gemini-3-flash'];

  private vertexAI: VertexAI | null = null;
  private config: LLMProviderConfig | null = null;

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.config = config;

    this.vertexAI = new VertexAI({
      project: config.projectId ?? process.env['VERTEX_AI_PROJECT_ID'] ?? 'aura-ba192',
      location: config.region ?? process.env['VERTEX_AI_LOCATION'] ?? 'us-central1',
    });

    logger.info('Google Vertex AI provider initialized', {
      project: config.projectId ?? process.env['VERTEX_AI_PROJECT_ID'],
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.vertexAI) throw new Error('Google provider not initialized');

    const startTime = Date.now();

    const model = this.vertexAI.getGenerativeModel({
      model: request.modelId,
      generationConfig: {
        temperature: request.temperature,
        topP: request.topP,
        maxOutputTokens: request.maxTokens,
      },
      systemInstruction: { role: 'system', parts: [{ text: request.systemPrompt }] },
    });

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({ contents });
    const response = result.response;
    const content = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const usage = response.usageMetadata;

    return {
      content,
      modelId: request.modelId,
      provider: this.name,
      usage: {
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
      },
      latencyMs: Date.now() - startTime,
    };
  }

  private lastHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private static readonly HEALTH_CACHE_MS = 30_000;

  async isAvailable(): Promise<boolean> {
    if (!this.vertexAI) return false;

    if (Date.now() - this.lastHealthCheck < VertexAIGoogleProvider.HEALTH_CACHE_MS) {
      return this.lastHealthy;
    }

    try {
      const model = this.vertexAI.getGenerativeModel({ model: this.supportedModels[0]! });
      await model.countTokens({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] });
      this.lastHealthy = true;
      this.lastHealthCheck = Date.now();
      return true;
    } catch {
      this.lastHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latencyMs: number }> {
    if (!this.vertexAI) return { status: 'unhealthy', latencyMs: 0 };

    const start = Date.now();
    const available = await this.isAvailable();
    return {
      status: available ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - start,
    };
  }
}

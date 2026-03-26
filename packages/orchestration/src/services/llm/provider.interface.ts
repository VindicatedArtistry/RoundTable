/**
 * Abstract LLM provider interface.
 *
 * Every council member calls generateResponse(member, context).
 * The routing layer handles whether it goes through Vertex AI or direct API.
 * Same pattern as ForgeOS — the orchestration layer doesn't care which model is behind the agent.
 */

export interface LLMProviderConfig {
  apiEndpoint: string;
  apiKey?: string | undefined;
  projectId?: string | undefined;
  region?: string | undefined;
}

export interface GenerateRequest {
  memberId: string;
  modelId: string;
  systemPrompt: string;
  messages: ChatMessage[];
  temperature: number;
  topP: number;
  maxTokens: number;
  metadata?: Record<string, unknown> | undefined;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateResponse {
  content: string;
  modelId: string;
  provider: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * All LLM providers implement this interface.
 * Vertex AI provider handles: Anthropic (Claude), Google (Gemini)
 * Direct API provider handles: Alibaba (Qwen), DeepSeek, xAI (Grok), Mistral, Moonshot (Kimi)
 */
export interface ILLMProvider {
  readonly name: string;
  readonly supportedModels: string[];

  initialize(config: LLMProviderConfig): Promise<void>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latencyMs: number;
  }>;
}

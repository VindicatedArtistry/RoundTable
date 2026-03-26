import { createLogger } from '@/utils/logger';
import type {
  ILLMProvider,
  GenerateRequest,
  GenerateResponse,
} from './provider.interface';

const logger = createLogger('llm-router');

export interface ModelAssignment {
  memberId: string;
  modelId: string;
  provider: string;
  /** Fallback model if primary is unavailable. Optional. */
  fallbackModelId?: string | undefined;
  /** Fallback provider if primary is unavailable. Optional. */
  fallbackProvider?: string | undefined;
}

/**
 * Result of attempting to generate a response — includes resilience metadata.
 */
export interface RoutingResult {
  response: GenerateResponse;
  usedFallback: boolean;
  originalProvider: string;
  actualProvider: string;
}

/**
 * Routes LLM requests to the correct provider based on member configuration.
 *
 * Every council member calls: router.generateResponse(memberId, context)
 * The router looks up the member's assigned model and provider, then routes.
 * Same pattern as ForgeOS's agent system where the orchestration layer
 * doesn't care which model is behind the agent.
 *
 * RESILIENCE STRATEGY (Carta review, Phase 2):
 *
 * If the primary provider is unavailable:
 *   1. Try the member's fallback model/provider if configured
 *   2. If no fallback or fallback also down, return { available: false }
 *
 * The deliberation engine uses isAgentAvailable() before selecting
 * participants. Unavailable agents are excluded from the deliberation —
 * the council works with whoever is online. For ARC-AGI-3 competition
 * conditions, you can't afford an agent going dark mid-deliberation.
 */
export class LLMRouter {
  private readonly providers: Map<string, ILLMProvider> = new Map();
  private readonly modelToProvider: Map<string, string> = new Map();
  private readonly memberAssignments: Map<string, ModelAssignment> = new Map();

  registerProvider(name: string, provider: ILLMProvider): void {
    this.providers.set(name, provider);
    for (const model of provider.supportedModels) {
      this.modelToProvider.set(model, name);
    }
  }

  assignModel(assignment: ModelAssignment): void {
    this.memberAssignments.set(assignment.memberId, assignment);
  }

  /**
   * Check if a member's LLM (primary or fallback) is available.
   * Called by the deliberation engine during participant selection.
   * Unavailable agents are excluded — the council adapts.
   */
  async isAgentAvailable(memberId: string): Promise<boolean> {
    const assignment = this.memberAssignments.get(memberId);
    if (!assignment) return false;

    // Try primary
    const primaryProvider = this.resolveProvider(assignment.modelId);
    if (primaryProvider) {
      try {
        if (await primaryProvider.isAvailable()) return true;
      } catch {
        // Primary down, try fallback
      }
    }

    // Try fallback
    if (assignment.fallbackModelId) {
      const fallbackProvider = this.resolveProvider(assignment.fallbackModelId);
      if (fallbackProvider) {
        try {
          if (await fallbackProvider.isAvailable()) return true;
        } catch {
          // Fallback also down
        }
      }
    }

    logger.warn(`Agent ${memberId} unavailable — primary (${assignment.provider}) and fallback both down`);
    return false;
  }

  /**
   * Generate a response with automatic fallback.
   * Tries primary provider first, then fallback if configured.
   * Throws only if both are unavailable.
   */
  async generateResponse(request: GenerateRequest): Promise<RoutingResult> {
    const assignment = this.memberAssignments.get(request.memberId);
    if (!assignment) {
      throw new Error(`No model assignment for member: ${request.memberId}`);
    }

    // Try primary provider
    const primaryProvider = this.resolveProvider(assignment.modelId);
    if (primaryProvider) {
      try {
        const isAvailable = await primaryProvider.isAvailable();
        if (isAvailable) {
          const response = await primaryProvider.generate({
            ...request,
            modelId: assignment.modelId,
          });
          return {
            response,
            usedFallback: false,
            originalProvider: assignment.provider,
            actualProvider: assignment.provider,
          };
        }
      } catch (error) {
        logger.warn(`Primary provider ${assignment.provider} failed for ${request.memberId}`, { error });
      }
    }

    // Try fallback provider
    if (assignment.fallbackModelId && assignment.fallbackProvider) {
      const fallbackProvider = this.resolveProvider(assignment.fallbackModelId);
      if (fallbackProvider) {
        try {
          const isAvailable = await fallbackProvider.isAvailable();
          if (isAvailable) {
            logger.info(`Falling back to ${assignment.fallbackProvider} for ${request.memberId}`);
            const response = await fallbackProvider.generate({
              ...request,
              modelId: assignment.fallbackModelId,
            });
            return {
              response,
              usedFallback: true,
              originalProvider: assignment.provider,
              actualProvider: assignment.fallbackProvider,
            };
          }
        } catch (error) {
          logger.warn(`Fallback provider ${assignment.fallbackProvider} also failed for ${request.memberId}`, { error });
        }
      }
    }

    throw new Error(
      `All providers unavailable for ${request.memberId}: ` +
      `primary=${assignment.provider}, fallback=${assignment.fallbackProvider ?? 'none'}`,
    );
  }

  private resolveProvider(modelId: string): ILLMProvider | undefined {
    const providerName = this.modelToProvider.get(modelId);
    if (!providerName) return undefined;
    return this.providers.get(providerName);
  }

  getMemberAssignment(memberId: string): ModelAssignment | undefined {
    return this.memberAssignments.get(memberId);
  }

  getRegisteredProviders(): string[] {
    return [...this.providers.keys()];
  }

  async healthCheckAll(): Promise<Map<string, { status: string; latencyMs: number }>> {
    const results = new Map<string, { status: string; latencyMs: number }>();
    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results.set(name, health);
      } catch {
        results.set(name, { status: 'unhealthy', latencyMs: -1 });
      }
    }
    return results;
  }
}

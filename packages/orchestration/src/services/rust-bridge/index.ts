/**
 * Rust Bridge — TypeScript wrapper for the NAPI-built Rust core.
 *
 * Imports the compiled .node file and provides typed access to:
 *   - RustMessageBus: lock-free inter-agent message routing
 *   - RustAgentRegistry: concurrent agent roster with status tracking
 *   - RustKnowledgeStore: in-memory consciousness cache (Wave 2)
 *
 * Boundary principle (Carta): Rust thinks, Node.js talks.
 *
 * Usage:
 *   import { rustBridge } from '@/services/rust-bridge';
 *   const state = rustBridge.knowledgeStore.getState('aether');
 */

import { createLogger } from '@/utils/logger';
import path from 'path';

const logger = createLogger('rust-bridge');

// --- Native module types ---

interface NativeMessageBus {
  subscribe(agentId: string): void;
  unsubscribe(agentId: string): void;
  publish(from: string, target: string, messageType: string, payload: string): void;
  subscriberCount(): number;
}

interface NativeAgentInfo {
  id: string;
  name: string;
  agentType: string;
  modelId: string;
  provider: string;
  status: string;
  capabilities: string[];
}

interface NativeAgentRegistry {
  register(id: string, name: string, agentType: string, modelId: string, provider: string, capabilities: string[]): void;
  unregister(agentId: string): NativeAgentInfo | null;
  get(agentId: string): NativeAgentInfo | null;
  findByType(agentType: string): NativeAgentInfo[];
  findAvailable(): NativeAgentInfo[];
  updateStatus(agentId: string, status: string): boolean;
  isAvailable(agentId: string): boolean;
  count(): number;
}

interface NativeKnowledgeStore {
  cacheState(stateJson: string): void;
  getState(agentId: string): string | null;
  hasValid(agentId: string): boolean;
  invalidate(agentId: string): void;
  invalidateAll(): void;
  updateTrait(agentId: string, traitName: string, value: number): boolean;
  updateTrust(agentId: string, otherId: string, score: number): boolean;
  getDirtyEntries(): string;
  markClean(agentIds: string[]): void;
  getModelParams(agentId: string): string | null;
  stats(): string;
}

// Wave 3+4: Standalone functions (not methods on a class)
interface NativeWave3 {
  classifyDomain(gridJson: string, actionCount: number, availableActions: number, recentDomains: string[]): string;
  selectParticipants(domain: string, candidatesJson: string, maxParticipants: number): string[];
  resolveConvergence(proposalsJson: string, evaluationsJson: string, participantCount: number, threshold: number): string;
}

interface NativeWave4 {
  validateStrategy(strategy: string, reasoning: string, confidence: number, risksCount: number): string;
  computeEvolutionDeltas(inputsJson: string): string;
}

interface NativeModule extends NativeWave3, NativeWave4 {
  RustMessageBus: new () => NativeMessageBus;
  RustAgentRegistry: new () => NativeAgentRegistry;
  RustKnowledgeStore: new (ttlSecs?: number) => NativeKnowledgeStore;
}

// --- Load native module ---

let nativeModule: NativeModule | null = null;

function loadNativeModule(): NativeModule | null {
  try {
    // Try to load from the orchestration package root
    const modulePath = path.resolve(__dirname, '../../../roundtable_napi.node');
    const mod = require(modulePath) as NativeModule;
    logger.info('Rust NAPI bridge loaded successfully');
    return mod;
  } catch (error) {
    logger.warn('Rust NAPI bridge not available — falling back to Node.js implementations', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// --- Typed wrappers ---

export interface RustBridge {
  available: boolean;
  messageBus: NativeMessageBus | null;
  agentRegistry: NativeAgentRegistry | null;
  knowledgeStore: NativeKnowledgeStore | null;
  /** Wave 3: Domain classification, agent selection, convergence */
  classifyDomain: ((gridJson: string, actionCount: number, availableActions: number, recentDomains: string[]) => string) | null;
  selectParticipants: ((domain: string, candidatesJson: string, maxParticipants: number) => string[]) | null;
  resolveConvergence: ((proposalsJson: string, evaluationsJson: string, participantCount: number, threshold: number) => string) | null;
  /** Wave 4: Constitutional gate, trait evolution */
  validateStrategy: ((strategy: string, reasoning: string, confidence: number, risksCount: number) => string) | null;
  computeEvolutionDeltas: ((inputsJson: string) => string) | null;
}

function createBridge(): RustBridge {
  nativeModule = loadNativeModule();

  if (!nativeModule) {
    return {
      available: false,
      messageBus: null,
      agentRegistry: null,
      knowledgeStore: null,
      classifyDomain: null,
      selectParticipants: null,
      resolveConvergence: null,
      validateStrategy: null,
      computeEvolutionDeltas: null,
    };
  }

  try {
    const messageBus = new nativeModule.RustMessageBus();
    const agentRegistry = new nativeModule.RustAgentRegistry();
    const knowledgeStore = new nativeModule.RustKnowledgeStore(60); // 60s TTL

    logger.info('Rust bridge initialized: MessageBus + AgentRegistry + KnowledgeStore + Wave3 + Wave4');

    return {
      available: true,
      messageBus,
      agentRegistry,
      knowledgeStore,
      classifyDomain: nativeModule.classifyDomain.bind(nativeModule),
      selectParticipants: nativeModule.selectParticipants.bind(nativeModule),
      resolveConvergence: nativeModule.resolveConvergence.bind(nativeModule),
      validateStrategy: nativeModule.validateStrategy.bind(nativeModule),
      computeEvolutionDeltas: nativeModule.computeEvolutionDeltas.bind(nativeModule),
    };
  } catch (error) {
    logger.error('Failed to initialize Rust bridge components', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      available: false,
      messageBus: null,
      agentRegistry: null,
      knowledgeStore: null,
      classifyDomain: null,
      selectParticipants: null,
      resolveConvergence: null,
      validateStrategy: null,
      computeEvolutionDeltas: null,
    };
  }
}

/** Singleton Rust bridge instance */
export const rustBridge = createBridge();

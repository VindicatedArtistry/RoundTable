/**
 * ARC-AGI-3 Environment Adapter — Phase 7
 *
 * Bridges the ARC-AGI-3 Python SDK with the TypeScript deliberation engine.
 *
 * Flow:
 *   1. Python agent observes frame → POSTs to /arc-agi/observe
 *   2. Adapter translates FrameData → EnvironmentObservation
 *   3. Adapter classifies problem domain from grid patterns
 *   4. Deliberation engine runs 2-round protocol
 *   5. Constitutional gate validates
 *   6. Adapter maps chosen strategy → GameAction
 *   7. Python agent receives action → submits to ARC-AGI-3
 *
 * Key constraint: ARC-AGI-3 scores on action efficiency (RHAE).
 * Every deliberation must justify its action cost.
 */

import { createLogger } from '@/utils/logger';
import type { ProblemDomain } from '@/agents/orchestration/deliberation-engine';
import type { EnvironmentObservation } from '@/repositories/types';

const logger = createLogger('arc-agi-adapter');

// --- ARC-AGI-3 Types (mirroring Python arcengine types) ---

export type GameState = 'NOT_PLAYED' | 'NOT_FINISHED' | 'WIN' | 'GAME_OVER';

export type GameActionName =
  | 'RESET'
  | 'ACTION1' | 'ACTION2' | 'ACTION3' | 'ACTION4'
  | 'ACTION5' | 'ACTION6' | 'ACTION7';

export interface FrameData {
  gameId: string;
  /** 2D grid — up to 64x64, values 0-15 */
  frame: number[][];
  state: GameState;
  levelsCompleted: number;
  winLevels: number[];
  guid: string;
  fullReset: boolean;
  availableActions: GameActionName[];
}

export interface ActionDecision {
  action: GameActionName;
  data?: { x: number; y: number };
  reasoning: {
    thought: string;
    confidence: number;
    deliberationId: string;
    convergenceMethod: string;
    participatingAgents: string[];
    constitutionallyValid: boolean;
    alternativesConsidered: string[];
  };
}

// --- Environment Session Tracking ---

export interface ArcEnvironmentSession {
  sessionId: string;
  gameId: string;
  frames: FrameData[];
  actionCount: number;
  levelsCompleted: number;
  startedAt: Date;
  lastActionAt: Date | null;
  /** History of strategies chosen per action — feeds back to consciousness graph */
  strategyHistory: Array<{
    actionIndex: number;
    domain: ProblemDomain;
    strategy: string;
    action: GameActionName;
    confidence: number;
  }>;
}

const activeSessions: Map<string, ArcEnvironmentSession> = new Map();

// --- Domain Classification ---

/**
 * Classify the problem domain from the current frame state.
 * This determines which agents participate in deliberation.
 *
 * The classifier analyzes grid patterns, available actions, and game history
 * to select the most appropriate domain.
 */
export function classifyDomain(
  frame: FrameData,
  session: ArcEnvironmentSession,
): ProblemDomain {
  const grid = frame.frame;
  const actions = new Set(frame.availableActions);
  const history = session.strategyHistory;

  // Spatial reasoning: grid has geometric patterns, symmetry, or spatial relationships
  if (hasSpatialPatterns(grid)) {
    return 'spatial_reasoning';
  }

  // Pattern recognition: repeated structures, color sequences, or transformations
  if (hasRepetitivePatterns(grid)) {
    return 'pattern_recognition';
  }

  // Resource optimization: limited actions, need to be efficient
  if (session.actionCount > 40 || actions.size <= 3) {
    return 'resource_optimization';
  }

  // Logical deduction: small grid with few distinct values (constraint satisfaction)
  const uniqueValues = countUniqueValues(grid);
  if (uniqueValues <= 4 && grid.length <= 16) {
    return 'logical_deduction';
  }

  // Strategic planning: early in the game, many actions available, need a plan
  if (session.actionCount < 5 && actions.size >= 5) {
    return 'strategic_planning';
  }

  // If we've been stuck (same domain, multiple failures), try system_integration
  if (history.length >= 3) {
    const lastThree = history.slice(-3);
    const allSameDomain = lastThree.every((h) => h.domain === lastThree[0]!.domain);
    if (allSameDomain) {
      return 'system_integration'; // Fresh perspective needed
    }
  }

  return 'unknown';
}

// --- Grid Analysis Helpers ---

function hasSpatialPatterns(grid: number[][]): boolean {
  if (grid.length === 0) return false;

  // Check for symmetry (horizontal or vertical)
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // Horizontal symmetry check (sample)
  let symmetricRows = 0;
  for (let r = 0; r < Math.min(rows, 8); r++) {
    const row = grid[r]!;
    let isSymmetric = true;
    for (let c = 0; c < Math.floor(cols / 2); c++) {
      if (row[c] !== row[cols - 1 - c]) {
        isSymmetric = false;
        break;
      }
    }
    if (isSymmetric) symmetricRows++;
  }

  // If >50% of sampled rows are symmetric, it's spatial
  return symmetricRows > Math.min(rows, 8) / 2;
}

function hasRepetitivePatterns(grid: number[][]): boolean {
  if (grid.length < 4) return false;

  // Check if rows repeat
  const rowStrings = grid.slice(0, 16).map((row) => row.join(','));
  const uniqueRows = new Set(rowStrings);
  return uniqueRows.size < rowStrings.length * 0.6; // >40% row repetition
}

function countUniqueValues(grid: number[][]): number {
  const values = new Set<number>();
  for (const row of grid) {
    for (const cell of row) {
      values.add(cell);
    }
  }
  return values.size;
}

// --- Frame → Observation Translation ---

/**
 * Convert ARC-AGI-3 FrameData into the deliberation engine's EnvironmentObservation.
 */
export function frameToObservation(
  frame: FrameData,
  session: ArcEnvironmentSession,
): EnvironmentObservation {
  return {
    environmentId: session.gameId,
    state: {
      grid: frame.frame,
      gridRows: frame.frame.length,
      gridCols: frame.frame[0]?.length ?? 0,
      uniqueValues: countUniqueValues(frame.frame),
      gameState: frame.state,
      levelsCompleted: frame.levelsCompleted,
      availableActions: frame.availableActions,
      actionCount: session.actionCount,
      maxActions: 80,
      actionsRemaining: 80 - session.actionCount,
      recentActions: session.strategyHistory.slice(-5).map((h) => ({
        action: h.action,
        domain: h.domain,
        confidence: h.confidence,
      })),
    },
    timestamp: new Date().toISOString(),
    actionHistory: session.strategyHistory.map((h) => h.action),
  };
}

// --- Strategy → Action Mapping ---

/**
 * Map a deliberation strategy to a concrete GameAction.
 *
 * The strategy text from the LLM is parsed for action intent.
 * This is the critical translation layer — the council decides WHAT to do,
 * this function translates it into HOW (which button to press).
 */
export function strategyToAction(
  strategy: string,
  availableActions: GameActionName[],
  frame: FrameData,
): ActionDecision {
  const stratLower = strategy.toLowerCase();
  const available = new Set(availableActions);

  // Check for explicit action references in the strategy
  for (const action of availableActions) {
    if (stratLower.includes(action.toLowerCase())) {
      const decision: ActionDecision = {
        action,
        reasoning: emptyReasoning(),
      };
      if (action === 'ACTION6') {
        decision.data = extractCoordinates(strategy, frame);
      }
      return decision;
    }
  }

  // Directional intent mapping
  if (available.has('ACTION1') && matchesDirection(stratLower, 'up')) {
    return { action: 'ACTION1', reasoning: emptyReasoning() };
  }
  if (available.has('ACTION2') && matchesDirection(stratLower, 'down')) {
    return { action: 'ACTION2', reasoning: emptyReasoning() };
  }
  if (available.has('ACTION3') && matchesDirection(stratLower, 'left')) {
    return { action: 'ACTION3', reasoning: emptyReasoning() };
  }
  if (available.has('ACTION4') && matchesDirection(stratLower, 'right')) {
    return { action: 'ACTION4', reasoning: emptyReasoning() };
  }

  // Interaction/selection intent
  if (available.has('ACTION5') && matchesInteraction(stratLower)) {
    return { action: 'ACTION5', reasoning: emptyReasoning() };
  }

  // Coordinate-based intent
  if (available.has('ACTION6') && matchesCoordinate(stratLower)) {
    return {
      action: 'ACTION6',
      data: extractCoordinates(strategy, frame),
      reasoning: emptyReasoning(),
    };
  }

  // Undo intent
  if (available.has('ACTION7') && matchesUndo(stratLower)) {
    return { action: 'ACTION7', reasoning: emptyReasoning() };
  }

  // Reset intent
  if (available.has('RESET') && (stratLower.includes('reset') || stratLower.includes('restart'))) {
    return { action: 'RESET', reasoning: emptyReasoning() };
  }

  // Fallback: pick the first non-reset available action
  const fallbackAction = availableActions.find((a) => a !== 'RESET') ?? 'RESET';
  logger.warn(`Could not map strategy to action, using fallback: ${fallbackAction}`, {
    strategySnippet: strategy.slice(0, 100),
  });

  return {
    action: fallbackAction as GameActionName,
    reasoning: emptyReasoning(),
  };
}

function matchesDirection(text: string, dir: string): boolean {
  const patterns: Record<string, string[]> = {
    up: ['up', 'north', 'above', 'top', 'ascend', 'higher'],
    down: ['down', 'south', 'below', 'bottom', 'descend', 'lower'],
    left: ['left', 'west', 'back', 'previous'],
    right: ['right', 'east', 'forward', 'next', 'advance'],
  };
  return (patterns[dir] ?? []).some((p) => text.includes(p));
}

function matchesInteraction(text: string): boolean {
  return ['select', 'click', 'activate', 'toggle', 'interact', 'use', 'pick', 'choose', 'execute', 'confirm', 'submit', 'rotate'].some(
    (p) => text.includes(p),
  );
}

function matchesCoordinate(text: string): boolean {
  return ['coordinate', 'position', 'place', 'at (', 'x:', 'y:', 'target', 'cell', 'grid position'].some(
    (p) => text.includes(p),
  );
}

function matchesUndo(text: string): boolean {
  return ['undo', 'revert', 'go back', 'take back', 'reverse'].some(
    (p) => text.includes(p),
  );
}

function extractCoordinates(strategy: string, frame: FrameData): { x: number; y: number } {
  // Try to extract explicit coordinates from strategy text
  const coordMatch = strategy.match(/(?:x[:\s]*(\d+)[\s,]*y[:\s]*(\d+))|(?:\((\d+)\s*,\s*(\d+)\))/i);
  if (coordMatch) {
    const x = parseInt(coordMatch[1] ?? coordMatch[3] ?? '32', 10);
    const y = parseInt(coordMatch[2] ?? coordMatch[4] ?? '32', 10);
    return { x: Math.min(63, Math.max(0, x)), y: Math.min(63, Math.max(0, y)) };
  }

  // Default: center of grid
  const rows = frame.frame.length;
  const cols = frame.frame[0]?.length ?? 0;
  return {
    x: Math.min(63, Math.floor(cols / 2)),
    y: Math.min(63, Math.floor(rows / 2)),
  };
}

function emptyReasoning(): ActionDecision['reasoning'] {
  return {
    thought: '',
    confidence: 0,
    deliberationId: '',
    convergenceMethod: '',
    participatingAgents: [],
    constitutionallyValid: false,
    alternativesConsidered: [],
  };
}

// --- Session Management ---

export function createSession(gameId: string): ArcEnvironmentSession {
  const session: ArcEnvironmentSession = {
    sessionId: `arc_${gameId}_${Date.now()}`,
    gameId,
    frames: [],
    actionCount: 0,
    levelsCompleted: 0,
    startedAt: new Date(),
    lastActionAt: null,
    strategyHistory: [],
  };
  activeSessions.set(session.sessionId, session);
  logger.info(`ARC-AGI-3 session created: ${session.sessionId}`, { gameId });
  return session;
}

export function getSession(sessionId: string): ArcEnvironmentSession | undefined {
  return activeSessions.get(sessionId);
}

export function recordAction(
  session: ArcEnvironmentSession,
  frame: FrameData,
  domain: ProblemDomain,
  strategy: string,
  action: GameActionName,
  confidence: number,
): void {
  session.frames.push(frame);
  session.actionCount++;
  session.levelsCompleted = frame.levelsCompleted;
  session.lastActionAt = new Date();
  session.strategyHistory.push({
    actionIndex: session.actionCount,
    domain,
    strategy: strategy.slice(0, 200),
    action,
    confidence,
  });
}

export function closeSession(sessionId: string): ArcEnvironmentSession | undefined {
  const session = activeSessions.get(sessionId);
  if (session) {
    activeSessions.delete(sessionId);
    logger.info(`ARC-AGI-3 session closed: ${sessionId}`, {
      gameId: session.gameId,
      actions: session.actionCount,
      levelsCompleted: session.levelsCompleted,
    });
  }
  return session;
}

export function getActiveSessions(): ArcEnvironmentSession[] {
  return [...activeSessions.values()];
}

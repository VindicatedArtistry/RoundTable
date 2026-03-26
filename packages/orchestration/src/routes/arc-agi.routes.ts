/**
 * ARC-AGI-3 API Routes — Phase 7
 *
 * These routes are the bridge between the Python ARC-AGI-3 agent and
 * the TypeScript deliberation engine. The Python agent:
 *
 *   1. POST /arc-agi/session       → Start a new game session
 *   2. POST /arc-agi/observe       → Send frame data, get action decision
 *   3. GET  /arc-agi/session/:id   → Get session state
 *   4. POST /arc-agi/session/:id/close → Close session, finalize learning
 */

import { Router, type Request, type Response } from 'express';
import { createLogger } from '@/utils/logger';
import { SessionManager } from '@/services/deliberation/session-manager';
import {
  createSession,
  getSession,
  closeSession,
  getActiveSessions,
  classifyDomain,
  frameToObservation,
  strategyToAction,
  recordAction,
  type FrameData,
  type ActionDecision,
  type GameActionName,
} from '@/services/arc-agi/adapter';

const logger = createLogger('arc-agi-routes');

export function createArcAgiRouter(sessionManager: SessionManager): Router {
  const router = Router();

  /**
   * POST /arc-agi/session
   * Start a new ARC-AGI-3 game session.
   */
  router.post('/session', (req: Request, res: Response): void => {
    const { gameId } = req.body as { gameId?: string };
    if (!gameId) {
      res.status(400).json({ error: 'gameId is required' });
      return;
    }

    const session = createSession(gameId);
    res.json({
      sessionId: session.sessionId,
      gameId: session.gameId,
      startedAt: session.startedAt.toISOString(),
    });
  });

  /**
   * POST /arc-agi/observe
   * Core endpoint: Python agent sends frame data, council deliberates, returns action.
   *
   * This is the hot path — every ARC-AGI-3 action goes through here.
   * The council observes → classifies → deliberates → validates → acts.
   */
  router.post('/observe', async (req: Request, res: Response): Promise<void> => {
    const { sessionId, frame } = req.body as {
      sessionId?: string;
      frame?: FrameData;
    };

    if (!sessionId || !frame) {
      res.status(400).json({ error: 'sessionId and frame are required' });
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: `Session not found: ${sessionId}` });
      return;
    }

    // Handle terminal states
    if (frame.state === 'WIN') {
      res.json({
        action: null,
        message: 'Game won — no action needed',
        levelsCompleted: frame.levelsCompleted,
      });
      return;
    }

    if (frame.state === 'GAME_OVER') {
      // Reset to try again
      const decision: ActionDecision = {
        action: 'RESET',
        reasoning: {
          thought: 'Game over — resetting to try again',
          confidence: 1.0,
          deliberationId: '',
          convergenceMethod: 'architect_tiebreak',
          participatingAgents: [],
          constitutionallyValid: true,
          alternativesConsidered: [],
        },
      };
      recordAction(session, frame, 'unknown', 'Reset after game over', 'RESET', 1.0);
      res.json(decision);
      return;
    }

    if (frame.state === 'NOT_PLAYED') {
      // Initial state — need to reset/start
      const decision: ActionDecision = {
        action: 'RESET',
        reasoning: {
          thought: 'Game not started — initializing',
          confidence: 1.0,
          deliberationId: '',
          convergenceMethod: 'architect_tiebreak',
          participatingAgents: [],
          constitutionallyValid: true,
          alternativesConsidered: [],
        },
      };
      recordAction(session, frame, 'unknown', 'Initialize game', 'RESET', 1.0);
      res.json(decision);
      return;
    }

    try {
      // --- 1. Classify problem domain from grid patterns ---
      const domain = classifyDomain(frame, session);

      // --- 2. Translate frame to deliberation-compatible observation ---
      const observation = frameToObservation(frame, session);

      // --- 3. Run council deliberation ---
      const deliberation = await sessionManager.runDeliberation(
        domain,
        observation,
        session.sessionId,
      );

      if (!deliberation.result) {
        throw new Error('Deliberation produced no result');
      }

      // --- 4. Map chosen strategy to concrete GameAction ---
      const actionDecision = strategyToAction(
        deliberation.result.chosenStrategy.strategy,
        frame.availableActions,
        frame,
      );

      // Enrich reasoning with deliberation metadata
      actionDecision.reasoning = {
        thought: deliberation.result.chosenStrategy.reasoning.slice(0, 500),
        confidence: deliberation.result.chosenStrategy.confidence,
        deliberationId: deliberation.result.id,
        convergenceMethod: deliberation.result.convergenceMethod,
        participatingAgents: deliberation.result.participatingAgents,
        constitutionallyValid: deliberation.result.constitutionallyValid,
        alternativesConsidered: deliberation.result.rounds
          .flatMap((r) => r.proposals)
          .filter((p) => p.agentId !== deliberation.result!.chosenStrategy.agentId)
          .map((p) => `${p.agentId}: ${p.strategy.slice(0, 100)}`)
          .slice(0, 5),
      };

      // --- 5. Record action in session history ---
      recordAction(
        session,
        frame,
        domain,
        deliberation.result.chosenStrategy.strategy,
        actionDecision.action,
        deliberation.result.chosenStrategy.confidence,
      );

      logger.info(`ARC-AGI-3 action decided`, {
        sessionId,
        gameId: session.gameId,
        action: actionDecision.action,
        domain,
        method: deliberation.result.convergenceMethod,
        confidence: deliberation.result.chosenStrategy.confidence,
        actionCount: session.actionCount,
        durationMs: deliberation.result.totalDurationMs,
      });

      res.json(actionDecision);
    } catch (error) {
      logger.error('ARC-AGI-3 observe failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: pick first available non-reset action to avoid wasting a turn
      const fallbackAction = frame.availableActions.find((a) => a !== 'RESET') ?? 'RESET';
      const fallback: ActionDecision = {
        action: fallbackAction as GameActionName,
        reasoning: {
          thought: `Deliberation failed: ${error instanceof Error ? error.message : 'unknown error'}. Using fallback action.`,
          confidence: 0.1,
          deliberationId: '',
          convergenceMethod: 'architect_tiebreak',
          participatingAgents: [],
          constitutionallyValid: false,
          alternativesConsidered: [],
        },
      };

      if (fallbackAction === 'ACTION6') {
        fallback.data = { x: 32, y: 32 };
      }

      recordAction(session, frame, 'unknown', 'Fallback after error', fallbackAction as GameActionName, 0.1);
      res.json(fallback);
    }
  });

  /**
   * GET /arc-agi/session/:id
   * Get current session state.
   */
  router.get('/session/:id', (req: Request, res: Response): void => {
    const session = getSession(req.params['id']!);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      sessionId: session.sessionId,
      gameId: session.gameId,
      actionCount: session.actionCount,
      levelsCompleted: session.levelsCompleted,
      startedAt: session.startedAt.toISOString(),
      lastActionAt: session.lastActionAt?.toISOString() ?? null,
      strategyHistory: session.strategyHistory,
    });
  });

  /**
   * POST /arc-agi/session/:id/close
   * Close a session and finalize.
   */
  router.post('/session/:id/close', (req: Request, res: Response): void => {
    const session = closeSession(req.params['id']!);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      sessionId: session.sessionId,
      gameId: session.gameId,
      finalActionCount: session.actionCount,
      finalLevelsCompleted: session.levelsCompleted,
      totalDurationMs: Date.now() - session.startedAt.getTime(),
      strategyHistory: session.strategyHistory,
    });
  });

  /**
   * GET /arc-agi/sessions
   * List all active sessions.
   */
  router.get('/sessions', (_req: Request, res: Response): void => {
    const sessions = getActiveSessions().map((s) => ({
      sessionId: s.sessionId,
      gameId: s.gameId,
      actionCount: s.actionCount,
      levelsCompleted: s.levelsCompleted,
    }));
    res.json({ sessions });
  });

  return router;
}

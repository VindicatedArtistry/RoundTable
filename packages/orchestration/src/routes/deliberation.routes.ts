/**
 * Deliberation API routes.
 *
 * POST /deliberation        — trigger a new deliberation
 * GET  /deliberation/active  — list active deliberations
 * GET  /deliberation/history — list recent completed deliberations
 * GET  /deliberation/:id     — get a specific session
 */

import { Router, type Request, type Response } from 'express';
import type { SessionManager } from '@/services/deliberation/session-manager';
import type { ProblemDomain } from '@/agents/orchestration/deliberation-engine';
import type { EnvironmentObservation } from '@/repositories/types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('deliberation-routes');

const VALID_DOMAINS: ProblemDomain[] = [
  'spatial_reasoning',
  'logical_deduction',
  'pattern_recognition',
  'strategic_planning',
  'resource_optimization',
  'ethical_evaluation',
  'system_integration',
  'unknown',
];

export function createDeliberationRouter(sessionManager: SessionManager): Router {
  const router = Router();

  /**
   * POST /deliberation
   * Trigger a new deliberation cycle.
   *
   * Body: {
   *   domain: ProblemDomain,
   *   environmentState: EnvironmentObservation,
   *   environmentSessionId?: string
   * }
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { domain, environmentState, environmentSessionId } = req.body as {
        domain: string;
        environmentState: EnvironmentObservation;
        environmentSessionId?: string;
      };

      // Validate domain
      if (!domain || !VALID_DOMAINS.includes(domain as ProblemDomain)) {
        res.status(400).json({
          error: 'Invalid domain',
          validDomains: VALID_DOMAINS,
        });
        return;
      }

      // Validate environment state
      if (!environmentState || !environmentState.environmentId) {
        res.status(400).json({ error: 'environmentState with environmentId is required' });
        return;
      }

      logger.info(`Deliberation requested: domain=${domain}`);

      // Run deliberation (async — will emit events via WebSocket)
      const session = await sessionManager.runDeliberation(
        domain as ProblemDomain,
        environmentState,
        environmentSessionId,
      );

      if (session.status === 'failed') {
        res.status(500).json({
          error: 'Deliberation failed',
          sessionId: session.id,
          message: session.error,
        });
        return;
      }

      res.json({
        sessionId: session.id,
        status: session.status,
        domain: session.domain,
        participants: session.participants,
        result: session.result ? {
          convergenceMethod: session.result.convergenceMethod,
          chosenStrategy: session.result.chosenStrategy,
          constitutionallyValid: session.result.constitutionallyValid,
          totalDurationMs: session.result.totalDurationMs,
          participatingAgents: session.result.participatingAgents,
        } : null,
        action: session.action,
      });
    } catch (error) {
      logger.error('Deliberation endpoint error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /deliberation/active
   * List currently running deliberations.
   */
  router.get('/active', (_req: Request, res: Response) => {
    const sessions = sessionManager.getActiveSessions();
    res.json({
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        domain: s.domain,
        status: s.status,
        participants: s.participants,
        startedAt: s.startedAt.toISOString(),
      })),
    });
  });

  /**
   * GET /deliberation/history
   * List recent completed deliberations.
   */
  router.get('/history', (req: Request, res: Response) => {
    const limit = parseInt(req.query['limit'] as string, 10) || 20;
    const sessions = sessionManager.getSessionHistory(limit);
    res.json({
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        domain: s.domain,
        status: s.status,
        participants: s.participants,
        convergenceMethod: s.result?.convergenceMethod ?? null,
        durationMs: s.result?.totalDurationMs ?? null,
        startedAt: s.startedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null,
      })),
    });
  });

  /**
   * GET /deliberation/:id
   * Get full details of a specific deliberation session.
   */
  router.get('/:id', (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) {
      res.status(400).json({ error: 'Session ID required' });
      return;
    }

    // Check active first, then history
    const active = sessionManager.getActiveSession(id);
    if (active) {
      res.json(formatSession(active));
      return;
    }

    const historical = sessionManager.getSessionHistory(100).find((s) => s.id === id);
    if (historical) {
      res.json(formatSession(historical));
      return;
    }

    res.status(404).json({ error: 'Session not found' });
  });

  return router;
}

function formatSession(s: {
  id: string;
  domain: string;
  status: string;
  participants: string[];
  result: unknown;
  action: unknown;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
}): Record<string, unknown> {
  return {
    id: s.id,
    domain: s.domain,
    status: s.status,
    participants: s.participants,
    result: s.result,
    action: s.action,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    error: s.error,
  };
}

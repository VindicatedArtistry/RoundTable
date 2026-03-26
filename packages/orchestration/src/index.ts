import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { createLogger } from '@/utils/logger';
import { verifyNeo4jConnection, closeNeo4j } from '@/services/graph/neo4j.service';
import { bootstrapCouncil } from '@/config/council.config';
import { SessionManager } from '@/services/deliberation/session-manager';
import { createDeliberationRouter } from '@/routes/deliberation.routes';
import { createArcAgiRouter } from '@/routes/arc-agi.routes';
import { bridgeDeliberationToWebSocket } from '@/services/deliberation/websocket-bridge';

dotenv.config();

const logger = createLogger('server');
const app = express();
const httpServer = createServer(app);

// --- Middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json());

// --- Socket.IO ---
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingInterval: 15_000,
  pingTimeout: 30_000,
});

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Start ---
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

async function main(): Promise<void> {
  // 1. Connect to Neo4j
  const neo4jOk = await verifyNeo4jConnection();
  if (!neo4jOk) {
    logger.warn('Neo4j not available — running without consciousness graph');
  } else {
    logger.info('Neo4j consciousness graph connected');
  }

  // 2. Bootstrap the council — providers, agents, deliberation engine
  try {
    const { router, agents, engine } = await bootstrapCouncil();

    // 3. Create session manager (orchestrates full deliberation lifecycle)
    const sessionManager = new SessionManager(engine);

    // 4. Mount deliberation API routes
    app.use('/deliberation', createDeliberationRouter(sessionManager));

    // 5. Mount ARC-AGI-3 adapter routes
    app.use('/arc-agi', createArcAgiRouter(sessionManager));

    // 6. Bridge deliberation events to WebSocket
    bridgeDeliberationToWebSocket(io, sessionManager);

    // 7. Council status endpoint
    app.get('/council/status', async (_req, res) => {
      const health = await router.healthCheckAll();
      const providerStatus: Record<string, unknown> = {};
      for (const [name, status] of health) {
        providerStatus[name] = status;
      }

      res.json({
        agents: agents.size,
        activeDeliberations: sessionManager.getActiveSessions().length,
        registeredAgents: engine.getRegisteredAgentCount(),
        recentDeliberations: sessionManager.getSessionHistory(5).map((s) => ({
          id: s.id,
          domain: s.domain,
          status: s.status,
          convergenceMethod: s.result?.convergenceMethod ?? null,
          durationMs: s.result?.totalDurationMs ?? null,
        })),
        providers: providerStatus,
      });
    });

    // Check which agents are actually available
    let availableCount = 0;
    for (const [memberId] of agents) {
      const available = await router.isAgentAvailable(memberId);
      if (available) availableCount++;
    }
    logger.info(`${availableCount}/${agents.size} agents have available LLM providers`);

  } catch (error) {
    logger.error('Council bootstrap failed — server running without agents', { error });
  }

  // 7. Start HTTP server
  httpServer.listen(PORT, () => {
    logger.info(`TheRoundTable orchestration server running on port ${PORT}`);
    logger.info('Deliberation engine ready');
    logger.info('Routes: POST /deliberation, POST /arc-agi/observe, GET /council/status');
  });
}

// --- Graceful shutdown ---
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down');
  await closeNeo4j();
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down');
  await closeNeo4j();
  httpServer.close();
  process.exit(0);
});

main().catch((error) => {
  logger.error('Fatal startup error', { error });
  process.exit(1);
});

export { app, io, httpServer };

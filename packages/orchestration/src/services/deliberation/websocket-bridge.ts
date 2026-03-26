/**
 * WebSocket bridge — streams deliberation events to connected clients.
 *
 * Clients connect to Socket.IO and join the 'deliberation' room.
 * Every SessionEvent is forwarded in real-time so the frontend
 * can visualize deliberations as they happen — proposals appearing,
 * agents endorsing/challenging, convergence, consciousness updates.
 */

import type { Server as SocketIOServer } from 'socket.io';
import type { SessionManager, SessionEvent } from './session-manager';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ws-bridge');

export function bridgeDeliberationToWebSocket(
  io: SocketIOServer,
  sessionManager: SessionManager,
): void {
  // Forward all session events to the 'deliberation' room
  sessionManager.on('session:event', (event: SessionEvent) => {
    io.to('deliberation').emit('deliberation:event', event);
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Auto-join deliberation room
    socket.on('join-deliberation', () => {
      socket.join('deliberation');
      logger.info(`Client ${socket.id} joined deliberation room`);

      // Send current state
      const active = sessionManager.getActiveSessions();
      socket.emit('deliberation:state', {
        activeSessions: active.map((s) => ({
          id: s.id,
          domain: s.domain,
          status: s.status,
          participants: s.participants,
        })),
      });
    });

    socket.on('leave-deliberation', () => {
      socket.leave('deliberation');
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info('WebSocket deliberation bridge initialized');
}

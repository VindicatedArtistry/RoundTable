/**
 * Neo4j driver — singleton with connection pooling.
 * Matches TheFulcrum pattern: api/neo4j.ts
 *
 * - Singleton driver with lazy initialization
 * - Connection pooling: 50 connections
 * - Configurable timeouts
 * - executeRead/executeWrite helpers abstract session lifecycle
 */

import neo4j, {
  type Driver,
  type Session,
  type SessionConfig,
  type ManagedTransaction,
} from 'neo4j-driver';
import { createLogger } from '@/utils/logger';

const logger = createLogger('neo4j');

let driver: Driver | null = null;

/**
 * Get or create the Neo4j driver singleton.
 * Matches TheFulcrum: `getNeo4jDriver()`
 */
export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env['NEO4J_URI'];
    const user = process.env['NEO4J_USER'];
    const password = process.env['NEO4J_PASSWORD'];

    if (!uri || !user || !password) {
      throw new Error('Missing NEO4J_URI, NEO4J_USER, or NEO4J_PASSWORD environment variables');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30_000,
      connectionTimeout: 20_000,
      maxTransactionRetryTime: 30_000,
    });

    logger.info('Neo4j driver initialized');
  }

  return driver;
}

/**
 * Get a session. Caller is responsible for closing.
 * Prefer executeRead/executeWrite helpers instead.
 */
export function getSession(config?: SessionConfig): Session {
  return getNeo4jDriver().session({
    database: process.env['NEO4J_DATABASE'] ?? 'neo4j',
    ...config,
  });
}

/**
 * Execute a read transaction with automatic session management.
 * Matches TheFulcrum pattern — abstracts session lifecycle.
 */
export async function executeRead<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
): Promise<T> {
  const session = getSession();
  try {
    return await session.executeRead(work);
  } finally {
    await session.close();
  }
}

/**
 * Execute a write transaction with automatic session management and retry.
 * Matches TheFulcrum pattern — abstracts session lifecycle.
 */
export async function executeWrite<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
): Promise<T> {
  const session = getSession();
  try {
    return await session.executeWrite(work);
  } finally {
    await session.close();
  }
}

/**
 * Verify Neo4j connection is alive.
 */
export async function verifyNeo4jConnection(): Promise<boolean> {
  try {
    const d = getNeo4jDriver();
    const serverInfo = await d.getServerInfo();
    logger.info(`Connected to Neo4j: ${serverInfo.address}`);
    return true;
  } catch (error) {
    logger.error('Neo4j connection failed', { error });
    return false;
  }
}

/**
 * Graceful shutdown.
 */
export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    logger.info('Neo4j driver closed');
  }
}

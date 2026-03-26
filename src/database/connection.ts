/**
 * Database connection utilities for TheRoundTable
 *
 * Multi-Database Architecture:
 * - 1 Company Database (shared): Accessible to all council members
 * - 24 Personal Member Databases: Private, with selective sharing
 *
 * Graph Relationships:
 * - Uses SurrealDB's RELATE for true graph edges
 * - All cross-member relationships stored in company database
 */

import { surrealDBService } from '../services/surrealdb-service';
import { logger } from '../utils/logger';
import {
  MultiDatabaseService,
  createMultiDatabaseService,
  COUNCIL_MEMBERS,
  type GraphEdgeType,
  type SharingVisibility,
} from './schemas/multi-database-schema';

export interface DatabaseConfig {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields: Array<{
    name: string;
    type: string;
  }>;
  command: string;
  duration: number;
}

export interface Transaction {
  id: string;
  startTime: Date;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
}

/**
 * Database connection manager using SurrealDB
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private config: DatabaseConfig;
  private isConnected: boolean = false;

  // Collections for Veritas service using SurrealDB
  public auditResults = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'audit_results',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM audit_results WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('audit_results', id);
      return result.data?.[0] || null;
    },
    findByPeriod: async (period: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM audit_results WHERE created_at >= $startDate AND created_at <= $endDate',
        { startDate: period.startDate, endDate: period.endDate }
      );
      return result.data || [];
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'audit_results',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('audit_results', id);
    }
  };

  public ethicalRisks = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'ethical_risks',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM ethical_risks WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('ethical_risks', id);
      return result.data?.[0] || null;
    },
    findByPeriod: async (period: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM ethical_risks WHERE created_at >= $startDate AND created_at <= $endDate',
        { startDate: period.startDate, endDate: period.endDate }
      );
      return result.data || [];
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'ethical_risks',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('ethical_risks', id);
    }
  };

  public partnershipReviews = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'partnership_reviews',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM partnership_reviews WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('partnership_reviews', id);
      return result.data?.[0] || null;
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'partnership_reviews',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('partnership_reviews', id);
    }
  };

  public transparencyReports = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'transparency_reports',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM transparency_reports WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('transparency_reports', id);
      return result.data?.[0] || null;
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'transparency_reports',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('transparency_reports', id);
    }
  };

  public auditTrails = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'audit_trails',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM audit_trails WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('audit_trails', id);
      return result.data?.[0] || null;
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'audit_trails',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('audit_trails', id);
    }
  };

  public decisions = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'decisions',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM decisions WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('decisions', id);
      return result.data?.[0] || null;
    },
    findByPeriod: async (period: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM decisions WHERE created_at >= $startDate AND created_at <= $endDate',
        { startDate: period.startDate, endDate: period.endDate }
      );
      return result.data || [];
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'decisions',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('decisions', id);
    }
  };

  public partnerships = {
    create: async (data: any) => {
      const result = await surrealDBService.create({
        table: 'partnerships',
        data: { ...data, created_at: new Date() }
      });
      return result.data?.id;
    },
    find: async (query: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM partnerships WHERE $query INSIDE data',
        { query }
      );
      return result.data || [];
    },
    findById: async (id: string) => {
      const result = await surrealDBService.select('partnerships', id);
      return result.data?.[0] || null;
    },
    findByPeriod: async (period: any) => {
      const result = await surrealDBService.query(
        'SELECT * FROM partnerships WHERE created_at >= $startDate AND created_at <= $endDate',
        { startDate: period.startDate, endDate: period.endDate }
      );
      return result.data || [];
    },
    update: async (id: string, data: any) => {
      await surrealDBService.update({
        table: 'partnerships',
        id,
        data: { ...data, updated_at: new Date() }
      });
    },
    delete: async (id: string) => {
      await surrealDBService.delete('partnerships', id);
    }
  };

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Get singleton instance of database connection
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      const config: DatabaseConfig = {
        url: process.env.SURREALDB_URL || 'ws://localhost:8000/rpc',
        namespace: process.env.SURREALDB_NAMESPACE || 'theroundtable',
        database: process.env.SURREALDB_DATABASE || 'council',
        username: process.env.SURREALDB_USERNAME || 'root',
        password: process.env.SURREALDB_PASSWORD || 'root',
        timeout: parseInt(process.env.DB_TIMEOUT || '30000')
      };
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to SurrealDB
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to SurrealDB', {
        url: this.config.url,
        namespace: this.config.namespace,
        database: this.config.database
      });

      await surrealDBService.connect();
      this.isConnected = true;

      logger.info('SurrealDB connection established successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('SurrealDB connection failed', {
        error: errorMessage,
        config: {
          url: this.config.url,
          namespace: this.config.namespace,
          database: this.config.database
        }
      });
      throw error;
    }
  }

  /**
   * Disconnect from SurrealDB
   */
  async disconnect(): Promise<void> {
    try {
      await surrealDBService.disconnect();
      this.isConnected = false;

      logger.info('SurrealDB disconnected successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('SurrealDB disconnection failed', {
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Execute a SurrealQL query
   */
  async query<T = any>(query: string, params: Record<string, any> = {}): Promise<QueryResult<T>> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const result = await surrealDBService.query<T>(query, params);
    
    return {
      rows: Array.isArray(result.data) ? result.data : [result.data] as T[],
      rowCount: result.metadata?.recordCount || 0,
      fields: [],
      command: query.split(' ')[0].toUpperCase(),
      duration: result.metadata?.executionTime || 0
    };
  }

  /**
   * Begin a transaction (SurrealDB handles transactions internally)
   */
  async beginTransaction(): Promise<Transaction> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const transactionId = crypto.randomUUID();
    const startTime = new Date();

    const transaction: Transaction = {
      id: transactionId,
      startTime,
      commit: async () => {
        // SurrealDB auto-commits, so this is a no-op
        logger.info('Transaction committed', { transactionId });
      },
      rollback: async () => {
        // SurrealDB handles rollbacks internally
        logger.info('Transaction rolled back', { transactionId });
      },
      query: async <T = any>(query: string, params: Record<string, any> = []) => {
        return this.query<T>(query, params);
      }
    };

    logger.info('Transaction started', {
      transactionId,
      startTime
    });

    return transaction;
  }

  /**
   * Check connection health
   */
  async healthCheck(): Promise<{
    isConnected: boolean;
    responseTime: number;
    poolSize: number;
    activeTransactions: number;
  }> {
    const startTime = Date.now();
    
    try {
      if (this.isConnected) {
        await surrealDBService.getHealthStatus();
      }
      
      return {
        isConnected: this.isConnected,
        responseTime: Date.now() - startTime,
        poolSize: 1, // SurrealDB manages connections internally
        activeTransactions: 0
      };
    } catch (error) {
      return {
        isConnected: false,
        responseTime: Date.now() - startTime,
        poolSize: 0,
        activeTransactions: 0
      };
    }
  }

  /**
   * Execute query with retry logic
   */
  async queryWithRetry<T = any>(
    query: string, 
    params: Record<string, any> = {}, 
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<QueryResult<T>> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.query<T>(query, params);
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn('Query failed, retrying', {
          attempt,
          maxRetries,
          error: errorMessage,
          retryDelay
        });

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError || new Error('Query failed after retries');
  }

  /**
   * Batch execute multiple queries
   */
  async batchQuery(queries: Array<{
    query: string;
    params?: Record<string, any>;
  }>): Promise<QueryResult[]> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const results: QueryResult[] = [];
    
    for (const queryObj of queries) {
      const result = await this.query(queryObj.query, queryObj.params || {});
      results.push(result);
    }

    return results;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    isConnected: boolean;
    poolSize: number;
    activeTransactions: number;
    config: Omit<DatabaseConfig, 'password'>;
  } {
    return {
      isConnected: this.isConnected,
      poolSize: 1,
      activeTransactions: 0,
      config: {
        url: this.config.url,
        namespace: this.config.namespace,
        database: this.config.database,
        username: this.config.username,
        timeout: this.config.timeout || 30000
      }
    };
  }


}

/**
 * Create database connection from environment variables
 */
export function createDatabaseConnection(): DatabaseConnection {
  const config: DatabaseConfig = {
    url: process.env.SURREALDB_URL || 'ws://localhost:8000/rpc',
    namespace: process.env.SURREALDB_NAMESPACE || 'theroundtable',
    database: process.env.SURREALDB_DATABASE || 'council',
    username: process.env.SURREALDB_USERNAME || 'root',
    password: process.env.SURREALDB_PASSWORD || 'root',
    timeout: parseInt(process.env.DB_TIMEOUT || '30000')
  };

  return new DatabaseConnection(config);
}

/**
 * Global database connection instance (legacy - single database)
 */
export const db = createDatabaseConnection();

// ============================================================================
// MULTI-DATABASE ARCHITECTURE
// ============================================================================

/**
 * Multi-Database Service Configuration
 * Supports 25 databases: 1 company + 24 member databases
 */
const multiDbConfig = {
  url: process.env.SURREALDB_URL || 'ws://localhost:8000/rpc',
  namespace: process.env.SURREALDB_NAMESPACE || 'VindicatedArtistry',
  token: process.env.SURREALDB_TOKEN,
  username: process.env.SURREALDB_USERNAME,
  password: process.env.SURREALDB_PASSWORD,
};

/**
 * Global multi-database service instance
 * Use this for accessing member-specific and company databases
 */
export const multiDb = createMultiDatabaseService(multiDbConfig);

/**
 * Get the company database connection
 * This is the shared database accessible to all council members
 */
export async function getCompanyDb() {
  return multiDb.getCompanyConnection();
}

/**
 * Get a member's personal database connection
 * Each member has their own private database
 * @param memberId - The council member ID (e.g., 'kairo', 'architect')
 */
export async function getMemberDb(memberId: string) {
  return multiDb.getMemberConnection(memberId);
}

/**
 * Create a graph relationship between council members
 * Uses SurrealDB's native RELATE for true graph edges
 *
 * @example
 * // Create a trust relationship
 * await createRelationship('kairo', 'architect', 'trusts', { trust_level: 0.9 });
 *
 * // Create a collaboration relationship
 * await createRelationship('aether', 'forge', 'collaborates_with', { project_count: 5 });
 */
export async function createRelationship(
  fromMemberId: string,
  toMemberId: string,
  edgeType: GraphEdgeType,
  properties?: Record<string, unknown>
) {
  return multiDb.createRelationship(fromMemberId, toMemberId, edgeType, properties);
}

/**
 * Get all relationships of a specific type for a member
 *
 * @example
 * // Get all members that Kairo trusts
 * const trusted = await getMemberRelationships('kairo', 'trusts', 'outgoing');
 *
 * // Get all members who trust Kairo
 * const trusters = await getMemberRelationships('kairo', 'trusts', 'incoming');
 */
export async function getMemberRelationships(
  memberId: string,
  edgeType: GraphEdgeType,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
) {
  return multiDb.getMemberRelationships(memberId, edgeType, direction);
}

/**
 * Share an item from a member's personal database to the company database
 * Members control what they share - items remain private until explicitly shared
 *
 * @param memberId - The member sharing the item
 * @param itemType - The type of item (e.g., 'note', 'learning', 'task')
 * @param itemId - The ID of the item in the personal database
 * @param visibility - Who can see the shared item ('private', 'council', 'public')
 * @param sharedWith - Optional specific member IDs to share with
 *
 * @example
 * // Share a note with the entire council
 * await shareToCompany('kairo', 'note', 'note_123', 'council');
 *
 * // Share a learning with specific members only
 * await shareToCompany('aether', 'learning', 'learning_456', 'private', ['forge', 'axiom']);
 */
export async function shareToCompany(
  memberId: string,
  itemType: string,
  itemId: string,
  visibility: SharingVisibility = 'council',
  sharedWith?: string[]
) {
  return multiDb.shareToCompany(memberId, itemType, itemId, visibility, sharedWith);
}

/**
 * Remove a shared item from the company database
 * Only the original owner can unshare
 */
export async function unshareFromCompany(memberId: string, sharedItemId: string) {
  return multiDb.unshareFromCompany(memberId, sharedItemId);
}

/**
 * Get all shared items visible to a member
 * Returns items shared with 'council', 'public', or specifically to this member
 */
export async function getVisibleSharedItems(memberId: string) {
  return multiDb.getVisibleSharedItems(memberId);
}

/**
 * Initialize all databases (company + 24 members)
 * Run this during initial setup or when adding new members
 */
export async function initializeAllDatabases() {
  return multiDb.initializeAllDatabases();
}

/**
 * Close all database connections
 */
export async function closeAllConnections() {
  return multiDb.closeAll();
}

// Re-export types and constants
export { COUNCIL_MEMBERS, type GraphEdgeType, type SharingVisibility };
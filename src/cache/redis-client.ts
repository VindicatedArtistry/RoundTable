/**
 * Redis client for caching and session management
 */

import { logger } from '../utils/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  retryAttempts?: number;
  retryDelay?: number;
  keyPrefix?: string;
  ttl?: number; // Default TTL in seconds
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface RedisStats {
  isConnected: boolean;
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    hits: number;
    misses: number;
  };
}

/**
 * Redis client for caching and data storage
 */
export class RedisClient {
  private static instance: RedisClient;
  private config: RedisConfig;
  private isConnected: boolean = false;
  private cache: Map<string, CacheEntry> = new Map(); // In-memory mock for development
  private stats: RedisStats['operations'] = {
    gets: 0,
    sets: 0,
    deletes: 0,
    hits: 0,
    misses: 0
  };

  constructor(config: RedisConfig) {
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      keyPrefix: 'roundtable:',
      ttl: 3600, // 1 hour default
      ...config
    };
  }

  /**
   * Get singleton instance of Redis client
   */
  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      const config: RedisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DATABASE || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'roundtable:',
        ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600')
      };
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to Redis', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database
      });

      // Mock connection - in production, this would establish actual Redis connection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.isConnected = true;
      this.startCleanupInterval();

      logger.info('Redis connection established successfully');
    } catch (error) {
      const err = error as Error;
      logger.error('Redis connection failed', {
        error: err.message,
        config: {
          host: this.config.host,
          port: this.config.port
        }
      });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      this.isConnected = false;
      this.cache.clear();

      logger.info('Redis disconnected successfully');
    } catch (error) {
      const err = error as Error;
      logger.error('Redis disconnection failed', {
        error: err.message
      });
      throw error;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const fullKey = this.getFullKey(key);
    const expirationTime = ttl || this.config.ttl!;
    const expiresAt = Date.now() + (expirationTime * 1000);

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      createdAt: Date.now()
    };

    this.cache.set(fullKey, entry);
    this.stats.sets++;

    logger.debug('Cache set', {
      key: fullKey,
      ttl: expirationTime,
      expiresAt: new Date(expiresAt)
    });
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    this.stats.gets++;

    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { key: fullKey });
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      logger.debug('Cache expired', { key: fullKey });
      return null;
    }

    this.stats.hits++;
    logger.debug('Cache hit', { key: fullKey });
    return entry.value as T;
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const fullKey = this.getFullKey(key);
    const existed = this.cache.has(fullKey);
    
    this.cache.delete(fullKey);
    this.stats.deletes++;

    logger.debug('Cache delete', { key: fullKey, existed });
    return existed;
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return false;
    }

    entry.expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(fullKey, entry);

    logger.debug('Cache expiration updated', { 
      key: fullKey, 
      ttl, 
      expiresAt: new Date(entry.expiresAt) 
    });
    return true;
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return -2; // Key doesn't exist
    }

    const remainingTtl = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
    
    if (remainingTtl === 0) {
      this.cache.delete(fullKey);
      return -2;
    }

    return remainingTtl;
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + 1;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Increment by a specific amount
   */
  async incrBy(key: string, increment: number): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + increment;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current - 1;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      results.push(value);
    }

    return results;
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(pairs: Record<string, any>, ttl?: number): Promise<void> {
    for (const [key, value] of Object.entries(pairs)) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const regex = new RegExp(pattern.replace('*', '.*'));
    const matchingKeys: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        // Check if expired
        const entry = this.cache.get(key);
        if (entry && Date.now() <= entry.expiresAt) {
          matchingKeys.push(key.replace(this.config.keyPrefix!, ''));
        }
      }
    }

    return matchingKeys;
  }

  /**
   * Flush all keys
   */
  async flushall(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    this.cache.clear();
    this.resetStats();
    
    logger.info('Cache flushed');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<RedisStats> {
    const totalKeys = this.cache.size;
    const memoryUsage = this.estimateMemoryUsage();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      isConnected: this.isConnected,
      totalKeys,
      memoryUsage,
      hitRate,
      operations: { ...this.stats }
    };
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Mock ping - in production, this would ping Redis server
      await new Promise(resolve => setTimeout(resolve, 1));
      return true;
    } catch (error) {
      const err = error as Error;
      logger.error('Redis ping failed', { error: err.message });
      return false;
    }
  }

  /**
   * Cache session data
   */
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  /**
   * Get session data
   */
  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  /**
   * Cache rate limiting data
   */
  async incrementRateLimit(identifier: string, window: number): Promise<{
    count: number;
    ttl: number;
  }> {
    const key = `ratelimit:${identifier}`;
    const count = await this.incr(key);
    
    if (count === 1) {
      await this.expire(key, window);
    }
    
    const ttl = await this.ttl(key);
    return { count, ttl };
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Start cleanup interval for expired keys
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => this.cache.delete(key));

      if (expiredKeys.length > 0) {
        logger.debug('Cleaned up expired cache entries', {
          count: expiredKeys.length
        });
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 string
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 16; // Metadata overhead
    }

    return totalSize;
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      gets: 0,
      sets: 0,
      deletes: 0,
      hits: 0,
      misses: 0
    };
  }
}

/**
 * Create Redis client from environment variables
 */
export function createRedisClient(): RedisClient {
  const config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DATABASE || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'roundtable:',
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600')
  };

  return new RedisClient(config);
}

/**
 * Global Redis client instance
 */
export const redis = createRedisClient();
/**
 * Rate limiting middleware for API endpoints and service calls
 */

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or another distributed cache
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries periodically
    setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  checkLimit(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requestData = this.requests.get(key);

    // Reset if window has expired
    if (!requestData || requestData.resetTime <= now) {
      requestData = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if limit is exceeded
    if (requestData.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: requestData.resetTime
      };
    }

    // Increment counter and store
    requestData.count++;
    this.requests.set(key, requestData);

    return {
      allowed: true,
      remaining: this.config.maxRequests - requestData.count,
      resetTime: requestData.resetTime
    };
  }

  /**
   * Clean up expired entries from memory
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= now) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    this.requests.delete(key);
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const requestData = this.requests.get(key);
    const now = Date.now();

    if (!requestData || requestData.resetTime <= now) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }

    return {
      allowed: requestData.count < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - requestData.count),
      resetTime: requestData.resetTime
    };
  }
}

// Pre-configured rate limiters for common use cases
export const createAPIRateLimiter = () => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,          // 100 requests per 15 minutes
});

export const createCouncilActionLimiter = () => new RateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 10,           // 10 actions per minute
});

export const createAnalysisLimiter = () => new RateLimiter({
  windowMs: 5 * 60 * 1000,   // 5 minutes
  maxRequests: 5,            // 5 analyses per 5 minutes
});
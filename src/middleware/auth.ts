/**
 * Authentication and authorization middleware for council services
 */

export interface AuthConfig {
  secretKey: string;
  tokenExpiry: number; // in milliseconds
  allowedRoles: string[];
}

export interface AuthToken {
  userId: string;
  role: string;
  permissions: string[];
  issuedAt: number;
  expiresAt: number;
}

export interface AuthResult {
  authenticated: boolean;
  token?: AuthToken;
  error?: string;
}

/**
 * Simple authentication service for council operations
 * In production, integrate with your preferred auth provider
 */
export class AuthService {
  private config: AuthConfig;
  private activeSessions: Map<string, AuthToken> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Authenticate a user and generate a session token
   */
  authenticate(userId: string, role: string, permissions: string[] = []): AuthResult {
    if (!this.config.allowedRoles.includes(role)) {
      return {
        authenticated: false,
        error: 'Invalid role'
      };
    }

    const now = Date.now();
    const token: AuthToken = {
      userId,
      role,
      permissions,
      issuedAt: now,
      expiresAt: now + this.config.tokenExpiry
    };

    // Generate a simple session key (in production, use proper JWT or similar)
    const sessionKey = this.generateSessionKey(userId, now);
    this.activeSessions.set(sessionKey, token);

    return {
      authenticated: true,
      token
    };
  }

  /**
   * Validate an authentication token
   */
  validateToken(sessionKey: string): AuthResult {
    const token = this.activeSessions.get(sessionKey);

    if (!token) {
      return {
        authenticated: false,
        error: 'Invalid session'
      };
    }

    if (Date.now() > token.expiresAt) {
      this.activeSessions.delete(sessionKey);
      return {
        authenticated: false,
        error: 'Session expired'
      };
    }

    return {
      authenticated: true,
      token
    };
  }

  /**
   * Check if a token has a specific permission
   */
  hasPermission(sessionKey: string, permission: string): boolean {
    const result = this.validateToken(sessionKey);
    if (!result.authenticated || !result.token) {
      return false;
    }

    return result.token.permissions.includes(permission) || 
           result.token.role === 'admin';
  }

  /**
   * Revoke a session
   */
  revoke(sessionKey: string): void {
    this.activeSessions.delete(sessionKey);
  }

  /**
   * Clean up expired sessions
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, token] of this.activeSessions.entries()) {
      if (now > token.expiresAt) {
        this.activeSessions.delete(key);
      }
    }
  }

  /**
   * Generate a session key (simplified for demo)
   */
  private generateSessionKey(userId: string, timestamp: number): string {
    const data = `${userId}:${timestamp}:${this.config.secretKey}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Get all active sessions (admin only)
   */
  getActiveSessions(): AuthToken[] {
    return Array.from(this.activeSessions.values());
  }
}

// Default configurations for different environments
export const createCouncilAuthService = () => new AuthService({
  secretKey: process.env.AUTH_SECRET || 'council-secret-key',
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  allowedRoles: ['architect', 'council-member', 'admin', 'guest']
});

// Permission constants
export const PERMISSIONS = {
  COUNCIL_READ: 'council:read',
  COUNCIL_WRITE: 'council:write',
  INFRASTRUCTURE_MANAGE: 'infrastructure:manage',
  ANALYSIS_RUN: 'analysis:run',
  FINANCIAL_READ: 'financial:read',
  FINANCIAL_WRITE: 'financial:write',
  ADMIN_ALL: 'admin:all'
} as const;

// Role-based permission sets
export const ROLE_PERMISSIONS = {
  architect: [
    PERMISSIONS.COUNCIL_READ,
    PERMISSIONS.COUNCIL_WRITE,
    PERMISSIONS.INFRASTRUCTURE_MANAGE,
    PERMISSIONS.ANALYSIS_RUN,
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.FINANCIAL_WRITE
  ],
  'council-member': [
    PERMISSIONS.COUNCIL_READ,
    PERMISSIONS.COUNCIL_WRITE,
    PERMISSIONS.ANALYSIS_RUN
  ],
  admin: [PERMISSIONS.ADMIN_ALL],
  guest: [PERMISSIONS.COUNCIL_READ]
} as const;

// Middleware functions for route protection
export interface MiddlewareRequest {
  headers: Record<string, string>;
  user?: { id: string; roles: string[] };
}

export interface MiddlewareResponse {
  status: (code: number) => MiddlewareResponse;
  json: (data: any) => void;
}

export type MiddlewareNext = () => void;

/**
 * Validate API key middleware
 */
export function validateApiKey(req: MiddlewareRequest, res: MiddlewareResponse, next: MiddlewareNext): void {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  // In production, validate against stored API keys
  const validKeys = (process.env.VALID_API_KEYS || '').split(',');
  if (validKeys.length > 0 && validKeys[0] !== '' && !validKeys.includes(apiKey)) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

/**
 * Require specific role middleware
 */
export function requireRole(...roles: string[]) {
  return (req: MiddlewareRequest, res: MiddlewareResponse, next: MiddlewareNext): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
/**
 * Authentication guard middleware for protecting council member endpoints
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
    councilMember?: string;
  };
}

export interface AuthGuardOptions {
  requiredRoles: string[];
  allowSelf?: boolean;
}

/**
 * Authentication guard decorator for council member methods
 */
export function AuthGuard(allowedRoles: string[] = []) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: AuthenticatedRequest, res: Response, ...args: any[]) {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'No valid authorization token provided'
          });
        }

        const token = authHeader.substring(7);
        
        // Verify JWT token
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        let decoded: any;
        
        try {
          decoded = jwt.verify(token, jwtSecret);
        } catch (jwtError) {
          const jwtErr = jwtError as Error;
          logger.warn('Invalid JWT token attempt', {
            error: jwtErr.message,
            endpoint: req.path,
            ip: req.ip
          });
          
          return res.status(401).json({
            error: 'Invalid token',
            message: 'The provided token is invalid or expired'
          });
        }

        // Check if user has required roles
        if (allowedRoles.length > 0) {
          const userRoles = decoded.roles || [];
          const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
          
          if (!hasRequiredRole) {
            logger.warn('Insufficient permissions', {
              userId: decoded.id,
              userRoles,
              requiredRoles: allowedRoles,
              endpoint: req.path
            });
            
            return res.status(403).json({
              error: 'Insufficient permissions',
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
          }
        }

        // Attach user info to request
        req.user = {
          id: decoded.id,
          roles: decoded.roles || [],
          councilMember: decoded.councilMember
        };

        logger.info('Authenticated request', {
          userId: decoded.id,
          roles: decoded.roles,
          endpoint: req.path,
          method: req.method
        });

        // Call original method
        return await originalMethod.call(this, req, res, ...args);

      } catch (error) {
        const err = error as Error;
        logger.error('Authentication guard error', {
          error: err.message,
          stack: err.stack,
          endpoint: req.path,
          method: req.method
        });

        return res.status(500).json({
          error: 'Authentication error',
          message: 'An error occurred during authentication'
        });
      }
    };

    return descriptor;
  };
}

/**
 * Middleware function for Express routes
 */
export function authGuardMiddleware(allowedRoles: string[] = []) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'No valid authorization token provided'
        });
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
      let decoded: any;
      
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid or expired'
        });
      }

      // Check if user has required roles
      if (allowedRoles.length > 0) {
        const userRoles = decoded.roles || [];
        const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
          });
        }
      }

      // Attach user info to request
      req.user = {
        id: decoded.id,
        roles: decoded.roles || [],
        councilMember: decoded.councilMember
      };

      next();

    } catch (error) {
      const err = error as Error;
      logger.error('Authentication middleware error', {
        error: err.message,
        stack: err.stack
      });

      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
  };
}

/**
 * Generate JWT token for authenticated users
 */
export function generateAuthToken(user: {
  id: string;
  roles: string[];
  councilMember?: string;
}): string {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      id: user.id,
      roles: user.roles,
      councilMember: user.councilMember
    },
    jwtSecret,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Verify if a user has specific council member access
 */
export function hasCouncilMemberAccess(
  user: AuthenticatedRequest['user'],
  councilMember: string
): boolean {
  if (!user) return false;
  
  // Admin can access all council members
  if (user.roles.includes('admin')) return true;
  
  // User can access their own council member
  if (user.councilMember === councilMember) return true;
  
  // Specific council member role
  if (user.roles.includes(`${councilMember}-agent`)) return true;
  
  return false;
}

/**
 * Council member role validator
 */
export function validateCouncilMemberRole(councilMember: string): boolean {
  const validCouncilMembers = [
    'kairo', 'aether', 'sterling', 'lyra', 'nexus',
    'veritas', 'axiom', 'eira', 'agape', 'forge', 'sprite'
  ];
  
  return validCouncilMembers.includes(councilMember.toLowerCase());
}
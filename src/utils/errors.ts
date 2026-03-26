/**
 * Custom error classes for TheRoundTable application
 */

export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;
  public readonly details: any[];

  constructor(message: string, details: any[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class ServiceError extends Error {
  public readonly code = 'SERVICE_ERROR';
  public readonly statusCode = 500;
  public readonly originalError?: Error;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'ServiceError';
    this.originalError = originalError;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }
}

export class ConstitutionalViolationError extends Error {
  public readonly code = 'CONSTITUTIONAL_VIOLATION';
  public readonly statusCode = 403;
  public readonly violations: string[];

  constructor(message: string, violations: string[] = []) {
    super(message);
    this.name = 'ConstitutionalViolationError';
    this.violations = violations;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConstitutionalViolationError);
    }
  }
}

export class AuthenticationError extends Error {
  public readonly code = 'AUTHENTICATION_ERROR';
  public readonly statusCode = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

export class AuthorizationError extends Error {
  public readonly code = 'AUTHORIZATION_ERROR';
  public readonly statusCode = 403;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }
}

export class DatabaseError extends Error {
  public readonly code = 'DATABASE_ERROR';
  public readonly statusCode = 500;
  public readonly query?: string;

  constructor(message: string, query?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.query = query;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

export class WebSocketError extends Error {
  public readonly code = 'WEBSOCKET_ERROR';
  public readonly statusCode = 500;
  public readonly connectionId?: string;

  constructor(message: string, connectionId?: string) {
    super(message);
    this.name = 'WebSocketError';
    this.connectionId = connectionId;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WebSocketError);
    }
  }
}

export class ConfigurationError extends Error {
  public readonly code = 'CONFIGURATION_ERROR';
  public readonly statusCode = 500;
  public readonly configKey?: string;

  constructor(message: string, configKey?: string) {
    super(message);
    this.name = 'ConfigurationError';
    this.configKey = configKey;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
}

export class InternalServerError extends Error {
  public readonly code = 'INTERNAL_SERVER_ERROR';
  public readonly statusCode = 500;

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalServerError);
    }
  }
}

export class InfrastructureError extends Error {
  public readonly code = 'INFRASTRUCTURE_ERROR';
  public readonly statusCode = 503;
  public readonly component?: string;

  constructor(message: string, component?: string) {
    super(message);
    this.name = 'InfrastructureError';
    this.component = component;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InfrastructureError);
    }
  }
}

export class SystemHealthError extends Error {
  public readonly code = 'SYSTEM_HEALTH_ERROR';
  public readonly statusCode = 503;
  public readonly healthCheck?: string;

  constructor(message: string, healthCheck?: string) {
    super(message);
    this.name = 'SystemHealthError';
    this.healthCheck = healthCheck;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemHealthError);
    }
  }
}

export class AppError extends Error {
  public readonly code = 'APP_ERROR';
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.context = context;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Error handler utility
export function handleError(error: any): {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
} {
  // Handle custom errors
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    };
  }
  
  if (error instanceof ServiceError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.originalError?.message
    };
  }
  
  if (error instanceof ConstitutionalViolationError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.violations
    };
  }
  
  // Handle other custom errors
  if (error.code && error.statusCode) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details || error.violations
    };
  }
  
  // Handle generic errors
  return {
    message: error.message || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}

// Error logging utility
export function logError(error: any, context: Record<string, any> = {}) {
  const errorInfo = handleError(error);
  
  console.error('Error occurred:', {
    ...errorInfo,
    context,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  return errorInfo;
}
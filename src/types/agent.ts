/**
 * Type definitions for agent services and responses
 */

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface CodeComponent {
  name: string;
  code: string;
  tests: string;
  documentation: string;
  dependencies: string[];
  performance: {
    estimatedBundleSize: number;
    renderTime: number;
    memoryUsage: number;
  };
  accessibility: {
    wcagLevel: string;
    screenReaderSupport: boolean;
    keyboardNavigation: boolean;
    colorContrastRatio: number;
  };
  qualityMetrics: {
    overallScore: number;
    maintainability: number;
    performance: number;
    security: number;
    accessibility: number;
    testCoverage: number;
  };
}

export interface RefactorRequest {
  codebase: string;
  goals: string[];
  preserveApi?: boolean;
  targetVersion?: string;
}

export interface DebugRequest {
  code: string;
  errorMessage?: string;
  expectedBehavior: string;
  environment?: {
    nodeVersion?: string;
    framework?: string;
    dependencies?: Record<string, string>;
  };
  reproductionSteps?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TestGenerationRequest {
  sourceCode: string;
  testType: 'unit' | 'integration' | 'e2e';
  coverageTarget: number;
  framework: string;
  includeEdgeCases: boolean;
  mockStrategy: 'auto' | 'manual' | 'none';
}

/**
 * Base interface for all agent services
 */
export interface AgentService {
  // Core method that all agents should implement
  [key: string]: any;
}

/**
 * Custom error class for agent operations
 */
export class AgentError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AgentError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  auth?: {
    required: boolean;
    permissions: string[];
  };
}

/**
 * Agent status interface
 */
export interface AgentStatus {
  online: boolean;
  lastActivity: Date;
  activeOperations: number;
  totalOperations: number;
  averageResponseTime: number;
  errorRate: number;
}
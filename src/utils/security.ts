/**
 * Security utilities for input validation and code sanitization
 */

import { sanitize } from './sanitizer';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validation error class for schema validation failures
 */
export class ValidationError extends Error {
  public readonly errors: z.ZodIssue[];

  constructor(message: string, errors: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validate input using a Zod schema and return parsed data
 * Throws ValidationError if validation fails
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorMessages = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Validation failed: ${errorMessages}`, result.error.issues);
  }

  return result.data;
}

/**
 * Validate input using a Zod schema and return result object
 * Does not throw - returns success/failure with data or errors
 */
export function validateInputSafe<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return { success: false, errors: result.error.issues };
  }

  return { success: true, data: result.data };
}

/**
 * Validate input against common security threats (legacy function)
 */
export function validateInputBasic(input: unknown, options: {
  maxLength?: number;
  allowedTypes?: string[];
  required?: boolean;
} = {}): boolean {
  if (options.required && (input === null || input === undefined || input === '')) {
    return false;
  }

  if (input && options.maxLength && String(input).length > options.maxLength) {
    return false;
  }

  if (options.allowedTypes && !options.allowedTypes.includes(typeof input)) {
    return false;
  }

  return true;
}

/**
 * Sanitize code input to prevent injection attacks
 */
export function sanitizeCode(code: string): string {
  if (typeof code !== 'string') {
    return '';
  }

  // Remove potentially dangerous patterns
  let sanitized = code
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: URLs that might contain scripts
    .replace(/data:\s*text\/html/gi, 'data:text/plain')
    // Remove eval and similar dangerous functions
    .replace(/\beval\s*\(/gi, '/* eval */ (')
    .replace(/\bFunction\s*\(/gi, '/* Function */ (')
    .replace(/\bsetTimeout\s*\(/gi, '/* setTimeout */ (')
    .replace(/\bsetInterval\s*\(/gi, '/* setInterval */ (');

  // Basic sanitization using our sanitizer utility
  sanitized = sanitize(sanitized, {
    allowHTML: true, // Allow HTML for code examples
    maxLength: 100000, // Reasonable limit for code
    stripWhitespace: false // Preserve formatting
  });

  return sanitized;
}

/**
 * Validate that code doesn't contain malicious patterns
 */
export function validateCodeSafety(code: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /document\.write/gi, message: 'document.write detected' },
    { pattern: /innerHTML\s*=/gi, message: 'innerHTML assignment detected' },
    { pattern: /eval\s*\(/gi, message: 'eval() function detected' },
    { pattern: /Function\s*\(/gi, message: 'Function constructor detected' },
    { pattern: /import\s+.*\s+from\s+["']https?:/gi, message: 'Remote import detected' },
    { pattern: /__proto__/gi, message: 'Prototype pollution attempt detected' },
    { pattern: /constructor\s*\[\s*["']constructor["']\s*\]/gi, message: 'Constructor access detected' }
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(code)) {
      issues.push(message);
    }
  }

  // Check for suspicious network requests
  if (/fetch\s*\(|XMLHttpRequest|axios\./gi.test(code)) {
    issues.push('Network request detected - verify endpoints are safe');
  }

  // Check for file system access
  if (/require\s*\(\s*["']fs["']\)|import.*fs.*from/gi.test(code)) {
    issues.push('File system access detected');
  }

  // Check for process access
  if (/process\.|require\s*\(\s*["']child_process["']\)/gi.test(code)) {
    issues.push('Process access detected');
  }

  return {
    safe: issues.length === 0,
    issues
  };
}

/**
 * Escape special characters for safe display
 */
export function escapeForDisplay(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash sensitive data for storage
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiting tracker
 */
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  let record = rateLimitTracker.get(key);
  
  // Reset if window has expired
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }
  
  record.count++;
  rateLimitTracker.set(key, record);
  
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime
  };
}
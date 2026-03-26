/**
 * Input sanitization utilities for secure data processing
 */

export interface SanitizeOptions {
  allowHTML?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  stripWhitespace?: boolean;
}

/**
 * Basic string sanitization - removes potentially dangerous characters
 */
export function sanitize(input: string, options: SanitizeOptions = {}): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Apply max length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Strip whitespace if requested
  if (options.stripWhitespace) {
    sanitized = sanitized.trim();
  }

  // If HTML is not allowed, escape HTML entities
  if (!options.allowHTML) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  return sanitized;
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T, 
  options: SanitizeOptions = {}
): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitize(value, options) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value, options) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitize(item, options) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize SQL-like input to prevent injection
 */
export function sanitizeQuery(query: string): string {
  return query
    .replace(/['"`;\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/(\b(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '') // Remove dangerous SQL keywords
    .trim();
}

/**
 * Sanitize file paths to prevent directory traversal
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitize(email.toLowerCase().trim());
  
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitize URLs to prevent XSS via javascript: protocol
 */
export function sanitizeUrl(url: string): string | null {
  const sanitized = sanitize(url.trim());
  
  // Block dangerous protocols
  if (sanitized.match(/^(javascript|data|vbscript):/i)) {
    return null;
  }
  
  // Ensure it's a valid HTTP/HTTPS URL or relative path
  if (sanitized.match(/^(https?:\/\/|\/)/i) || !sanitized.includes(':')) {
    return sanitized;
  }
  
  return null;
}
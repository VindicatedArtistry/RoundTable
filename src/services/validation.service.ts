/**
 * Validation Service - Provides validation utilities for TheRoundTable
 */

import { z, ZodSchema, ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('ValidationService');

export class ValidationError extends Error {
	public readonly errors: Array<{ path: string; message: string }>;

	constructor(message: string, errors: Array<{ path: string; message: string }> = []) {
		super(message);
		this.name = 'ValidationError';
		this.errors = errors;
	}
}

export class ValidationService {
	/**
	 * Validate data against a Zod schema
	 */
	validate<T>(schema: ZodSchema<T>, data: unknown): T {
		const result = schema.safeParse(data);
		if (!result.success) {
			const errors = result.error.issues.map(issue => ({
				path: issue.path.join('.'),
				message: issue.message
			}));
			logger.warn('Validation failed', { errors });
			throw new ValidationError('Validation failed', errors);
		}
		return result.data;
	}

	/**
	 * Validate and return result with errors
	 */
	validateWithResult<T>(schema: ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Array<{ path: string; message: string }> } {
		const result = schema.safeParse(data);
		if (!result.success) {
			const errors = result.error.issues.map(issue => ({
				path: issue.path.join('.'),
				message: issue.message
			}));
			return { success: false, errors };
		}
		return { success: true, data: result.data };
	}

	/**
	 * Check if a string is a valid email
	 */
	isValidEmail(email: string): boolean {
		const emailSchema = z.string().email();
		return emailSchema.safeParse(email).success;
	}

	/**
	 * Check if a string is a valid UUID
	 */
	isValidUUID(uuid: string): boolean {
		const uuidSchema = z.string().uuid();
		return uuidSchema.safeParse(uuid).success;
	}

	/**
	 * Check if a string is a valid URL
	 */
	isValidURL(url: string): boolean {
		const urlSchema = z.string().url();
		return urlSchema.safeParse(url).success;
	}

	/**
	 * Sanitize string for safe display
	 */
	sanitizeString(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;');
	}
}

export const validationService = new ValidationService();

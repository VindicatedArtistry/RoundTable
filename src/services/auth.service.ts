import { createLogger, LoggerInterface } from '../utils/logger';
import { DatabaseConnection } from '../database/connection';
import { ValidationError, ServiceError } from '../utils/errors';

export interface User {
	id: string;
	username: string;
	email: string;
	role: string;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Authentication Service
 * Handles user authentication, authorization, and user management
 */
export class AuthService {
	private readonly logger: LoggerInterface;
	private readonly db: DatabaseConnection;

	constructor() {
		this.logger = createLogger('AuthService');
		this.db = DatabaseConnection.getInstance();
	}

	/**
	 * Get user by ID
	 * @param userId - The user ID to lookup
	 * @returns User object or null if not found
	 */
	async getUserById(userId: string): Promise<User | null> {
		try {
			if (!userId) {
				throw new ValidationError('User ID is required');
			}

			this.logger.debug('Looking up user by ID', { userId });

			// In a real implementation, this would query the database
			// For now, returning a mock user for testing
			const mockUser: User = {
				id: userId,
				username: `user_${userId}`,
				email: `user${userId}@theroundtable.ai`,
				role: userId === 'admin' ? 'admin' : 'council_member',
				active: true,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			this.logger.debug('User found', { userId, role: mockUser.role });
			return mockUser;

		} catch (error) {
			this.logger.error('Error getting user by ID', { error, userId });
			throw new ServiceError('Failed to retrieve user', error);
		}
	}

	/**
	 * Validate user credentials
	 * @param username - Username
	 * @param password - Password
	 * @returns User object if valid, null otherwise
	 */
	async validateCredentials(username: string, password: string): Promise<User | null> {
		try {
			this.logger.debug('Validating user credentials', { username });

			// In a real implementation, this would hash and compare passwords
			// For now, returning a mock validation
			if (username && password) {
				const mockUser: User = {
					id: `user_${Date.now()}`,
					username,
					email: `${username}@theroundtable.ai`,
					role: username === 'admin' ? 'admin' : 'council_member',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				this.logger.info('User credentials validated', { username, userId: mockUser.id });
				return mockUser;
			}

			this.logger.warn('Invalid credentials provided', { username });
			return null;

		} catch (error) {
			this.logger.error('Error validating credentials', { error, username });
			throw new ServiceError('Failed to validate credentials', error);
		}
	}

	/**
	 * Check if user has required role
	 * @param userId - User ID
	 * @param requiredRoles - Array of required roles
	 * @returns True if user has one of the required roles
	 */
	async hasRole(userId: string, requiredRoles: string[]): Promise<boolean> {
		try {
			const user = await this.getUserById(userId);
			if (!user) {
				return false;
			}

			const hasRole = requiredRoles.includes(user.role);
			this.logger.debug('Role check completed', { userId, userRole: user.role, requiredRoles, hasRole });

			return hasRole;

		} catch (error) {
			this.logger.error('Error checking user role', { error, userId, requiredRoles });
			return false;
		}
	}

	/**
	 * Update user's last activity timestamp
	 * @param userId - User ID
	 */
	async updateLastActivity(userId: string): Promise<void> {
		try {
			this.logger.debug('Updating user last activity', { userId });

			// In a real implementation, this would update the database
			// For now, just logging the activity

			this.logger.debug('User last activity updated', { userId, timestamp: new Date() });

		} catch (error) {
			this.logger.error('Error updating user last activity', { error, userId });
			// Don't throw error for activity updates as they're not critical
		}
	}

	/**
	 * Verify user has a specific permission
	 * @param userId - User ID
	 * @param permission - Permission to check (e.g., 'proposal:create')
	 * @param throwOnDenied - Whether to throw an error if permission denied
	 * @returns True if user has permission
	 */
	async verifyPermission(userId: string, permission: string, throwOnDenied: boolean = true): Promise<boolean> {
		try {
			const user = await this.getUserById(userId);
			if (!user) {
				if (throwOnDenied) {
					throw new ValidationError('User not found');
				}
				return false;
			}

			// Permission mapping based on roles
			const rolePermissions: Record<string, string[]> = {
				admin: ['*'],
				council_member: [
					'proposal:create',
					'proposal:read',
					'proposal:read-all',
					'proposal:analytics'
				],
				member: ['proposal:read']
			};

			const userPermissions = rolePermissions[user.role] || [];
			const hasPermission = userPermissions.includes('*') || userPermissions.includes(permission);

			this.logger.debug('Permission check', { userId, permission, hasPermission });

			if (!hasPermission && throwOnDenied) {
				throw new ValidationError(`Permission denied: ${permission}`);
			}

			return hasPermission;
		} catch (error) {
			if (error instanceof ValidationError) {
				throw error;
			}
			this.logger.error('Error verifying permission', { error, userId, permission });
			if (throwOnDenied) {
				throw new ServiceError('Failed to verify permission', error);
			}
			return false;
		}
	}
}
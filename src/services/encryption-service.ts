import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { surrealDBService } from './surrealdb-service';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createLogger } from '../utils/logger';

const logger = createLogger('EncryptionService');

const pipelineAsync = promisify(pipeline);

/**
 * Interface for encryption configuration
 */
interface EncryptionConfig {
	algorithm: string;
	keyLength: number;
	ivLength: number;
	tagLength: number;
	keyRotationInterval: number;
	cachePrefix: string;
}

/**
 * Interface for encrypted data structure
 */
interface EncryptedData {
	data: string;
	iv: string;
	tag: string;
	keyId: string;
	timestamp: number;
}

/**
 * Interface for encryption key metadata
 */
interface EncryptionKey {
	id: string;
	key: Buffer;
	createdAt: Date;
	isActive: boolean;
	version: number;
}

/**
 * Interface for database query encryption context
 */
interface QueryEncryptionContext {
	query: string;
	parameters: Record<string, any>;
	keyId: string;
	cacheable: boolean;
}

/**
 * End-to-end encryption service for all communications
 * Implements AES-256 encryption for data at rest, handles key rotation,
 * and provides encrypted graph database query capabilities
 *
 * Updated to use SurrealDB for caching instead of Redis
 */
export class EncryptionService {
	private readonly config: EncryptionConfig;
	private readonly keyStore: Map<string, EncryptionKey>;
	private currentKeyId: string;
	private keyRotationTimer: NodeJS.Timeout | null;

	constructor() {
		this.config = {
			algorithm: 'aes-256-gcm',
			keyLength: 32, // 256 bits
			ivLength: 16,  // 128 bits
			tagLength: 16, // 128 bits
			keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
			cachePrefix: 'enc:'
		};

		this.keyStore = new Map();
		this.currentKeyId = '';
		this.keyRotationTimer = null;
	}

	/**
	 * Initialize the encryption service
	 * Loads existing keys and sets up key rotation
	 */
	public async initialize(): Promise<void> {
		try {
			await this.loadExistingKeys();

			if (this.keyStore.size === 0) {
				await this.generateNewKey();
			}

			this.setupKeyRotation();

			logger.info('Encryption service initialized successfully', {
				activeKeys: this.keyStore.size,
				currentKeyId: this.currentKeyId
			});
		} catch (error) {
			logger.error('Failed to initialize encryption service', { error });
			throw new Error('Encryption service initialization failed');
		}
	}

	/**
	 * Encrypt data using AES-256-GCM
	 * @param data - Data to encrypt (string or object)
	 * @param keyId - Optional specific key ID to use
	 * @returns Encrypted data structure
	 */
	public async encrypt(data: string | object, keyId?: string): Promise<EncryptedData> {
		try {
			const dataString = typeof data === 'string' ? data : JSON.stringify(data);
			const useKeyId = keyId || this.currentKeyId;

			if (!useKeyId) {
				throw new Error('No encryption key available');
			}

			const encryptionKey = this.keyStore.get(useKeyId);
			if (!encryptionKey) {
				throw new Error(`Encryption key not found: ${useKeyId}`);
			}

			const iv = crypto.randomBytes(this.config.ivLength);
			const cipher = crypto.createCipheriv(
				this.config.algorithm as crypto.CipherGCMTypes,
				encryptionKey.key,
				iv,
				{ authTagLength: this.config.tagLength }
			);
			cipher.setAAD(Buffer.from(useKeyId));

			let encrypted = cipher.update(dataString, 'utf8', 'base64');
			encrypted += cipher.final('base64');

			const tag = cipher.getAuthTag();

			const result: EncryptedData = {
				data: encrypted,
				iv: iv.toString('base64'),
				tag: tag.toString('base64'),
				keyId: useKeyId,
				timestamp: Date.now()
			};

			// Cache encrypted data for performance
			await this.cacheEncryptedData(result);

			return result;
		} catch (error) {
			logger.error('Encryption failed', { error, keyId });
			throw new Error('Data encryption failed');
		}
	}

	/**
	 * Decrypt data using AES-256-GCM
	 * @param encryptedData - Encrypted data structure
	 * @returns Decrypted data as string
	 */
	public async decrypt(encryptedData: EncryptedData): Promise<string> {
		try {
			const { data, iv, tag, keyId } = encryptedData;

			const encryptionKey = this.keyStore.get(keyId);
			if (!encryptionKey) {
				throw new Error(`Decryption key not found: ${keyId}`);
			}

			const decipher = crypto.createDecipheriv(
				this.config.algorithm as crypto.CipherGCMTypes,
				encryptionKey.key,
				Buffer.from(iv, 'base64'),
				{ authTagLength: this.config.tagLength }
			);
			decipher.setAAD(Buffer.from(keyId));
			decipher.setAuthTag(Buffer.from(tag, 'base64'));

			let decrypted = decipher.update(data, 'base64', 'utf8');
			decrypted += decipher.final('utf8');

			return decrypted;
		} catch (error) {
			logger.error('Decryption failed', { error, keyId: encryptedData.keyId });
			throw new Error('Data decryption failed');
		}
	}

	/**
	 * Encrypt graph database query and parameters
	 * @param query - Database query string
	 * @param parameters - Query parameters
	 * @param options - Encryption options
	 * @returns Encrypted query context
	 */
	public async encryptDatabaseQuery(
		query: string,
		parameters: Record<string, any> = {},
		options: { cacheable?: boolean } = {}
	): Promise<QueryEncryptionContext> {
		try {
			const queryHash = this.generateQueryHash(query, parameters);

			// Check cache first for performance
			if (options.cacheable) {
				const cached = await this.getCachedQuery(queryHash);
				if (cached) {
					return cached;
				}
			}

			const encryptedQuery = await this.encrypt(query);
			const encryptedParams = await this.encrypt(parameters);

			const context: QueryEncryptionContext = {
				query: encryptedQuery.data,
				parameters: { encrypted: encryptedParams.data, keyId: encryptedParams.keyId },
				keyId: encryptedQuery.keyId,
				cacheable: options.cacheable || false
			};

			// Cache the encrypted query context
			if (options.cacheable) {
				await this.cacheQueryContext(queryHash, context);
			}

			return context;
		} catch (error) {
			logger.error('Database query encryption failed', { error });
			throw new Error('Query encryption failed');
		}
	}

	/**
	 * Decrypt graph database query context
	 * @param context - Encrypted query context
	 * @returns Decrypted query and parameters
	 */
	public async decryptDatabaseQuery(context: QueryEncryptionContext): Promise<{
		query: string;
		parameters: Record<string, any>;
	}> {
		try {
			const decryptedQuery = await this.decrypt({
				data: context.query,
				iv: '',
				tag: '',
				keyId: context.keyId,
				timestamp: Date.now()
			});

			const decryptedParams = await this.decrypt({
				data: context.parameters.encrypted,
				iv: '',
				tag: '',
				keyId: context.parameters.keyId,
				timestamp: Date.now()
			});

			return {
				query: decryptedQuery,
				parameters: JSON.parse(decryptedParams)
			};
		} catch (error) {
			logger.error('Database query decryption failed', { error });
			throw new Error('Query decryption failed');
		}
	}

	/**
	 * Generate a new encryption key and rotate if necessary
	 */
	public async rotateKeys(): Promise<void> {
		try {
			const oldKeyId = this.currentKeyId;
			await this.generateNewKey();

			// Keep old keys for decryption of existing data
			if (oldKeyId) {
				const oldKey = this.keyStore.get(oldKeyId);
				if (oldKey) {
					oldKey.isActive = false;
					this.keyStore.set(oldKeyId, oldKey);
				}
			}

			await this.persistKeys();

			logger.info('Key rotation completed', {
				oldKeyId,
				newKeyId: this.currentKeyId
			});
		} catch (error) {
			logger.error('Key rotation failed', { error });
			throw new Error('Key rotation failed');
		}
	}

	/**
	 * Get encryption metrics for monitoring
	 */
	public getMetrics(): {
		totalKeys: number;
		activeKeyId: string;
		keyRotationInterval: number;
		cacheHitRate: number;
	} {
		return {
			totalKeys: this.keyStore.size,
			activeKeyId: this.currentKeyId,
			keyRotationInterval: this.config.keyRotationInterval,
			cacheHitRate: 0 // TODO: Implement cache hit rate tracking
		};
	}

	/**
	 * Cleanup expired keys and cache entries
	 */
	public async cleanup(): Promise<void> {
		try {
			const now = new Date();
			const expiredKeys: string[] = [];

			// Find keys older than 30 days that are not active
			for (const [keyId, key] of this.keyStore.entries()) {
				const keyAge = now.getTime() - key.createdAt.getTime();
				const thirtyDays = 30 * 24 * 60 * 60 * 1000;

				if (!key.isActive && keyAge > thirtyDays) {
					expiredKeys.push(keyId);
				}
			}

			// Remove expired keys
			for (const keyId of expiredKeys) {
				this.keyStore.delete(keyId);
			}

			// Clean expired cache entries using SurrealDB
			await this.cleanExpiredCache();

			logger.info('Cleanup completed', {
				expiredKeys: expiredKeys.length,
				remainingKeys: this.keyStore.size
			});
		} catch (error) {
			logger.error('Cleanup failed', { error });
		}
	}

	/**
	 * Shutdown the encryption service
	 */
	public async shutdown(): Promise<void> {
		try {
			if (this.keyRotationTimer) {
				clearInterval(this.keyRotationTimer);
				this.keyRotationTimer = null;
			}

			await this.persistKeys();

			logger.info('Encryption service shutdown completed');
		} catch (error) {
			logger.error('Encryption service shutdown failed', { error });
		}
	}

	/**
	 * Generate a new encryption key
	 */
	private async generateNewKey(): Promise<void> {
		const keyId = crypto.randomUUID();
		const key = crypto.randomBytes(this.config.keyLength);

		const encryptionKey: EncryptionKey = {
			id: keyId,
			key,
			createdAt: new Date(),
			isActive: true,
			version: 1
		};

		this.keyStore.set(keyId, encryptionKey);
		this.currentKeyId = keyId;
	}

	/**
	 * Setup automatic key rotation
	 */
	private setupKeyRotation(): void {
		this.keyRotationTimer = setInterval(async () => {
			try {
				await this.rotateKeys();
			} catch (error) {
				logger.error('Automatic key rotation failed', { error });
			}
		}, this.config.keyRotationInterval);
	}

	/**
	 * Load existing keys from persistent storage
	 */
	private async loadExistingKeys(): Promise<void> {
		try {
			const keysPath = path.join(process.cwd(), '.keys', 'encryption-keys.json');

			try {
				const keysData = await fs.readFile(keysPath, 'utf8');
				const keys = JSON.parse(keysData);

				for (const keyData of keys) {
					const key: EncryptionKey = {
						...keyData,
						key: Buffer.from(keyData.key, 'base64'),
						createdAt: new Date(keyData.createdAt)
					};

					this.keyStore.set(key.id, key);

					if (key.isActive) {
						this.currentKeyId = key.id;
					}
				}
			} catch (error) {
				// Keys file doesn't exist, will create new keys
				logger.info('No existing keys found, will generate new keys');
			}
		} catch (error) {
			logger.error('Failed to load existing keys', { error });
		}
	}

	/**
	 * Persist keys to secure storage
	 */
	private async persistKeys(): Promise<void> {
		try {
			const keysDir = path.join(process.cwd(), '.keys');
			const keysPath = path.join(keysDir, 'encryption-keys.json');

			// Ensure directory exists
			await fs.mkdir(keysDir, { recursive: true });

			const keysToSave = Array.from(this.keyStore.values()).map(key => ({
				...key,
				key: key.key.toString('base64')
			}));

			await fs.writeFile(keysPath, JSON.stringify(keysToSave, null, 2), {
				mode: 0o600 // Read/write for owner only
			});
		} catch (error) {
			logger.error('Failed to persist keys', { error });
		}
	}

	/**
	 * Generate hash for query caching
	 */
	private generateQueryHash(query: string, parameters: Record<string, any>): string {
		const content = JSON.stringify({ query, parameters });
		return crypto.createHash('sha256').update(content).digest('hex');
	}

	/**
	 * Cache encrypted data for performance using SurrealDB
	 */
	private async cacheEncryptedData(data: EncryptedData): Promise<void> {
		try {
			const key = `${this.config.cachePrefix}data:${data.keyId}`;
			await surrealDBService.setCache(key, data, 3600); // 1 hour TTL
		} catch (error) {
			logger.warn('Failed to cache encrypted data', { error });
		}
	}

	/**
	 * Get cached query context from SurrealDB
	 */
	private async getCachedQuery(queryHash: string): Promise<QueryEncryptionContext | null> {
		try {
			const key = `${this.config.cachePrefix}query:${queryHash}`;
			return await surrealDBService.getCache<QueryEncryptionContext>(key);
		} catch (error) {
			logger.warn('Failed to get cached query', { error });
			return null;
		}
	}

	/**
	 * Cache query context using SurrealDB
	 */
	private async cacheQueryContext(queryHash: string, context: QueryEncryptionContext): Promise<void> {
		try {
			const key = `${this.config.cachePrefix}query:${queryHash}`;
			await surrealDBService.setCache(key, context, 1800); // 30 minutes TTL
		} catch (error) {
			logger.warn('Failed to cache query context', { error });
		}
	}

	/**
	 * Clean expired cache entries using SurrealDB
	 */
	private async cleanExpiredCache(): Promise<void> {
		try {
			await surrealDBService.clearExpiredCache();
		} catch (error) {
			logger.warn('Failed to clean expired cache', { error });
		}
	}
}

// Export singleton instance - no longer requires Redis
let encryptionServiceInstance: EncryptionService | null = null;

export const getEncryptionService = (): EncryptionService => {
	if (!encryptionServiceInstance) {
		encryptionServiceInstance = new EncryptionService();
	}
	return encryptionServiceInstance;
};

export default EncryptionService;

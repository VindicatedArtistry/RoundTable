/**
 * Database Service - Provides database operations for TheRoundTable
 * This is a facade over SurrealDB service with domain-specific collections
 */

import { surrealDBService, QueryResult } from './surrealdb-service';
import { createLogger, LoggerInterface } from '../utils/logger';

const logger = createLogger('DatabaseService');

export interface DatabaseCollection<T = any> {
	create(data: any): Promise<T>;
	update(id: string, data: any): Promise<T>;
	findById(id: string): Promise<T | null>;
	findMany(query: Record<string, unknown>, options?: { limit?: number; offset?: number }): Promise<T[]>;
	count(query: Record<string, unknown>): Promise<number>;
	delete(id: string): Promise<void>;
}

export interface ProposalRecord {
	id: string;
	title: string;
	description: string;
	initiatorId: string;
	stage: string;
	priority: string;
	workflow: Record<string, unknown>;
	members: Array<Record<string, unknown>>;
	documents: Array<Record<string, unknown>>;
	tags: string[];
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
	metrics: Record<string, unknown>;
	version: number;
}

export interface ProposalHistoryRecord {
	id: string;
	proposalId: string;
	action: string;
	actorId: string;
	previousValue: unknown;
	newValue: unknown;
	timestamp: Date;
	metadata: Record<string, unknown>;
}

export interface UserRecord {
	id: string;
	name: string;
	email: string;
	department: string;
	role: string;
	active: boolean;
}

class ProposalsCollection implements DatabaseCollection<any> {
	async create(data: any): Promise<any> {
		await surrealDBService.query(
			'CREATE proposals SET id = $id, title = $title, description = $description, initiatorId = $initiatorId, stage = $stage, priority = $priority, workflow = $workflow, members = $members, documents = $documents, tags = $tags, metadata = $metadata, createdAt = $createdAt, updatedAt = $updatedAt, metrics = $metrics, version = $version',
			data as unknown as Record<string, unknown>
		);
		return data;
	}

	async update(id: string, data: any): Promise<any> {
		const updates = Object.entries(data)
			.map(([key, _]) => `${key} = $${key}`)
			.join(', ');
		await surrealDBService.query(`UPDATE proposals:${id} SET ${updates}`, data as Record<string, unknown>);
		const result = await this.findById(id);
		return result!;
	}

	async findById(id: string): Promise<any | null> {
		const result = await surrealDBService.query<any[]>(`SELECT * FROM proposals WHERE id = $id`, { id });
		return result.data?.[0] || null;
	}

	async findMany(query: Record<string, unknown>, options?: { limit?: number; offset?: number }): Promise<any[]> {
		const whereClauses = Object.keys(query).map(key => `${key} = $${key}`).join(' AND ');
		const whereStr = whereClauses ? `WHERE ${whereClauses}` : '';
		const limitStr = options?.limit ? `LIMIT ${options.limit}` : '';
		const offsetStr = options?.offset ? `START ${options.offset}` : '';
		const result = await surrealDBService.query<any[]>(
			`SELECT * FROM proposals ${whereStr} ${limitStr} ${offsetStr}`,
			query
		);
		return result.data || [];
	}

	async count(query: Record<string, unknown>): Promise<number> {
		const whereClauses = Object.keys(query).map(key => `${key} = $${key}`).join(' AND ');
		const whereStr = whereClauses ? `WHERE ${whereClauses}` : '';
		const result = await surrealDBService.query<{ count: number }[]>(
			`SELECT count() FROM proposals ${whereStr} GROUP ALL`,
			query
		);
		return result.data?.[0]?.count || 0;
	}

	async delete(id: string): Promise<void> {
		await surrealDBService.query(`DELETE proposals:${id}`);
	}

	async findByDateRange(start: Date, end: Date): Promise<any[]> {
		const result = await surrealDBService.query<any[]>(
			'SELECT * FROM proposals WHERE createdAt >= $start AND createdAt <= $end',
			{ start: start.toISOString(), end: end.toISOString() }
		);
		return result.data || [];
	}
}

class ProposalHistoryCollection implements DatabaseCollection<any> {
	async create(data: any): Promise<any> {
		await surrealDBService.query(
			'CREATE proposal_history SET id = $id, proposalId = $proposalId, action = $action, actorId = $actorId, previousValue = $previousValue, newValue = $newValue, timestamp = $timestamp, metadata = $metadata',
			data as unknown as Record<string, unknown>
		);
		return data;
	}

	async update(id: string, data: any): Promise<any> {
		const updates = Object.entries(data)
			.map(([key, _]) => `${key} = $${key}`)
			.join(', ');
		await surrealDBService.query(`UPDATE proposal_history:${id} SET ${updates}`, data as Record<string, unknown>);
		const result = await this.findById(id);
		return result!;
	}

	async findById(id: string): Promise<any | null> {
		const result = await surrealDBService.query<any[]>(`SELECT * FROM proposal_history WHERE id = $id`, { id });
		return result.data?.[0] || null;
	}

	async findMany(query: Record<string, unknown>, options?: { limit?: number; offset?: number }): Promise<any[]> {
		const whereClauses = Object.keys(query).map(key => `${key} = $${key}`).join(' AND ');
		const whereStr = whereClauses ? `WHERE ${whereClauses}` : '';
		const limitStr = options?.limit ? `LIMIT ${options.limit}` : '';
		const offsetStr = options?.offset ? `START ${options.offset}` : '';
		const result = await surrealDBService.query<any[]>(
			`SELECT * FROM proposal_history ${whereStr} ${limitStr} ${offsetStr}`,
			query
		);
		return result.data || [];
	}

	async count(query: Record<string, unknown>): Promise<number> {
		const whereClauses = Object.keys(query).map(key => `${key} = $${key}`).join(' AND ');
		const whereStr = whereClauses ? `WHERE ${whereClauses}` : '';
		const result = await surrealDBService.query<{ count: number }[]>(
			`SELECT count() FROM proposal_history ${whereStr} GROUP ALL`,
			query
		);
		return result.data?.[0]?.count || 0;
	}

	async delete(id: string): Promise<void> {
		await surrealDBService.query(`DELETE proposal_history:${id}`);
	}

	async findByProposalAndAction(proposalId: string, action: string): Promise<any[]> {
		const result = await surrealDBService.query<any[]>(
			'SELECT * FROM proposal_history WHERE proposalId = $proposalId AND action = $action ORDER BY timestamp DESC',
			{ proposalId, action }
		);
		return result.data || [];
	}
}

class UsersCollection implements DatabaseCollection<UserRecord> {
	async create(data: UserRecord): Promise<UserRecord> {
		await surrealDBService.query(
			'CREATE users SET id = $id, name = $name, email = $email, department = $department, role = $role, active = $active',
			data as unknown as Record<string, unknown>
		);
		return data;
	}

	async update(id: string, data: Partial<UserRecord>): Promise<UserRecord> {
		const updates = Object.entries(data)
			.map(([key, _]) => `${key} = $${key}`)
			.join(', ');
		await surrealDBService.query(`UPDATE users:${id} SET ${updates}`, data as Record<string, unknown>);
		const result = await this.findById(id);
		return result!;
	}

	async findById(id: string): Promise<UserRecord | null> {
		const result = await surrealDBService.query<UserRecord[]>(`SELECT * FROM users WHERE id = $id`, { id });
		if (result.data?.[0]) {
			return result.data[0];
		}
		// Return mock user if not found
		return {
			id,
			name: `User ${id}`,
			email: `user_${id}@theroundtable.ai`,
			department: 'General',
			role: 'member',
			active: true
		};
	}

	async findMany(query: Record<string, unknown>, options?: { limit?: number; offset?: number }): Promise<UserRecord[]> {
		const whereClauses = Object.keys(query).map(key => `${key} = $${key}`).join(' AND ');
		const whereStr = whereClauses ? `WHERE ${whereClauses}` : '';
		const limitStr = options?.limit ? `LIMIT ${options.limit}` : '';
		const offsetStr = options?.offset ? `START ${options.offset}` : '';
		const result = await surrealDBService.query<UserRecord[]>(
			`SELECT * FROM users ${whereStr} ${limitStr} ${offsetStr}`,
			query
		);
		return result.data || [];
	}

	async count(query: Record<string, unknown>): Promise<number> {
		const whereClauses = Object.keys(query).map(key => `${key} = $${key}`).join(' AND ');
		const whereStr = whereClauses ? `WHERE ${whereClauses}` : '';
		const result = await surrealDBService.query<{ count: number }[]>(
			`SELECT count() FROM users ${whereStr} GROUP ALL`,
			query
		);
		return result.data?.[0]?.count || 0;
	}

	async delete(id: string): Promise<void> {
		await surrealDBService.query(`DELETE users:${id}`);
	}
}

export class DatabaseService {
	public readonly proposals: ProposalsCollection;
	public readonly proposalHistory: ProposalHistoryCollection;
	public readonly users: UsersCollection;

	constructor() {
		this.proposals = new ProposalsCollection();
		this.proposalHistory = new ProposalHistoryCollection();
		this.users = new UsersCollection();
		logger.info('DatabaseService initialized');
	}
}

export const databaseService = new DatabaseService();

/**
 * Graph Seeder Utility
 *
 * TODO: This utility needs to be refactored from Neo4j to SurrealDB.
 * The original implementation used Neo4j for graph database operations.
 * It should be updated to use SurrealDB's graph capabilities.
 *
 * Handles parsing markdown files, creating vector embeddings,
 * and establishing knowledge graph for foundational documents.
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { z } from 'zod';
import { surrealDBService } from '../services/surrealdb-service';
import { createLogger } from './logger';

// Configuration validation schema - updated for SurrealDB
const GraphSeederConfigSchema = z.object({
	openaiApiKey: z.string().min(1),
	documentsPath: z.string().min(1),
	embeddingModel: z.string().default('text-embedding-3-small'),
	chunkSize: z.number().min(100).max(8000).default(1000),
	chunkOverlap: z.number().min(0).max(500).default(200),
});

type GraphSeederConfig = z.infer<typeof GraphSeederConfigSchema>;

// Document schemas
const DocumentMetadataSchema = z.object({
	title: z.string(),
	type: z.enum(['genesis', 'constitution', 'vision']),
	version: z.string().default('1.0.0'),
	created: z.date().default(() => new Date()),
	description: z.string().optional(),
	tags: z.array(z.string()).default([]),
});

type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

interface DocumentChunk {
	id: string;
	content: string;
	embedding: number[];
	chunkIndex: number;
	startChar: number;
	endChar: number;
	tokens: number;
	metadata: Record<string, unknown>;
}

interface Document {
	id: string;
	metadata: DocumentMetadata;
	content: string;
	chunks: DocumentChunk[];
	hash: string;
}

/**
 * Utility class for seeding graph database with foundational documents
 * Handles parsing markdown files, creating vector embeddings, and establishing knowledge graph
 *
 * Updated to use SurrealDB instead of Neo4j
 */
export class GraphSeeder {
	private openai: OpenAI;
	private config: GraphSeederConfig;
	private logger: ReturnType<typeof createLogger>;

	constructor(config: Partial<GraphSeederConfig>) {
		this.config = GraphSeederConfigSchema.parse({
			...config,
			openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
			documentsPath: config.documentsPath || process.env.DOCUMENTS_PATH || './documents',
		});

		this.openai = new OpenAI({
			apiKey: this.config.openaiApiKey,
		});

		this.logger = createLogger('GraphSeeder');
	}

	/**
	 * Initialize the graph database with proper indexes and constraints
	 */
	async initialize(): Promise<void> {
		try {
			this.logger.info('Initializing graph database schema for SurrealDB');

			// Create document table schema
			await surrealDBService.query(`
				DEFINE TABLE document SCHEMAFULL;
				DEFINE FIELD id ON TABLE document TYPE record<document>;
				DEFINE FIELD title ON TABLE document TYPE string;
				DEFINE FIELD type ON TABLE document TYPE string;
				DEFINE FIELD version ON TABLE document TYPE string DEFAULT '1.0.0';
				DEFINE FIELD created ON TABLE document TYPE datetime DEFAULT time::now();
				DEFINE FIELD description ON TABLE document TYPE option<string>;
				DEFINE FIELD tags ON TABLE document TYPE array<string> DEFAULT [];
				DEFINE FIELD hash ON TABLE document TYPE string;
				DEFINE FIELD content ON TABLE document TYPE string;
				DEFINE FIELD updated_at ON TABLE document TYPE datetime DEFAULT time::now();
				DEFINE INDEX document_type ON TABLE document COLUMNS type;
			`);

			// Create chunk table schema
			await surrealDBService.query(`
				DEFINE TABLE chunk SCHEMAFULL;
				DEFINE FIELD id ON TABLE chunk TYPE record<chunk>;
				DEFINE FIELD content ON TABLE chunk TYPE string;
				DEFINE FIELD embedding ON TABLE chunk TYPE array<float>;
				DEFINE FIELD chunk_index ON TABLE chunk TYPE int;
				DEFINE FIELD start_char ON TABLE chunk TYPE int;
				DEFINE FIELD end_char ON TABLE chunk TYPE int;
				DEFINE FIELD tokens ON TABLE chunk TYPE int;
				DEFINE FIELD document_id ON TABLE chunk TYPE string;
				DEFINE FIELD document_type ON TABLE chunk TYPE string;
				DEFINE FIELD document_title ON TABLE chunk TYPE string;
				DEFINE FIELD updated_at ON TABLE chunk TYPE datetime DEFAULT time::now();
				DEFINE INDEX chunk_document ON TABLE chunk COLUMNS document_id;
			`);

			this.logger.info('Graph database initialization completed');
		} catch (error) {
			this.logger.error('Failed to initialize graph database', { error });
			throw error;
		}
	}

	/**
	 * Seed the graph with foundational documents
	 */
	async seedFoundationalDocuments(): Promise<void> {
		try {
			this.logger.info('Starting foundational documents seeding');

			const documents = await this.loadDocuments();

			for (const document of documents) {
				await this.processDocument(document);
			}

			await this.createDocumentRelationships();

			this.logger.info('Foundational documents seeding completed', {
				documentsProcessed: documents.length,
			});
		} catch (error) {
			this.logger.error('Failed to seed foundational documents', { error });
			throw error;
		}
	}

	/**
	 * Load and parse markdown documents from the filesystem
	 */
	private async loadDocuments(): Promise<Document[]> {
		const documentsPath = this.config.documentsPath;
		const documents: Document[] = [];

		try {
			const files = await fs.readdir(documentsPath);
			const markdownFiles = files.filter(file => file.endsWith('.md'));

			for (const file of markdownFiles) {
				const filePath = path.join(documentsPath, file);
				const content = await fs.readFile(filePath, 'utf-8');

				const document = await this.parseDocument(file, content);
				documents.push(document);
			}

			this.logger.info('Documents loaded successfully', {
				documentsCount: documents.length,
				files: markdownFiles,
			});

			return documents;
		} catch (error) {
			this.logger.error('Failed to load documents', { error, documentsPath });
			throw new Error(`Failed to load documents from ${documentsPath}: ${error}`);
		}
	}

	/**
	 * Parse a markdown document and extract metadata
	 */
	private async parseDocument(filename: string, content: string): Promise<Document> {
		try {
			const id = this.generateDocumentId(filename);
			const hash = createHash('sha256').update(content).digest('hex');

			// Extract frontmatter metadata if present
			const metadata = this.extractMetadata(filename, content);

			// Clean content (remove frontmatter)
			const cleanContent = this.cleanContent(content);

			// Create chunks with embeddings
			const chunks = await this.createChunks(id, cleanContent, metadata);

			return {
				id,
				metadata,
				content: cleanContent,
				chunks,
				hash,
			};
		} catch (error) {
			this.logger.error('Failed to parse document', { error, filename });
			throw error;
		}
	}

	/**
	 * Extract metadata from document filename and content
	 */
	private extractMetadata(filename: string, content: string): DocumentMetadata {
		const baseName = path.basename(filename, '.md');

		// Determine document type from filename
		let type: 'genesis' | 'constitution' | 'vision';
		if (baseName.toLowerCase().includes('genesis')) {
			type = 'genesis';
		} else if (baseName.toLowerCase().includes('constitution')) {
			type = 'constitution';
		} else if (baseName.toLowerCase().includes('vision')) {
			type = 'vision';
		} else {
			type = 'genesis'; // default
		}

		// Extract frontmatter if present
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		let frontmatter: Record<string, unknown> = {};

		if (frontmatterMatch) {
			try {
				// Simple YAML parsing for basic key-value pairs
				const yamlContent = frontmatterMatch[1];
				frontmatter = this.parseSimpleYAML(yamlContent);
			} catch (error) {
				this.logger.warn('Failed to parse frontmatter', { filename, error });
			}
		}

		return DocumentMetadataSchema.parse({
			title: (frontmatter.title as string) || this.titleCase(baseName),
			type: (frontmatter.type as string) || type,
			version: (frontmatter.version as string) || '1.0.0',
			description: frontmatter.description as string,
			tags: (frontmatter.tags as string[]) || [],
			created: frontmatter.created ? new Date(frontmatter.created as string) : new Date(),
		});
	}

	/**
	 * Simple YAML parser for basic key-value pairs
	 */
	private parseSimpleYAML(yaml: string): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		const lines = yaml.split('\n');

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const colonIndex = trimmed.indexOf(':');
				if (colonIndex !== -1) {
					const key = trimmed.substring(0, colonIndex).trim();
					let value: unknown = trimmed.substring(colonIndex + 1).trim();

					// Remove quotes and parse arrays
					if (typeof value === 'string') {
						let strValue = value;
						if ((strValue.startsWith('"') && strValue.endsWith('"')) ||
							(strValue.startsWith("'") && strValue.endsWith("'"))) {
							strValue = strValue.slice(1, -1);
						}

						// Parse arrays
						if (strValue.startsWith('[') && strValue.endsWith(']')) {
							value = strValue.slice(1, -1).split(',').map((item: string) => item.trim().replace(/['"]/g, ''));
						} else {
							value = strValue;
						}
					}

					result[key] = value;
				}
			}
		}

		return result;
	}

	/**
	 * Clean document content by removing frontmatter
	 */
	private cleanContent(content: string): string {
		return content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
	}

	/**
	 * Create text chunks with embeddings for vector search
	 */
	private async createChunks(documentId: string, content: string, metadata: DocumentMetadata): Promise<DocumentChunk[]> {
		const chunks: DocumentChunk[] = [];
		const { chunkSize, chunkOverlap } = this.config;

		// Split content into chunks
		const textChunks = this.splitTextIntoChunks(content, chunkSize, chunkOverlap);

		for (let i = 0; i < textChunks.length; i++) {
			const chunk = textChunks[i];
			const chunkId = `${documentId}_chunk_${i}`;

			try {
				// Generate embedding
				const embedding = await this.generateEmbedding(chunk.text);

				chunks.push({
					id: chunkId,
					content: chunk.text,
					embedding,
					chunkIndex: i,
					startChar: chunk.startChar,
					endChar: chunk.endChar,
					tokens: this.estimateTokens(chunk.text),
					metadata: {
						documentId,
						documentType: metadata.type,
						documentTitle: metadata.title,
					},
				});

				// Rate limiting for OpenAI API
				await this.sleep(100);
			} catch (error) {
				this.logger.error('Failed to create chunk', { error, chunkId });
				throw error;
			}
		}

		this.logger.info('Chunks created successfully', {
			documentId,
			chunksCount: chunks.length,
		});

		return chunks;
	}

	/**
	 * Split text into overlapping chunks
	 */
	private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): Array<{ text: string; startChar: number; endChar: number }> {
		const chunks: Array<{ text: string; startChar: number; endChar: number }> = [];
		let start = 0;

		while (start < text.length) {
			let end = start + chunkSize;

			// Try to break at sentence or paragraph boundaries
			if (end < text.length) {
				const lastSentence = text.lastIndexOf('.', end);
				const lastParagraph = text.lastIndexOf('\n\n', end);
				const breakPoint = Math.max(lastSentence, lastParagraph);

				if (breakPoint > start + chunkSize * 0.5) {
					end = breakPoint + 1;
				}
			}

			const chunkText = text.slice(start, end).trim();
			if (chunkText.length > 0) {
				chunks.push({
					text: chunkText,
					startChar: start,
					endChar: end,
				});
			}

			start = Math.max(start + 1, end - overlap);
		}

		return chunks;
	}

	/**
	 * Generate embedding using OpenAI API
	 */
	private async generateEmbedding(text: string): Promise<number[]> {
		try {
			const response = await this.openai.embeddings.create({
				model: this.config.embeddingModel,
				input: text,
			});

			return response.data[0].embedding;
		} catch (error) {
			this.logger.error('Failed to generate embedding', { error });
			throw error;
		}
	}

	/**
	 * Process a document and create graph nodes and relationships
	 */
	private async processDocument(document: Document): Promise<void> {
		try {
			this.logger.info('Processing document', { documentId: document.id });

			// Create document node
			await this.createDocumentNode(document);

			// Create chunk nodes
			await this.createChunkNodes(document);

			this.logger.info('Document processed successfully', { documentId: document.id });
		} catch (error) {
			this.logger.error('Failed to process document', { error, documentId: document.id });
			throw error;
		}
	}

	/**
	 * Create document node in SurrealDB
	 */
	private async createDocumentNode(document: Document): Promise<void> {
		await surrealDBService.create({
			table: 'document',
			id: document.id,
			data: {
				title: document.metadata.title,
				type: document.metadata.type,
				version: document.metadata.version,
				created: document.metadata.created.toISOString(),
				description: document.metadata.description || null,
				tags: document.metadata.tags,
				hash: document.hash,
				content: document.content,
				updated_at: new Date().toISOString(),
			}
		});
	}

	/**
	 * Create chunk nodes with vector embeddings
	 */
	private async createChunkNodes(document: Document): Promise<void> {
		for (const chunk of document.chunks) {
			await surrealDBService.create({
				table: 'chunk',
				id: chunk.id,
				data: {
					content: chunk.content,
					embedding: chunk.embedding,
					chunk_index: chunk.chunkIndex,
					start_char: chunk.startChar,
					end_char: chunk.endChar,
					tokens: chunk.tokens,
					document_id: chunk.metadata.documentId,
					document_type: chunk.metadata.documentType,
					document_title: chunk.metadata.documentTitle,
					updated_at: new Date().toISOString(),
				}
			});
		}
	}

	/**
	 * Create relationships between different document types using SurrealDB graph edges
	 */
	private async createDocumentRelationships(): Promise<void> {
		// Create hierarchical relationships using SurrealDB RELATE
		await surrealDBService.query(`
			LET $genesis = (SELECT id FROM document WHERE type = 'genesis' LIMIT 1);
			LET $constitution = (SELECT id FROM document WHERE type = 'constitution' LIMIT 1);
			LET $vision = (SELECT id FROM document WHERE type = 'vision' LIMIT 1);

			IF $genesis[0] AND $constitution[0] {
				RELATE $genesis[0].id->establishes->$constitution[0].id SET created_at = time::now();
			};

			IF $constitution[0] AND $vision[0] {
				RELATE $constitution[0].id->guides->$vision[0].id SET created_at = time::now();
			};

			IF $genesis[0] AND $vision[0] {
				RELATE $genesis[0].id->inspires->$vision[0].id SET created_at = time::now();
			};
		`);
	}

	/**
	 * Estimate token count for text
	 */
	private estimateTokens(text: string): number {
		// Rough estimation: 1 token ≈ 4 characters for English text
		return Math.ceil(text.length / 4);
	}

	/**
	 * Generate unique document ID from filename
	 */
	private generateDocumentId(filename: string): string {
		const baseName = path.basename(filename, '.md');
		return `doc_${baseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
	}

	/**
	 * Convert string to title case
	 */
	private titleCase(str: string): string {
		return str
			.replace(/[_-]/g, ' ')
			.replace(/\w\S*/g, txt =>
				txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
			);
	}

	/**
	 * Sleep utility for rate limiting
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Check if documents need reseeding based on file changes
	 */
	async needsReseeding(): Promise<boolean> {
		try {
			const documents = await this.loadDocuments();

			for (const document of documents) {
				const result = await surrealDBService.query(
					'SELECT hash FROM document WHERE id = $id',
					{ id: `document:${document.id}` }
				);

				const existingHash = (result.data as any[])?.[0]?.hash;
				if (!existingHash || existingHash !== document.hash) {
					return true;
				}
			}

			return false;
		} catch (error) {
			this.logger.error('Failed to check reseeding status', { error });
			return true;
		}
	}

	/**
	 * Clear existing graph data
	 */
	async clearGraph(): Promise<void> {
		this.logger.info('Clearing existing graph data');

		await surrealDBService.query('DELETE document');
		await surrealDBService.query('DELETE chunk');

		this.logger.info('Graph data cleared');
	}
}

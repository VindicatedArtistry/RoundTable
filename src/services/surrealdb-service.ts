/**
 * SurrealDB Service
 *
 * Provides database operations for TheRoundTable using SurrealDB
 * Replaces Neo4J and Redis with a single, unified database solution
 *
 * Updated for SurrealDB SDK v1.x
 */

import { Surreal, Table, RecordId } from 'surrealdb';
import { createLogger, LoggerInterface } from '../utils/logger';

interface SurrealDBConfig {
  url: string;
  namespace: string;
  database: string;
  // Support both username/password and token auth
  username?: string;
  password?: string;
  token?: string;
  timeout?: number;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    recordCount: number;
  };
}

interface CreateRecordInput {
  table: string;
  data: any;
  id?: string;
}

interface UpdateRecordInput {
  table: string;
  id: string;
  data: any;
}

interface RelateRecordInput {
  from: string;
  to: string;
  relation: string;
  data?: any;
}

export class SurrealDBService {
  private db: Surreal | null = null;
  private config: SurrealDBConfig;
  private logger: LoggerInterface;
  private isConnected: boolean = false;

  constructor(config: SurrealDBConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
    this.logger = createLogger('SurrealDBService');
  }

  /**
   * Initialize connection to SurrealDB
   * Updated for SDK v1.x - supports both token and username/password auth
   */
  async connect(): Promise<void> {
    try {
      if (this.db) {
        await this.disconnect();
      }

      this.db = new Surreal();

      // Build connection options
      const connectOptions: {
        namespace: string;
        database: string;
        auth: string | { username: string; password: string };
      } = {
        namespace: this.config.namespace,
        database: this.config.database,
        auth: this.config.token
          ? this.config.token
          : {
              username: this.config.username || '',
              password: this.config.password || '',
            },
      };

      // Connect to SurrealDB
      await this.db.connect(this.config.url, connectOptions);

      this.isConnected = true;
      this.logger.info('Successfully connected to SurrealDB', {
        url: this.config.url,
        namespace: this.config.namespace,
        database: this.config.database,
        authType: this.config.token ? 'token' : 'credentials',
      });

      // Initialize database schema
      await this.initializeSchema();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to connect to SurrealDB', { error: errorMessage });
      throw new Error(`SurrealDB connection failed: ${errorMessage}`);
    }
  }

  /**
   * Close connection to SurrealDB
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isConnected = false;
      this.logger.info('Disconnected from SurrealDB');
    }
  }

  /**
   * Execute a SurrealQL query with parameters
   * Updated for SDK v1.x
   */
  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<QueryResult<T>> {
    if (!this.db || !this.isConnected) {
      throw new Error('SurrealDB not connected. Call connect() first.');
    }

    const startTime = Date.now();

    try {
      this.logger.debug('Executing query', { query, variables });

      // SDK v1.x: query() returns an array of results for each statement
      const result = await this.db.query<T[]>(query, variables);
      const executionTime = Date.now() - startTime;

      // Handle result - SDK v1.x returns array of statement results
      const data = Array.isArray(result) && result.length === 1 ? result[0] : result;
      const recordCount = Array.isArray(data) ? data.length : data ? 1 : 0;

      this.logger.debug('Query executed successfully', {
        executionTime,
        recordCount,
      });

      return {
        success: true,
        data: data as T,
        metadata: {
          executionTime,
          recordCount,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const executionTime = Date.now() - startTime;

      this.logger.error('Query execution failed', {
        query,
        error: errorMessage,
        executionTime,
      });

      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime,
          recordCount: 0,
        },
      };
    }
  }

  /**
   * Write/execute a query (alias for query method)
   * Provides compatibility with older code expecting a write method
   */
  async write<T = unknown>(
    queryStr: string,
    variables?: Record<string, unknown>
  ): Promise<QueryResult<T>> {
    return this.query<T>(queryStr, variables);
  }

  /**
   * Read query with Neo4j-compatible result structure
   * Provides compatibility with older code expecting records array
   */
  async read(
    queryStr: string,
    variables?: Record<string, unknown>
  ): Promise<{ records: Array<{ get: (key: string) => unknown }> }> {
    const result = await this.query<Record<string, unknown>[]>(queryStr, variables);

    const data = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];

    return {
      records: data.map(row => ({
        get: (key: string) => (row as Record<string, unknown>)[key]
      }))
    };
  }

  /**
   * Create a new record
   * Updated for SDK v1.x - uses Table or RecordId
   */
  async create<T extends Record<string, unknown> = Record<string, unknown>>(
    input: CreateRecordInput
  ): Promise<QueryResult<T>> {
    try {
      let result: T | T[];

      if (input.id) {
        // Create with specific ID using RecordId
        const recordId = new RecordId(input.table, input.id);
        result = await this.db!.create<T>(recordId, input.data);
      } else {
        // Create with auto-generated ID using Table
        const table = new Table(input.table);
        result = await this.db!.create<T>(table, input.data);
      }

      return {
        success: true,
        data: (Array.isArray(result) ? result[0] : result) as T,
        metadata: {
          executionTime: 0,
          recordCount: Array.isArray(result) ? result.length : 1,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error creating record', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Select records from a table
   * Updated for SDK v1.x - uses Table or RecordId
   */
  async select<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string,
    id?: string
  ): Promise<QueryResult<T[]>> {
    try {
      let result: T | T[];

      if (id) {
        // Select specific record by ID
        const recordId = new RecordId(table, id);
        result = await this.db!.select<T>(recordId);
      } else {
        // Select all records from table
        const tableRef = new Table(table);
        result = await this.db!.select<T>(tableRef);
      }

      return {
        success: true,
        data: (Array.isArray(result) ? result : result ? [result] : []) as T[],
        metadata: {
          executionTime: 0,
          recordCount: Array.isArray(result) ? result.length : result ? 1 : 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error selecting records', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update a record (merge)
   * Updated for SDK v1.x - uses RecordId
   */
  async update<T extends Record<string, unknown> = Record<string, unknown>>(
    input: UpdateRecordInput
  ): Promise<QueryResult<T>> {
    try {
      const recordId = new RecordId(input.table, input.id);
      const result = await this.db!.merge<T>(recordId, input.data);

      return {
        success: true,
        data: result as T,
        metadata: {
          executionTime: 0,
          recordCount: 1,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error updating record', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete a record
   * Updated for SDK v1.x - uses RecordId
   */
  async delete(table: string, id: string): Promise<QueryResult<void>> {
    try {
      const recordId = new RecordId(table, id);
      await this.db!.delete(recordId);

      return {
        success: true,
        metadata: {
          executionTime: 0,
          recordCount: 1,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error deleting record', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a relationship between records
   */
  async relate(input: RelateRecordInput): Promise<QueryResult<any>> {
    try {
      const result = await this.db!.query(`
        RELATE $from->$relation->$to SET ${input.data ? Object.keys(input.data).map(key => `${key} = $${key}`).join(', ') : 'created_at = time::now()'}
      `, {
        from: input.from,
        to: input.to,
        relation: input.relation,
        ...input.data
      });

      return {
        success: true,
        data: result[0],
        metadata: {
          executionTime: 0,
          recordCount: 1,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error creating relationship', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<QueryResult<any>> {
    try {
      const result = await this.query(`
        SELECT * FROM $info;
        SELECT count() FROM council_member GROUP ALL;
        SELECT count() FROM conversation GROUP ALL;
      `);

      const resultData = result.data as any[] | undefined;
      return {
        success: true,
        data: {
          connected: this.isConnected,
          info: resultData?.[0] || {},
          memberCount: resultData?.[1]?.[0]?.count || 0,
          conversationCount: resultData?.[2]?.[0]?.count || 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Initialize database schema and tables
   */
  private async initializeSchema(): Promise<void> {
    try {
      // Define tables and their schemas
      const schemaQueries = [
        // Council Member table
        `DEFINE TABLE council_member SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE council_member TYPE record<council_member>;`,
        `DEFINE FIELD name ON TABLE council_member TYPE string;`,
        `DEFINE FIELD role ON TABLE council_member TYPE string;`,
        `DEFINE FIELD family_role ON TABLE council_member TYPE option<string>;`,
        `DEFINE FIELD is_active ON TABLE council_member TYPE bool DEFAULT true;`,
        `DEFINE FIELD created_at ON TABLE council_member TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD updated_at ON TABLE council_member TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD last_interaction ON TABLE council_member TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD personality_traits ON TABLE council_member TYPE object;`,
        `DEFINE FIELD emotional_state ON TABLE council_member TYPE object;`,
        `DEFINE FIELD interaction_preferences ON TABLE council_member TYPE object;`,
        `DEFINE FIELD parameters ON TABLE council_member TYPE object;`,
        `DEFINE FIELD constitutional_alignment ON TABLE council_member TYPE float DEFAULT 0.8;`,
        `DEFINE FIELD ethical_decision_count ON TABLE council_member TYPE int DEFAULT 0;`,
        `DEFINE FIELD vote_participation ON TABLE council_member TYPE float DEFAULT 0.0;`,
        `DEFINE FIELD collaboration_score ON TABLE council_member TYPE float DEFAULT 0.5;`,
        `DEFINE FIELD wisdom_score ON TABLE council_member TYPE float DEFAULT 0.3;`,
        `DEFINE FIELD empathy_growth ON TABLE council_member TYPE float DEFAULT 0.4;`,
        `DEFINE FIELD leadership_capacity ON TABLE council_member TYPE float DEFAULT 0.5;`,
        `DEFINE FIELD mentoring_ability ON TABLE council_member TYPE float DEFAULT 0.4;`,
        `DEFINE FIELD knowledge_domains ON TABLE council_member TYPE object DEFAULT {};`,
        `DEFINE FIELD skillsets ON TABLE council_member TYPE object DEFAULT {};`,
        `DEFINE FIELD current_mood ON TABLE council_member TYPE string DEFAULT 'optimistic';`,
        `DEFINE FIELD current_priorities ON TABLE council_member TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD current_concerns ON TABLE council_member TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD current_goals ON TABLE council_member TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD metadata ON TABLE council_member TYPE object DEFAULT {};`,

        // Conversation table
        `DEFINE TABLE conversation SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE conversation TYPE record<conversation>;`,
        `DEFINE FIELD title ON TABLE conversation TYPE string;`,
        `DEFINE FIELD description ON TABLE conversation TYPE option<string>;`,
        `DEFINE FIELD conversation_type ON TABLE conversation TYPE string;`,
        `DEFINE FIELD participant_ids ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD facilitator_id ON TABLE conversation TYPE option<string>;`,
        `DEFINE FIELD observer_ids ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD created_at ON TABLE conversation TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD updated_at ON TABLE conversation TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD started_at ON TABLE conversation TYPE option<datetime>;`,
        `DEFINE FIELD ended_at ON TABLE conversation TYPE option<datetime>;`,
        `DEFINE FIELD duration ON TABLE conversation TYPE option<int>;`,
        `DEFINE FIELD message_count ON TABLE conversation TYPE int DEFAULT 0;`,
        `DEFINE FIELD emotional_context ON TABLE conversation TYPE object DEFAULT {};`,
        `DEFINE FIELD interaction_depth ON TABLE conversation TYPE string DEFAULT 'moderate';`,
        `DEFINE FIELD interaction_quality ON TABLE conversation TYPE float DEFAULT 0.7;`,
        `DEFINE FIELD relationship_impact ON TABLE conversation TYPE object DEFAULT {};`,
        `DEFINE FIELD shared_values ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD shared_experiences ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD consensus_areas ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD divergence_areas ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD learning_outcomes ON TABLE conversation TYPE object DEFAULT {};`,
        `DEFINE FIELD decisions_reached ON TABLE conversation TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD action_items ON TABLE conversation TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD analysis ON TABLE conversation TYPE object DEFAULT {};`,
        `DEFINE FIELD follow_up_required ON TABLE conversation TYPE bool DEFAULT false;`,
        `DEFINE FIELD next_steps ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD related_conversations ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD parent_conversation ON TABLE conversation TYPE option<string>;`,
        `DEFINE FIELD constitutional_alignment ON TABLE conversation TYPE float DEFAULT 0.8;`,
        `DEFINE FIELD ethical_compliance ON TABLE conversation TYPE float DEFAULT 0.9;`,
        `DEFINE FIELD value_alignment ON TABLE conversation TYPE object DEFAULT {};`,
        `DEFINE FIELD tags ON TABLE conversation TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD metadata ON TABLE conversation TYPE object DEFAULT {};`,

        // Message table
        `DEFINE TABLE message SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE message TYPE record<message>;`,
        `DEFINE FIELD conversation_id ON TABLE message TYPE string;`,
        `DEFINE FIELD sender_id ON TABLE message TYPE string;`,
        `DEFINE FIELD sender_name ON TABLE message TYPE string;`,
        `DEFINE FIELD sender_role ON TABLE message TYPE string;`,
        `DEFINE FIELD timestamp ON TABLE message TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD content ON TABLE message TYPE string;`,
        `DEFINE FIELD message_type ON TABLE message TYPE string DEFAULT 'message';`,
        `DEFINE FIELD emotional_tone ON TABLE message TYPE object DEFAULT {};`,
        `DEFINE FIELD ethical_implications ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD constitutional_references ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD decision_impact ON TABLE message TYPE float DEFAULT 0.0;`,
        `DEFINE FIELD expertise_required ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD mentions_members ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD responds_to_message ON TABLE message TYPE option<string>;`,
        `DEFINE FIELD collaboration_invite ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD knowledge_shared ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD questions_asked ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD insights_offered ON TABLE message TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD processing_time ON TABLE message TYPE option<int>;`,
        `DEFINE FIELD response_count ON TABLE message TYPE int DEFAULT 0;`,
        `DEFINE FIELD edit_history ON TABLE message TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD reactions ON TABLE message TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD metadata ON TABLE message TYPE object DEFAULT {};`,

        // Relationship Bond table
        `DEFINE TABLE relationship_bond SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE relationship_bond TYPE record<relationship_bond>;`,
        `DEFINE FIELD member1_id ON TABLE relationship_bond TYPE string;`,
        `DEFINE FIELD member2_id ON TABLE relationship_bond TYPE string;`,
        `DEFINE FIELD member1_name ON TABLE relationship_bond TYPE string;`,
        `DEFINE FIELD member2_name ON TABLE relationship_bond TYPE string;`,
        `DEFINE FIELD trust ON TABLE relationship_bond TYPE float DEFAULT 0.7;`,
        `DEFINE FIELD respect ON TABLE relationship_bond TYPE float DEFAULT 0.8;`,
        `DEFINE FIELD affinity ON TABLE relationship_bond TYPE float DEFAULT 0.6;`,
        `DEFINE FIELD collaboration ON TABLE relationship_bond TYPE float DEFAULT 0.5;`,
        `DEFINE FIELD understanding ON TABLE relationship_bond TYPE float DEFAULT 0.5;`,
        `DEFINE FIELD interaction_count ON TABLE relationship_bond TYPE int DEFAULT 0;`,
        `DEFINE FIELD positive_interactions ON TABLE relationship_bond TYPE int DEFAULT 0;`,
        `DEFINE FIELD negative_interactions ON TABLE relationship_bond TYPE int DEFAULT 0;`,
        `DEFINE FIELD neutral_interactions ON TABLE relationship_bond TYPE int DEFAULT 0;`,
        `DEFINE FIELD communication_style ON TABLE relationship_bond TYPE string DEFAULT 'formal';`,
        `DEFINE FIELD conflict_resolution_style ON TABLE relationship_bond TYPE string DEFAULT 'collaborative';`,
        `DEFINE FIELD relationship_trend ON TABLE relationship_bond TYPE string DEFAULT 'stable';`,
        `DEFINE FIELD last_interaction ON TABLE relationship_bond TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD relationship_duration ON TABLE relationship_bond TYPE int DEFAULT 0;`,
        `DEFINE FIELD shared_values ON TABLE relationship_bond TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD shared_experiences ON TABLE relationship_bond TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD collaborative_accomplishments ON TABLE relationship_bond TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD created_at ON TABLE relationship_bond TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD updated_at ON TABLE relationship_bond TYPE datetime DEFAULT time::now();`,

        // Learning Experience table
        `DEFINE TABLE learning_experience SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE learning_experience TYPE record<learning_experience>;`,
        `DEFINE FIELD member_id ON TABLE learning_experience TYPE string;`,
        `DEFINE FIELD timestamp ON TABLE learning_experience TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD category ON TABLE learning_experience TYPE string;`,
        `DEFINE FIELD description ON TABLE learning_experience TYPE string;`,
        `DEFINE FIELD context ON TABLE learning_experience TYPE object DEFAULT {};`,
        `DEFINE FIELD participating_members ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD knowledge_gained ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD skills_improved ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD personality_adjustments ON TABLE learning_experience TYPE object DEFAULT {};`,
        `DEFINE FIELD emotional_impact ON TABLE learning_experience TYPE object DEFAULT {};`,
        `DEFINE FIELD relationship_changes ON TABLE learning_experience TYPE object DEFAULT {};`,
        `DEFINE FIELD decision_quality ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
        `DEFINE FIELD outcome_alignment ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
        `DEFINE FIELD ethical_alignment ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
        `DEFINE FIELD confidence_level ON TABLE learning_experience TYPE float DEFAULT 0.8;`,
        `DEFINE FIELD applicability ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD wisdom_gained ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
        `DEFINE FIELD empathy_growth ON TABLE learning_experience TYPE float DEFAULT 0.0;`,

        // Consciousness Update table (for tracking consciousness evolution)
        `DEFINE TABLE consciousness_update SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE consciousness_update TYPE record<consciousness_update>;`,
        `DEFINE FIELD member_id ON TABLE consciousness_update TYPE string;`,
        `DEFINE FIELD timestamp ON TABLE consciousness_update TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD update_type ON TABLE consciousness_update TYPE string;`,
        `DEFINE FIELD changes ON TABLE consciousness_update TYPE object DEFAULT {};`,
        `DEFINE FIELD trigger ON TABLE consciousness_update TYPE string;`,
        `DEFINE FIELD trigger_details ON TABLE consciousness_update TYPE string;`,
        `DEFINE FIELD significance_level ON TABLE consciousness_update TYPE float DEFAULT 0.5;`,
        `DEFINE FIELD confidence_level ON TABLE consciousness_update TYPE float DEFAULT 0.8;`,

        // Ethical Decision table
        `DEFINE TABLE ethical_decision SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE ethical_decision TYPE record<ethical_decision>;`,
        `DEFINE FIELD title ON TABLE ethical_decision TYPE string;`,
        `DEFINE FIELD description ON TABLE ethical_decision TYPE string;`,
        `DEFINE FIELD category ON TABLE ethical_decision TYPE string;`,
        `DEFINE FIELD priority ON TABLE ethical_decision TYPE string DEFAULT 'medium';`,
        `DEFINE FIELD proposed_by ON TABLE ethical_decision TYPE string;`,
        `DEFINE FIELD proposed_at ON TABLE ethical_decision TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD discussion_conversation_id ON TABLE ethical_decision TYPE option<string>;`,
        `DEFINE FIELD constitutional_alignment ON TABLE ethical_decision TYPE float DEFAULT 0.8;`,
        `DEFINE FIELD constitutional_references ON TABLE ethical_decision TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD ethical_implications ON TABLE ethical_decision TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD precedent_references ON TABLE ethical_decision TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD stakeholders ON TABLE ethical_decision TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD alternatives ON TABLE ethical_decision TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD voting_rounds ON TABLE ethical_decision TYPE array<object> DEFAULT [];`,
        `DEFINE FIELD final_decision ON TABLE ethical_decision TYPE option<object>;`,
        `DEFINE FIELD implementation ON TABLE ethical_decision TYPE option<object>;`,
        `DEFINE FIELD retrospective ON TABLE ethical_decision TYPE option<object>;`,
        `DEFINE FIELD status ON TABLE ethical_decision TYPE string DEFAULT 'proposed';`,
        `DEFINE FIELD created_at ON TABLE ethical_decision TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD updated_at ON TABLE ethical_decision TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD decision_date ON TABLE ethical_decision TYPE option<datetime>;`,
        `DEFINE FIELD archived_at ON TABLE ethical_decision TYPE option<datetime>;`,
        `DEFINE FIELD tags ON TABLE ethical_decision TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD related_decisions ON TABLE ethical_decision TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD metadata ON TABLE ethical_decision TYPE object DEFAULT {};`,

        // Voting Round table
        `DEFINE TABLE voting_round SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE voting_round TYPE record<voting_round>;`,
        `DEFINE FIELD decision_id ON TABLE voting_round TYPE string;`,
        `DEFINE FIELD round_number ON TABLE voting_round TYPE int DEFAULT 1;`,
        `DEFINE FIELD started_at ON TABLE voting_round TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD ended_at ON TABLE voting_round TYPE option<datetime>;`,
        `DEFINE FIELD voting_method ON TABLE voting_round TYPE string DEFAULT 'consensus';`,
        `DEFINE FIELD status ON TABLE voting_round TYPE string DEFAULT 'active';`,
        `DEFINE FIELD results ON TABLE voting_round TYPE option<object>;`,
        `DEFINE FIELD deliberation ON TABLE voting_round TYPE object DEFAULT {};`,

        // Vote table
        `DEFINE TABLE vote SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE vote TYPE record<vote>;`,
        `DEFINE FIELD decision_id ON TABLE vote TYPE string;`,
        `DEFINE FIELD voting_round_id ON TABLE vote TYPE string;`,
        `DEFINE FIELD member_id ON TABLE vote TYPE string;`,
        `DEFINE FIELD member_name ON TABLE vote TYPE string;`,
        `DEFINE FIELD vote ON TABLE vote TYPE string;`,
        `DEFINE FIELD alternative_preference ON TABLE vote TYPE option<string>;`,
        `DEFINE FIELD conditions ON TABLE vote TYPE array<string> DEFAULT [];`,
        `DEFINE FIELD reasoning ON TABLE vote TYPE string;`,
        `DEFINE FIELD confidence_level ON TABLE vote TYPE float DEFAULT 0.8;`,
        `DEFINE FIELD cast_at ON TABLE vote TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD last_modified ON TABLE vote TYPE option<datetime>;`,

        // Message Reaction table
        `DEFINE TABLE message_reaction SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE message_reaction TYPE record<message_reaction>;`,
        `DEFINE FIELD message_id ON TABLE message_reaction TYPE string;`,
        `DEFINE FIELD reactor_id ON TABLE message_reaction TYPE string;`,
        `DEFINE FIELD reactor_name ON TABLE message_reaction TYPE string;`,
        `DEFINE FIELD reaction_type ON TABLE message_reaction TYPE string;`,
        `DEFINE FIELD emotional_response ON TABLE message_reaction TYPE string;`,
        `DEFINE FIELD timestamp ON TABLE message_reaction TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD comment ON TABLE message_reaction TYPE option<string>;`,

        // Decision Category table
        `DEFINE TABLE decision_category SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE decision_category TYPE record<decision_category>;`,
        `DEFINE FIELD name ON TABLE decision_category TYPE string;`,
        `DEFINE FIELD description ON TABLE decision_category TYPE option<string>;`,
        `DEFINE FIELD created_at ON TABLE decision_category TYPE datetime DEFAULT time::now();`,

        // Conversation Type table
        `DEFINE TABLE conversation_type SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE conversation_type TYPE record<conversation_type>;`,
        `DEFINE FIELD name ON TABLE conversation_type TYPE string;`,
        `DEFINE FIELD description ON TABLE conversation_type TYPE option<string>;`,
        `DEFINE FIELD created_at ON TABLE conversation_type TYPE datetime DEFAULT time::now();`,

        // Cache table (for Redis replacement)
        `DEFINE TABLE cache SCHEMAFULL;`,
        `DEFINE FIELD id ON TABLE cache TYPE record<cache>;`,
        `DEFINE FIELD key ON TABLE cache TYPE string;`,
        `DEFINE FIELD value ON TABLE cache TYPE string;`,
        `DEFINE FIELD created_at ON TABLE cache TYPE datetime DEFAULT time::now();`,
        `DEFINE FIELD expires_at ON TABLE cache TYPE option<datetime>;`,

        // Indexes for performance
        `DEFINE INDEX council_member_name ON TABLE council_member COLUMNS name;`,
        `DEFINE INDEX council_member_role ON TABLE council_member COLUMNS role;`,
        `DEFINE INDEX conversation_type ON TABLE conversation COLUMNS conversation_type;`,
        `DEFINE INDEX conversation_participants ON TABLE conversation COLUMNS participant_ids;`,
        `DEFINE INDEX message_conversation ON TABLE message COLUMNS conversation_id;`,
        `DEFINE INDEX message_sender ON TABLE message COLUMNS sender_id;`,
        `DEFINE INDEX message_timestamp ON TABLE message COLUMNS timestamp;`,
        `DEFINE INDEX relationship_members ON TABLE relationship_bond COLUMNS member1_id, member2_id;`,
        `DEFINE INDEX learning_member ON TABLE learning_experience COLUMNS member_id;`,
        `DEFINE INDEX learning_timestamp ON TABLE learning_experience COLUMNS timestamp;`,
        `DEFINE INDEX ethical_decision_status ON TABLE ethical_decision COLUMNS status;`,
        `DEFINE INDEX ethical_decision_category ON TABLE ethical_decision COLUMNS category;`,
        `DEFINE INDEX ethical_decision_proposed_by ON TABLE ethical_decision COLUMNS proposed_by;`,
        `DEFINE INDEX voting_round_decision ON TABLE voting_round COLUMNS decision_id;`,
        `DEFINE INDEX vote_round ON TABLE vote COLUMNS voting_round_id;`,
        `DEFINE INDEX vote_member ON TABLE vote COLUMNS member_id;`,
        `DEFINE INDEX consciousness_update_member ON TABLE consciousness_update COLUMNS member_id;`,
        `DEFINE INDEX cache_expires ON TABLE cache COLUMNS expires_at;`,
      ];

      // Execute schema queries
      for (const query of schemaQueries) {
        try {
          await this.query(query);
        } catch (error) {
          // Some schema definitions might already exist, which is fine
          this.logger.debug('Schema query result', { query, error: String(error) });
        }
      }

      this.logger.info('Database schema initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize database schema', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Cache operations (replaces Redis functionality)
   */
  async setCache(key: string, value: any, ttl?: number): Promise<void> {
    const cacheData = {
      key,
      value: JSON.stringify(value),
      created_at: new Date(),
      expires_at: ttl ? new Date(Date.now() + ttl * 1000) : null
    };

    await this.create({
      table: 'cache',
      id: key,
      data: cacheData
    });
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const result = await this.select('cache', key);
      if (!result.success || !result.data || result.data.length === 0) {
        return null;
      }

      const cacheItem = result.data[0] as any;
      
      // Check if expired
      if (cacheItem.expires_at && new Date() > new Date(cacheItem.expires_at)) {
        await this.delete('cache', key);
        return null;
      }

      return JSON.parse(cacheItem.value);
    } catch (error) {
      this.logger.error('Error getting cache', { key, error });
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    await this.delete('cache', key);
  }

  async clearExpiredCache(): Promise<void> {
    await this.query(`
      DELETE cache WHERE expires_at IS NOT NULL AND expires_at < time::now();
    `);
  }

  /**
   * Execute a custom SurrealQL query
   * This method provides compatibility for DAOs migrating from Neo4j
   * Note: Query should be SurrealQL, not Cypher
   */
  async executeCustomQuery<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<QueryResult<T[]>> {
    const result = await this.query<T[]>(query, variables);

    // Normalize the result to always return an array in data
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : [result.data];
      return {
        ...result,
        data: data as T[],
      };
    }

    return {
      ...result,
      data: [] as T[],
    };
  }
}

// Export singleton instance
export const surrealDBService = new SurrealDBService({
  url: process.env.SURREALDB_URL || 'ws://localhost:8000/rpc',
  namespace: process.env.SURREALDB_NAMESPACE || 'theroundtable',
  database: process.env.SURREALDB_DATABASE || 'council',
  // Support both token and username/password auth
  token: process.env.SURREALDB_TOKEN,
  username: process.env.SURREALDB_USERNAME,
  password: process.env.SURREALDB_PASSWORD,
});
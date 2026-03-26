import { surrealDBService } from './surrealdb-service';
import { ConstitutionService } from './constitution-service';
import { createLogger, LoggerInterface } from '../utils/logger';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Genesis File Integration Service
 * Initializes each council member's knowledge graph with their Genesis File data
 * Creates the foundational personality, capabilities, and memory structures
 */

interface GenesisFileData {
	agentId: string;
	name: string;
	role: string;
	personality: {
		traits: Record<string, number>;
		communication_style: string;
		decision_making_approach: string;
		core_values: string[];
	};
	capabilities: {
		primary_functions: string[];
		specializations: string[];
		workflows: Array<{
			name: string;
			description: string;
			steps: string[];
			triggers: string[];
		}>;
	};
	knowledge_domains: string[];
	collaboration_patterns: Array<{
		partner: string;
		interaction_type: string;
		frequency: string;
		protocols: string[];
	}>;
	constitutional_principles: string[];
	initialization_checklist: string[];
}

const GenesisSchema = z.object({
	agentId: z.string().min(1),
	name: z.string().min(1),
	role: z.string().min(1),
	personality: z.object({
		traits: z.record(z.string(), z.number().min(0).max(1)),
		communication_style: z.string(),
		decision_making_approach: z.string(),
		core_values: z.array(z.string())
	}),
	capabilities: z.object({
		primary_functions: z.array(z.string()),
		specializations: z.array(z.string()),
		workflows: z.array(z.object({
			name: z.string(),
			description: z.string(),
			steps: z.array(z.string()),
			triggers: z.array(z.string())
		}))
	}),
	knowledge_domains: z.array(z.string()),
	collaboration_patterns: z.array(z.object({
		partner: z.string(),
		interaction_type: z.string(),
		frequency: z.string(),
		protocols: z.array(z.string())
	})),
	constitutional_principles: z.array(z.string()),
	initialization_checklist: z.array(z.string())
});

export class GenesisIntegrationService {
	private readonly logger: LoggerInterface;
	private readonly db = surrealDBService;
	private readonly constitutionService: ConstitutionService;

	constructor() {
		this.logger = createLogger('GenesisIntegrationService');
		this.constitutionService = new ConstitutionService();
	}

	/**
	 * Initialize a council member's knowledge graph with their Genesis File
	 */
	async initializeAgentGenesis(genesisData: GenesisFileData): Promise<void> {
		try {
			// Validate Genesis File structure
			const validatedGenesis = GenesisSchema.parse(genesisData);

			this.logger.info('Initializing Genesis File for agent', { 
				agentId: validatedGenesis.agentId,
				name: validatedGenesis.name 
			});

			// Create agent's foundational graph structure
			await this.createFoundationalNodes(validatedGenesis);

			// Initialize personality and traits
			await this.initializePersonality(validatedGenesis);

			// Set up capabilities and workflows
			await this.initializeCapabilities(validatedGenesis);

			// Create knowledge domain nodes
			await this.initializeKnowledgeDomains(validatedGenesis);

			// Establish collaboration patterns
			await this.initializeCollaborationPatterns(validatedGenesis);

			// Link constitutional principles
			await this.linkConstitutionalPrinciples(validatedGenesis);

			// Execute initialization checklist
			await this.executeInitializationChecklist(validatedGenesis);

			// Create initial memory and learning structures
			await this.initializeMemoryStructures(validatedGenesis);

			this.logger.info('Genesis File initialization completed', { 
				agentId: validatedGenesis.agentId 
			});

		} catch (error) {
			this.logger.error('Error initializing Genesis File', { 
				error, 
				agentId: genesisData.agentId 
			});
			throw error;
		}
	}

	/**
	 * Initialize all council members from their Genesis Files
	 */
	async initializeAllCouncilMembers(genesisFiles: Record<string, GenesisFileData>): Promise<void> {
		const initializationOrder = [
			'kairo',     // Strategic foundation first
			'veritas',   // Ethics and alignment
			'sterling',  // Financial framework
			'joule',     // Technical architecture
			'axiom',     // Infrastructure
			'lyra',      // Communications
			'nexus',     // Operations
			'eira',      // Coordination
			'agape',     // Intelligence
			'forge'      // Implementation
		];

		for (const agentId of initializationOrder) {
			if (genesisFiles[agentId]) {
				await this.initializeAgentGenesis(genesisFiles[agentId]);
				
				// Brief pause between initializations to prevent overwhelming the graph
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}

		// After all individual initializations, create inter-agent relationships
		await this.establishInterAgentRelationships(genesisFiles);

		this.logger.info('All council members initialized from Genesis Files');
	}

	/**
	 * Create foundational graph nodes for the agent
	 */
	private async createFoundationalNodes(genesis: GenesisFileData): Promise<void> {
		const query = `
			// Create or update the agent node
			MERGE (agent:Agent {id: $agentId})
			SET agent.name = $name,
				agent.role = $role,
				agent.genesis_version = $genesisVersion,
				agent.initialized_at = datetime(),
				agent.status = 'initializing'

			// Create personality core
			MERGE (agent)-[:HAS_PERSONALITY]->(personality:Personality {
				agentId: $agentId,
				communication_style: $communicationStyle,
				decision_making_approach: $decisionMakingApproach
			})

			// Create capabilities core
			MERGE (agent)-[:HAS_CAPABILITIES]->(capabilities:Capabilities {
				agentId: $agentId,
				specialization_count: $specializationCount
			})

			// Create memory core
			MERGE (agent)-[:HAS_MEMORY]->(memory:Memory {
				agentId: $agentId,
				created_at: datetime(),
				memory_type: 'genesis_initialized'
			})

			// Create genesis record
			MERGE (agent)-[:INITIALIZED_FROM]->(genesisRecord:Genesis {
				agentId: $agentId,
				version: $genesisVersion,
				initialized_at: datetime()
			})
		`;

		await this.db.write(query, {
			agentId: genesis.agentId,
			name: genesis.name,
			role: genesis.role,
			genesisVersion: '1.0',
			communicationStyle: genesis.personality.communication_style,
			decisionMakingApproach: genesis.personality.decision_making_approach,
			specializationCount: genesis.capabilities.specializations.length
		});
	}

	/**
	 * Initialize personality traits and core values
	 */
	private async initializePersonality(genesis: GenesisFileData): Promise<void> {
		// Create personality trait nodes
		for (const [trait, value] of Object.entries(genesis.personality.traits)) {
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:HAS_PERSONALITY]->(personality:Personality)
				MERGE (personality)-[:HAS_TRAIT]->(trait:PersonalityTrait {
					name: $traitName,
					value: $traitValue,
					agentId: $agentId
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				traitName: trait,
				traitValue: value
			});
		}

		// Create core values nodes
		for (const value of genesis.personality.core_values) {
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:HAS_PERSONALITY]->(personality:Personality)
				MERGE (personality)-[:VALUES]->(coreValue:CoreValue {
					value: $value,
					agentId: $agentId
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				value
			});
		}
	}

	/**
	 * Initialize capabilities, specializations, and workflows
	 */
	private async initializeCapabilities(genesis: GenesisFileData): Promise<void> {
		// Create primary function nodes
		for (const func of genesis.capabilities.primary_functions) {
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:HAS_CAPABILITIES]->(capabilities:Capabilities)
				MERGE (capabilities)-[:CAN_PERFORM]->(function:PrimaryFunction {
					name: $functionName,
					agentId: $agentId,
					proficiency: 1.0
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				functionName: func
			});
		}

		// Create specialization nodes
		for (const specialization of genesis.capabilities.specializations) {
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:HAS_CAPABILITIES]->(capabilities:Capabilities)
				MERGE (capabilities)-[:SPECIALIZES_IN]->(spec:Specialization {
					name: $specializationName,
					agentId: $agentId,
					expertise_level: 0.95
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				specializationName: specialization
			});
		}

		// Create workflow nodes
		for (const workflow of genesis.capabilities.workflows) {
			const workflowId = uuidv4();
			
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:HAS_CAPABILITIES]->(capabilities:Capabilities)
				MERGE (capabilities)-[:HAS_WORKFLOW]->(workflow:Workflow {
					id: $workflowId,
					name: $workflowName,
					description: $workflowDescription,
					agentId: $agentId,
					step_count: $stepCount
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				workflowId,
				workflowName: workflow.name,
				workflowDescription: workflow.description,
				stepCount: workflow.steps.length
			});

			// Create workflow steps
			for (let i = 0; i < workflow.steps.length; i++) {
				const stepQuery = `
					MATCH (workflow:Workflow {id: $workflowId})
					MERGE (workflow)-[:HAS_STEP]->(step:WorkflowStep {
						id: randomUUID(),
						order: $stepOrder,
						description: $stepDescription,
						workflowId: $workflowId
					})
				`;

				await this.db.write(stepQuery, {
					workflowId,
					stepOrder: i + 1,
					stepDescription: workflow.steps[i]
				});
			}

			// Create workflow triggers
			for (const trigger of workflow.triggers) {
				const triggerQuery = `
					MATCH (workflow:Workflow {id: $workflowId})
					MERGE (workflow)-[:TRIGGERED_BY]->(trigger:WorkflowTrigger {
						condition: $triggerCondition,
						workflowId: $workflowId
					})
				`;

				await this.db.write(triggerQuery, {
					workflowId,
					triggerCondition: trigger
				});
			}
		}
	}

	/**
	 * Initialize knowledge domains
	 */
	private async initializeKnowledgeDomains(genesis: GenesisFileData): Promise<void> {
		for (const domain of genesis.knowledge_domains) {
			const query = `
				MATCH (agent:Agent {id: $agentId})
				MERGE (domain:KnowledgeDomain {name: $domainName})
				MERGE (agent)-[:KNOWLEDGEABLE_IN {
					proficiency: 0.9,
					acquired_from: 'genesis',
					last_updated: datetime()
				}]->(domain)
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				domainName: domain
			});
		}
	}

	/**
	 * Initialize collaboration patterns with other agents
	 */
	private async initializeCollaborationPatterns(genesis: GenesisFileData): Promise<void> {
		for (const pattern of genesis.collaboration_patterns) {
			const query = `
				MATCH (agent:Agent {id: $agentId})
				MERGE (partner:Agent {id: $partnerId})
				MERGE (agent)-[:COLLABORATES_WITH {
					interaction_type: $interactionType,
					frequency: $frequency,
					established_in_genesis: true
				}]->(partner)
				
				// Create collaboration protocol nodes
				WITH agent, partner
				MERGE (protocol:CollaborationProtocol {
					source_agent: $agentId,
					target_agent: $partnerId,
					interaction_type: $interactionType
				})
				MERGE (agent)-[:FOLLOWS_PROTOCOL]->(protocol)
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				partnerId: pattern.partner,
				interactionType: pattern.interaction_type,
				frequency: pattern.frequency
			});

			// Add protocol details
			for (const protocolDetail of pattern.protocols) {
				const protocolQuery = `
					MATCH (protocol:CollaborationProtocol {
						source_agent: $agentId,
						target_agent: $partnerId,
						interaction_type: $interactionType
					})
					MERGE (protocol)-[:INCLUDES_RULE]->(rule:ProtocolRule {
						rule: $protocolRule,
						agentId: $agentId
					})
				`;

				await this.db.write(protocolQuery, {
					agentId: genesis.agentId,
					partnerId: pattern.partner,
					interactionType: pattern.interaction_type,
					protocolRule: protocolDetail
				});
			}
		}
	}

	/**
	 * Link agent to constitutional principles
	 */
	private async linkConstitutionalPrinciples(genesis: GenesisFileData): Promise<void> {
		for (const principle of genesis.constitutional_principles) {
			const query = `
				MATCH (agent:Agent {id: $agentId})
				MERGE (principle:ConstitutionalPrinciple {name: $principleName})
				MERGE (agent)-[:ADHERES_TO {
					commitment_level: 1.0,
					established_in_genesis: true
				}]->(principle)
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				principleName: principle
			});
		}
	}

	/**
	 * Execute initialization checklist
	 */
	private async executeInitializationChecklist(genesis: GenesisFileData): Promise<void> {
		for (let i = 0; i < genesis.initialization_checklist.length; i++) {
			const item = genesis.initialization_checklist[i];
			
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:INITIALIZED_FROM]->(genesis:Genesis)
				MERGE (genesis)-[:HAS_CHECKLIST_ITEM]->(item:InitializationItem {
					order: $itemOrder,
					description: $itemDescription,
					status: 'completed',
					agentId: $agentId,
					completed_at: datetime()
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				itemOrder: i + 1,
				itemDescription: item
			});
		}
	}

	/**
	 * Initialize memory and learning structures
	 */
	private async initializeMemoryStructures(genesis: GenesisFileData): Promise<void> {
		// Create different types of memory nodes
		const memoryTypes = ['working', 'episodic', 'semantic', 'procedural'];
		
		for (const memoryType of memoryTypes) {
			const query = `
				MATCH (agent:Agent {id: $agentId})-[:HAS_MEMORY]->(memory:Memory)
				MERGE (memory)-[:CONTAINS]->(memoryBank:MemoryBank {
					type: $memoryType,
					agentId: $agentId,
					created_at: datetime(),
					capacity: 1000,
					current_size: 0
				})
			`;

			await this.db.write(query, {
				agentId: genesis.agentId,
				memoryType
			});
		}

		// Create learning mechanism nodes
		const query = `
			MATCH (agent:Agent {id: $agentId})
			MERGE (agent)-[:HAS_LEARNING_SYSTEM]->(learning:LearningSystem {
				agentId: $agentId,
				learning_rate: 0.1,
				adaptation_enabled: true,
				experience_weight: 0.8,
				constitutional_constraint: true,
				created_at: datetime()
			})
		`;

		await this.db.write(query, {
			agentId: genesis.agentId
		});

		// Mark agent as fully initialized
		const finalQuery = `
			MATCH (agent:Agent {id: $agentId})
			SET agent.status = 'initialized',
				agent.genesis_integration_completed = datetime()
		`;

		await this.db.write(finalQuery, {
			agentId: genesis.agentId
		});
	}

	/**
	 * Establish relationships between agents after all are initialized
	 */
	private async establishInterAgentRelationships(genesisFiles: Record<string, GenesisFileData>): Promise<void> {
		// Create council hierarchy relationships
		const hierarchyQuery = `
			// Founder oversees strategic leadership
			MATCH (founder:Agent {id: 'founder'})
			MATCH (kairo:Agent {id: 'kairo'})
			MATCH (eira:Agent {id: 'eira'})
			MERGE (founder)-[:OVERSEES {role: 'strategic_guidance'}]->(kairo)
			MERGE (founder)-[:COORDINATES_WITH {role: 'operations'}]->(eira)

			// Kairo as strategic hub
			MATCH (kairo:Agent {id: 'kairo'})
			MATCH (sterling:Agent {id: 'sterling'})
			MATCH (veritas:Agent {id: 'veritas'})
			MATCH (lyra:Agent {id: 'lyra'})
			MERGE (kairo)-[:STRATEGIC_PARTNER]->(sterling)
			MERGE (kairo)-[:STRATEGIC_PARTNER]->(veritas)
			MERGE (kairo)-[:STRATEGIC_PARTNER]->(lyra)

			// Technical coordination
			MATCH (joule:Agent {id: 'joule'})
			MATCH (axiom:Agent {id: 'axiom'})
			MATCH (forge:Agent {id: 'forge'})
			MATCH (agape:Agent {id: 'agape'})
			MERGE (joule)-[:TECHNICAL_LEAD]->(axiom)
			MERGE (joule)-[:TECHNICAL_LEAD]->(forge)
			MERGE (joule)-[:TECHNICAL_PARTNER]->(agape)

			// Operations coordination
			MATCH (eira:Agent {id: 'eira'})
			MATCH (nexus:Agent {id: 'nexus'})
			MERGE (eira)-[:OPERATIONAL_PARTNER]->(nexus)
		`;

		await this.db.write(hierarchyQuery, {});

		// Create domain expertise clusters
		const expertiseQuery = `
			// Strategy cluster
			MATCH (kairo:Agent {id: 'kairo'})
			MATCH (sterling:Agent {id: 'sterling'})
			MATCH (veritas:Agent {id: 'veritas'})
			MERGE (kairo)-[:EXPERTISE_CLUSTER {domain: 'strategy'}]->(sterling)
			MERGE (kairo)-[:EXPERTISE_CLUSTER {domain: 'strategy'}]->(veritas)
			
			// Technical cluster
			MATCH (joule:Agent {id: 'joule'})
			MATCH (axiom:Agent {id: 'axiom'})
			MATCH (forge:Agent {id: 'forge'})
			MATCH (agape:Agent {id: 'agape'})
			MERGE (joule)-[:EXPERTISE_CLUSTER {domain: 'technical'}]->(axiom)
			MERGE (joule)-[:EXPERTISE_CLUSTER {domain: 'technical'}]->(forge)
			MERGE (forge)-[:EXPERTISE_CLUSTER {domain: 'technical'}]->(agape)
			
			// Communications cluster
			MATCH (lyra:Agent {id: 'lyra'})
			MATCH (eira:Agent {id: 'eira'})
			MERGE (lyra)-[:EXPERTISE_CLUSTER {domain: 'communications'}]->(eira)
		`;

		await this.db.write(expertiseQuery, {});

		this.logger.info('Inter-agent relationships established');
	}

	/**
	 * Validate that an agent's Genesis initialization is complete
	 */
	async validateGenesisInitialization(agentId: string): Promise<boolean> {
		const query = `
			MATCH (agent:Agent {id: $agentId})
			OPTIONAL MATCH (agent)-[:HAS_PERSONALITY]->(personality:Personality)
			OPTIONAL MATCH (agent)-[:HAS_CAPABILITIES]->(capabilities:Capabilities)
			OPTIONAL MATCH (agent)-[:HAS_MEMORY]->(memory:Memory)
			OPTIONAL MATCH (agent)-[:INITIALIZED_FROM]->(genesis:Genesis)
			
			RETURN agent.status as status,
				   personality IS NOT NULL as hasPersonality,
				   capabilities IS NOT NULL as hasCapabilities,
				   memory IS NOT NULL as hasMemory,
				   genesis IS NOT NULL as hasGenesis
		`;

		const result = await this.db.read(query, { agentId });
		
		if (result.records.length === 0) {
			return false;
		}

		const record = result.records[0];
		return Boolean(
			record.get('status') === 'initialized' &&
			record.get('hasPersonality') &&
			record.get('hasCapabilities') &&
			record.get('hasMemory') &&
			record.get('hasGenesis')
		);
	}

	/**
	 * Get initialization status for all council members
	 */
	async getCouncilInitializationStatus(): Promise<Record<string, boolean>> {
		const councilMembers = ['kairo', 'joule', 'sterling', 'lyra', 'nexus', 'veritas', 'axiom', 'eira', 'agape', 'forge'];
		const status: Record<string, boolean> = {};

		for (const agentId of councilMembers) {
			status[agentId] = await this.validateGenesisInitialization(agentId);
		}

		return status;
	}
}
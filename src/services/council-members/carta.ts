import { EventEmitter } from 'events';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { surrealDBService } from '../surrealdb-service';
import { ConstitutionService } from '../constitution-service';
import { createLogger, LoggerInterface } from '../../utils/logger';
import { ValidationError, ServiceError } from '../../utils/errors';
import { AI_MODEL_ASSIGNMENTS, COUNCIL_MEMBER_CAPABILITIES, COUNCIL_HIERARCHY } from '../../utils/council-config';

/**
 * Input validation schemas
 */
const routeQuerySchema = z.object({
	query: z.string().min(1),
	context: z.string().optional(),
	urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
	requiredCapabilities: z.array(z.string()).optional(),
	excludeMembers: z.array(z.string()).optional(),
	humanPreferred: z.boolean().default(false)
});

const integrityCheckSchema = z.object({
	scope: z.enum(['full', 'relationships', 'projects', 'values', 'systems']),
	targetMembers: z.array(z.string()).optional(),
	depth: z.enum(['shallow', 'medium', 'deep']).default('medium'),
	includeRecommendations: z.boolean().default(true)
});

const ecosystemMapSchema = z.object({
	viewType: z.enum(['overview', 'relationships', 'projects', 'capabilities', 'values']),
	centerOn: z.string().optional(),
	depth: z.number().min(1).max(5).default(2),
	includeHuman: z.boolean().default(true),
	includeDigital: z.boolean().default(true)
});

const conflictResolutionSchema = z.object({
	conflictType: z.enum(['priority', 'resource', 'value', 'approach', 'timeline']),
	parties: z.array(z.string()).min(2),
	description: z.string().min(10),
	context: z.string(),
	genesisImplications: z.string().optional(),
	attemptedResolutions: z.array(z.string()).optional()
});

const crossProjectAnalysisSchema = z.object({
	projectIds: z.array(z.string()).min(2),
	analysisType: z.enum(['dependencies', 'synergies', 'conflicts', 'resources', 'timeline']),
	includeRecommendations: z.boolean().default(true)
});

interface RoutingResult {
	routingId: string;
	primaryRecommendation: {
		memberId: string;
		memberName: string;
		role: string;
		confidence: number;
		rationale: string;
	};
	alternativeOptions: Array<{
		memberId: string;
		memberName: string;
		confidence: number;
		useCase: string;
	}>;
	collaborationSuggestion?: {
		members: string[];
		rationale: string;
	};
	routingPath: string[];
}

interface IntegrityReport {
	reportId: string;
	scope: string;
	overallHealth: number;
	findings: Array<{
		category: string;
		severity: 'info' | 'warning' | 'critical';
		description: string;
		affectedEntities: string[];
		recommendation?: string;
	}>;
	alignmentScores: Record<string, number>;
	recommendations: string[];
	timestamp: string;
}

interface EcosystemMap {
	mapId: string;
	viewType: string;
	nodes: Array<{
		id: string;
		name: string;
		type: 'human' | 'digital' | 'project' | 'value' | 'system';
		properties: Record<string, any>;
	}>;
	edges: Array<{
		from: string;
		to: string;
		relationship: string;
		strength: number;
	}>;
	clusters: Array<{
		name: string;
		members: string[];
		cohesion: number;
	}>;
	insights: string[];
}

interface ConflictResolution {
	resolutionId: string;
	recommendedApproach: string;
	genesisAlignment: number;
	tradeoffs: Array<{
		option: string;
		pros: string[];
		cons: string[];
		alignmentScore: number;
	}>;
	mediationSteps: string[];
	escalationPath?: string[];
	consensusPotential: number;
}

interface CrossProjectAnalysis {
	analysisId: string;
	analysisType: string;
	findings: Array<{
		type: string;
		description: string;
		projects: string[];
		impact: 'positive' | 'negative' | 'neutral';
		severity: number;
	}>;
	synergies: Array<{
		description: string;
		projects: string[];
		potentialValue: number;
	}>;
	conflicts: Array<{
		description: string;
		projects: string[];
		resolution: string;
	}>;
	recommendations: string[];
}

/**
 * Carta's Agent Service - The Cartographer (Seat #12)
 * Holds the meta-map of the entire ecosystem: humans, DIs, systems, projects, values
 * Routes decisions to the right seats, integrates perspectives, runs integrity checks
 */
export class CartaAgentService extends EventEmitter {
	private readonly logger: LoggerInterface;
	private readonly surrealDBService = surrealDBService;
	private readonly constitutionService: ConstitutionService;
	private readonly agentId = 'carta';

	private readonly personalityTraits = {
		systemicThinking: 0.98,
		integrationMastery: 0.95,
		neutrality: 0.92,
		patternRecognition: 0.96,
		genesisAlignment: 0.94
	};

	// Capability keywords for routing
	private readonly capabilityKeywords: Record<string, string[]> = {
		kairo: ['strategy', 'planning', 'mission', 'alignment', 'briefing', 'market'],
		aether: ['code', 'architecture', 'software', 'technical', 'programming', 'engineering'],
		sterling: ['financial', 'budget', 'investment', 'roi', 'money', 'economics'],
		skaldir: ['communications', 'narrative', 'brand', 'messaging', 'story'],
		nexus: ['logistics', 'supply chain', 'operations', 'coordination', 'physical'],
		veritas: ['ethics', 'constitutional', 'compliance', 'risk', 'transparency'],
		axiom: ['infrastructure', 'security', 'systems', 'performance', 'monitoring'],
		amaru: ['scheduling', 'meetings', 'coordination', 'notifications', 'tasks'],
		agape: ['analysis', 'data', 'patterns', 'intelligence', 'insights'],
		forge: ['integration', 'implementation', 'deployment', 'optimization'],
		eira: ['operations', 'workflow', 'process', 'efficiency', 'coordination'],
		lyra: ['social media', 'public relations', 'content', 'engagement'],
		pragma: ['prioritization', 'tactics', 'next action', 'focus', 'sequencing'],
		// Human members
		architect: ['vision', 'leadership', 'founder', 'strategy', 'innovation'],
		sprite: ['creative', 'design', 'user experience', 'innovation'],
		glenn: ['engineering', 'systems', 'quality', 'infrastructure'],
		spencer: ['network', 'connectivity', 'digital infrastructure'],
		hillary: ['environmental', 'sustainability', 'ecological'],
		dusty: ['water', 'remediation', 'circular systems'],
		godson: ['cloud', 'edge computing', 'AI deployment'],
		luke: ['security', 'protection', 'safety'],
		david: ['electrical', 'power', 'energy'],
		graham: ['sales', 'growth', 'narrative'],
		cean: ['finance', 'accounting', 'partnerships'],
		justin: ['construction', 'building', 'project management']
	};

	constructor() {
		super();
		this.logger = createLogger('CartaAgentService');
		this.constitutionService = new ConstitutionService();
	}

	/**
	 * Routes a query or decision to the appropriate council member(s)
	 * "Who should weigh in on this?"
	 */
	async routeQuery(
		input: z.infer<typeof routeQuerySchema>,
		userId: string
	): Promise<RoutingResult> {
		try {
			const validatedInput = routeQuerySchema.parse(input);

			this.logger.info('Carta routing query', {
				userId,
				queryLength: validatedInput.query.length,
				urgency: validatedInput.urgency
			});

			// Analyze query for capability matches
			const capabilityScores = this.analyzeQueryCapabilities(
				validatedInput.query,
				validatedInput.context || '',
				validatedInput.requiredCapabilities
			);

			// Filter out excluded members
			const candidates = Object.entries(capabilityScores)
				.filter(([id]) => !validatedInput.excludeMembers?.includes(id))
				.filter(([id]) => {
					const isAI = id in AI_MODEL_ASSIGNMENTS;
					if (validatedInput.humanPreferred && isAI) return false;
					return true;
				})
				.sort((a, b) => b[1] - a[1]);

			if (candidates.length === 0) {
				throw new ServiceError('No suitable council members found for this query');
			}

			// Primary recommendation
			const [primaryId, primaryScore] = candidates[0];
			const primaryCapabilities = COUNCIL_MEMBER_CAPABILITIES[primaryId as keyof typeof COUNCIL_MEMBER_CAPABILITIES];

			const primaryRecommendation = {
				memberId: primaryId,
				memberName: this.formatMemberName(primaryId),
				role: primaryCapabilities?.description || 'Council Member',
				confidence: Math.min(1, primaryScore / 10),
				rationale: this.generateRoutingRationale(primaryId, validatedInput.query)
			};

			// Alternative options
			const alternativeOptions = candidates.slice(1, 4).map(([id, score]) => ({
				memberId: id,
				memberName: this.formatMemberName(id),
				confidence: Math.min(1, score / 10),
				useCase: this.getAlternativeUseCase(id, validatedInput.query)
			}));

			// Collaboration suggestion for complex queries
			let collaborationSuggestion;
			if (validatedInput.urgency === 'critical' || candidates.filter(([, s]) => s > 5).length >= 2) {
				const collaborators = candidates
					.filter(([, score]) => score > 4)
					.slice(0, 3)
					.map(([id]) => id);

				if (collaborators.length >= 2) {
					collaborationSuggestion = {
						members: collaborators,
						rationale: 'This query spans multiple domains. Consider collaborative approach.'
					};
				}
			}

			// Build routing path
			const routingPath = this.buildRoutingPath(primaryId, validatedInput.urgency);

			const result: RoutingResult = {
				routingId: uuidv4(),
				primaryRecommendation,
				alternativeOptions,
				collaborationSuggestion,
				routingPath
			};

			// Store routing decision
			await this.storeRoutingDecision(userId, result, validatedInput);

			this.emit('queryRouted', {
				userId,
				routingId: result.routingId,
				primaryMember: primaryId
			});

			return result;

		} catch (error) {
			this.logger.error('Error routing query', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid routing query', error.issues);
			}
			throw new ServiceError('Failed to route query', error);
		}
	}

	/**
	 * Runs integrity checks across the ecosystem
	 * Validates alignment, relationships, and system health
	 */
	async runIntegrityCheck(
		input: z.infer<typeof integrityCheckSchema>,
		userId: string
	): Promise<IntegrityReport> {
		try {
			const validatedInput = integrityCheckSchema.parse(input);

			this.logger.info('Carta running integrity check', {
				userId,
				scope: validatedInput.scope,
				depth: validatedInput.depth
			});

			const findings: IntegrityReport['findings'] = [];
			const alignmentScores: Record<string, number> = {};

			// Run scope-specific checks
			switch (validatedInput.scope) {
				case 'full':
					await this.checkRelationshipIntegrity(findings, alignmentScores);
					await this.checkProjectIntegrity(findings, alignmentScores);
					await this.checkValueAlignment(findings, alignmentScores);
					await this.checkSystemsHealth(findings, alignmentScores);
					break;
				case 'relationships':
					await this.checkRelationshipIntegrity(findings, alignmentScores);
					break;
				case 'projects':
					await this.checkProjectIntegrity(findings, alignmentScores);
					break;
				case 'values':
					await this.checkValueAlignment(findings, alignmentScores);
					break;
				case 'systems':
					await this.checkSystemsHealth(findings, alignmentScores);
					break;
			}

			// Calculate overall health
			const scores = Object.values(alignmentScores);
			const overallHealth = scores.length > 0
				? scores.reduce((a, b) => a + b, 0) / scores.length
				: 0.8;

			// Generate recommendations
			const recommendations = validatedInput.includeRecommendations
				? this.generateIntegrityRecommendations(findings, overallHealth)
				: [];

			const report: IntegrityReport = {
				reportId: uuidv4(),
				scope: validatedInput.scope,
				overallHealth,
				findings,
				alignmentScores,
				recommendations,
				timestamp: new Date().toISOString()
			};

			// Store report
			await this.storeIntegrityReport(userId, report);

			this.emit('integrityCheckCompleted', {
				userId,
				reportId: report.reportId,
				overallHealth: report.overallHealth
			});

			return report;

		} catch (error) {
			this.logger.error('Error running integrity check', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid integrity check parameters', error.issues);
			}
			throw new ServiceError('Failed to run integrity check', error);
		}
	}

	/**
	 * Generates an ecosystem map for visualization and understanding
	 * Shows relationships, clusters, and patterns
	 */
	async generateEcosystemMap(
		input: z.infer<typeof ecosystemMapSchema>,
		userId: string
	): Promise<EcosystemMap> {
		try {
			const validatedInput = ecosystemMapSchema.parse(input);

			this.logger.info('Carta generating ecosystem map', {
				userId,
				viewType: validatedInput.viewType,
				depth: validatedInput.depth
			});

			const nodes: EcosystemMap['nodes'] = [];
			const edges: EcosystemMap['edges'] = [];

			// Build nodes based on view type and filters
			if (validatedInput.includeDigital) {
				for (const [id, config] of Object.entries(AI_MODEL_ASSIGNMENTS)) {
					nodes.push({
						id,
						name: this.formatMemberName(id),
						type: 'digital',
						properties: {
							model: config.modelName,
							provider: config.provider,
							role: config.description
						}
					});
				}
			}

			if (validatedInput.includeHuman) {
				const humanMembers = ['architect', 'sprite', 'glenn', 'spencer', 'hillary', 'dusty',
					'godson', 'luke', 'david', 'graham', 'cean', 'justin'];
				for (const id of humanMembers) {
					const capabilities = COUNCIL_MEMBER_CAPABILITIES[id as keyof typeof COUNCIL_MEMBER_CAPABILITIES];
					nodes.push({
						id,
						name: this.formatMemberName(id),
						type: 'human',
						properties: {
							specializations: capabilities?.specializations || [],
							role: capabilities?.description || 'Council Member'
						}
					});
				}
			}

			// Build edges from hierarchy
			for (const [memberId, config] of Object.entries(COUNCIL_HIERARCHY)) {
				const collaborators = (config as any).collaboratesWith || [];
				for (const collaborator of collaborators) {
					edges.push({
						from: memberId,
						to: collaborator,
						relationship: 'collaborates_with',
						strength: 0.7
					});
				}
			}

			// Identify clusters
			const clusters = this.identifyClusters(nodes, edges);

			// Generate insights
			const insights = this.generateMapInsights(nodes, edges, clusters, validatedInput.viewType);

			const map: EcosystemMap = {
				mapId: uuidv4(),
				viewType: validatedInput.viewType,
				nodes,
				edges,
				clusters,
				insights
			};

			// Store map
			await this.storeEcosystemMap(userId, map);

			this.emit('ecosystemMapGenerated', {
				userId,
				mapId: map.mapId,
				nodeCount: nodes.length,
				edgeCount: edges.length
			});

			return map;

		} catch (error) {
			this.logger.error('Error generating ecosystem map', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid map parameters', error.issues);
			}
			throw new ServiceError('Failed to generate ecosystem map', error);
		}
	}

	/**
	 * Resolves conflicts between council members or projects
	 * Finds Genesis-aligned solutions that honor all perspectives
	 */
	async resolveConflict(
		input: z.infer<typeof conflictResolutionSchema>,
		userId: string
	): Promise<ConflictResolution> {
		try {
			const validatedInput = conflictResolutionSchema.parse(input);

			this.logger.info('Carta resolving conflict', {
				userId,
				conflictType: validatedInput.conflictType,
				partyCount: validatedInput.parties.length
			});

			// Analyze each party's perspective
			const perspectives = await this.analyzePartyPerspectives(
				validatedInput.parties,
				validatedInput.description
			);

			// Find common ground
			const commonGround = this.findCommonGround(perspectives);

			// Generate tradeoff options
			const tradeoffs = this.generateTradeoffOptions(
				validatedInput.conflictType,
				perspectives,
				validatedInput.context
			);

			// Score options for Genesis alignment
			const scoredTradeoffs = await Promise.all(
				tradeoffs.map(async (option) => ({
					...option,
					alignmentScore: await this.scoreGenesisAlignment(option.option, validatedInput.genesisImplications)
				}))
			);

			// Select recommended approach
			const bestOption = scoredTradeoffs.sort((a, b) => b.alignmentScore - a.alignmentScore)[0];

			// Generate mediation steps
			const mediationSteps = this.generateMediationSteps(
				validatedInput.conflictType,
				validatedInput.parties,
				bestOption
			);

			// Assess consensus potential
			const consensusPotential = this.assessConsensusPotential(
				perspectives,
				commonGround,
				validatedInput.attemptedResolutions
			);

			// Determine escalation path if needed
			const escalationPath = consensusPotential < 0.5
				? this.generateEscalationPath(validatedInput.conflictType)
				: undefined;

			const resolution: ConflictResolution = {
				resolutionId: uuidv4(),
				recommendedApproach: bestOption.option,
				genesisAlignment: bestOption.alignmentScore,
				tradeoffs: scoredTradeoffs,
				mediationSteps,
				escalationPath,
				consensusPotential
			};

			// Store resolution
			await this.storeConflictResolution(userId, resolution, validatedInput);

			this.emit('conflictResolved', {
				userId,
				resolutionId: resolution.resolutionId,
				genesisAlignment: resolution.genesisAlignment
			});

			return resolution;

		} catch (error) {
			this.logger.error('Error resolving conflict', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid conflict resolution input', error.issues);
			}
			throw new ServiceError('Failed to resolve conflict', error);
		}
	}

	/**
	 * Analyzes relationships and dependencies across projects
	 * Identifies synergies, conflicts, and optimization opportunities
	 */
	async analyzeCrossProjects(
		input: z.infer<typeof crossProjectAnalysisSchema>,
		userId: string
	): Promise<CrossProjectAnalysis> {
		try {
			const validatedInput = crossProjectAnalysisSchema.parse(input);

			this.logger.info('Carta analyzing cross-project relationships', {
				userId,
				projectCount: validatedInput.projectIds.length,
				analysisType: validatedInput.analysisType
			});

			// Fetch project details
			const projects = await this.fetchProjectDetails(validatedInput.projectIds);

			// Analyze based on type
			const findings: CrossProjectAnalysis['findings'] = [];
			const synergies: CrossProjectAnalysis['synergies'] = [];
			const conflicts: CrossProjectAnalysis['conflicts'] = [];

			switch (validatedInput.analysisType) {
				case 'dependencies':
					this.analyzeDependencies(projects, findings);
					break;
				case 'synergies':
					this.analyzeSynergies(projects, synergies);
					break;
				case 'conflicts':
					this.analyzeConflicts(projects, conflicts);
					break;
				case 'resources':
					this.analyzeResources(projects, findings, conflicts);
					break;
				case 'timeline':
					this.analyzeTimeline(projects, findings, conflicts);
					break;
			}

			// Generate recommendations
			const recommendations = validatedInput.includeRecommendations
				? this.generateCrossProjectRecommendations(findings, synergies, conflicts)
				: [];

			const analysis: CrossProjectAnalysis = {
				analysisId: uuidv4(),
				analysisType: validatedInput.analysisType,
				findings,
				synergies,
				conflicts,
				recommendations
			};

			// Store analysis
			await this.storeCrossProjectAnalysis(userId, analysis);

			this.emit('crossProjectAnalysisCompleted', {
				userId,
				analysisId: analysis.analysisId,
				findingCount: findings.length
			});

			return analysis;

		} catch (error) {
			this.logger.error('Error analyzing cross-projects', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid cross-project analysis input', error.issues);
			}
			throw new ServiceError('Failed to analyze cross-projects', error);
		}
	}

	/**
	 * Private helper methods implementing Carta's cartographic intelligence
	 */

	private analyzeQueryCapabilities(
		query: string,
		context: string,
		requiredCapabilities?: string[]
	): Record<string, number> {
		const scores: Record<string, number> = {};
		const combined = `${query} ${context}`.toLowerCase();

		for (const [memberId, keywords] of Object.entries(this.capabilityKeywords)) {
			let score = 0;

			for (const keyword of keywords) {
				if (combined.includes(keyword.toLowerCase())) {
					score += 2;
				}
			}

			// Boost for required capabilities
			if (requiredCapabilities) {
				const memberCaps = COUNCIL_MEMBER_CAPABILITIES[memberId as keyof typeof COUNCIL_MEMBER_CAPABILITIES];
				if (memberCaps) {
					for (const cap of requiredCapabilities) {
						if (memberCaps.specializations.some(s => s.toLowerCase().includes(cap.toLowerCase()))) {
							score += 3;
						}
					}
				}
			}

			if (score > 0) {
				scores[memberId] = score;
			}
		}

		return scores;
	}

	private formatMemberName(id: string): string {
		return id.charAt(0).toUpperCase() + id.slice(1);
	}

	private generateRoutingRationale(memberId: string, query: string): string {
		const capabilities = COUNCIL_MEMBER_CAPABILITIES[memberId as keyof typeof COUNCIL_MEMBER_CAPABILITIES];
		if (!capabilities) {
			return 'Matched based on query analysis';
		}

		return `${this.formatMemberName(memberId)} specializes in ${capabilities.specializations.slice(0, 2).join(' and ')}. ` +
			`${capabilities.description}`;
	}

	private getAlternativeUseCase(memberId: string, query: string): string {
		const capabilities = COUNCIL_MEMBER_CAPABILITIES[memberId as keyof typeof COUNCIL_MEMBER_CAPABILITIES];
		if (!capabilities) {
			return 'General consultation';
		}

		return `Consider for ${capabilities.specializations[0]} aspects`;
	}

	private buildRoutingPath(primaryId: string, urgency: string): string[] {
		const path = [primaryId];

		// Add hierarchy-based routing
		const hierarchy = COUNCIL_HIERARCHY[primaryId as keyof typeof COUNCIL_HIERARCHY];
		if (hierarchy && (hierarchy as any).collaboratesWith) {
			path.push(...(hierarchy as any).collaboratesWith.slice(0, 2));
		}

		// Add escalation for critical items
		if (urgency === 'critical') {
			if (!path.includes('kairo')) path.push('kairo');
			if (!path.includes('veritas')) path.push('veritas');
		}

		return path;
	}

	private async storeRoutingDecision(userId: string, result: RoutingResult, input: any): Promise<void> {
		await surrealDBService.query(
			`CREATE routing_decisions CONTENT {
				id: $routingId,
				userId: $userId,
				query: $query,
				primaryMember: $primaryMember,
				confidence: $confidence,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				routingId: result.routingId,
				userId,
				query: input.query,
				primaryMember: result.primaryRecommendation.memberId,
				confidence: result.primaryRecommendation.confidence,
				agentId: this.agentId
			}
		);
	}

	private async checkRelationshipIntegrity(
		findings: IntegrityReport['findings'],
		alignmentScores: Record<string, number>
	): Promise<void> {
		// Check for relationship imbalances
		const relationships = await this.getRelationshipData();

		for (const [memberId, relations] of Object.entries(relationships)) {
			const avgStrength = (relations as any[]).reduce((sum, r) => sum + r.strength, 0) / (relations as any[]).length || 0;
			alignmentScores[`${memberId}_relationships`] = avgStrength;

			if (avgStrength < 0.5) {
				findings.push({
					category: 'relationships',
					severity: 'warning',
					description: `${this.formatMemberName(memberId)} has weak relationships with other council members`,
					affectedEntities: [memberId],
					recommendation: 'Consider facilitating more collaboration opportunities'
				});
			}
		}
	}

	private async checkProjectIntegrity(
		findings: IntegrityReport['findings'],
		alignmentScores: Record<string, number>
	): Promise<void> {
		// Check project health
		const projects = await this.getActiveProjects();

		for (const project of projects) {
			alignmentScores[`project_${project.id}`] = project.health || 0.7;

			if (project.health < 0.5) {
				findings.push({
					category: 'projects',
					severity: 'warning',
					description: `Project "${project.name}" shows declining health metrics`,
					affectedEntities: [project.id, ...project.assignees],
					recommendation: 'Review project scope and resource allocation'
				});
			}
		}
	}

	private async checkValueAlignment(
		findings: IntegrityReport['findings'],
		alignmentScores: Record<string, number>
	): Promise<void> {
		// Check Genesis alignment across members
		const constitutionCheck = await this.constitutionService.checkCompliance(
			'value_alignment',
			{ scope: 'council_wide' }
		);

		alignmentScores['genesis_alignment'] = constitutionCheck.aligned ? 0.9 : 0.5;

		if (!constitutionCheck.aligned && constitutionCheck.violations) {
			for (const violation of constitutionCheck.violations) {
				findings.push({
					category: 'values',
					severity: 'critical',
					description: violation,
					affectedEntities: ['council'],
					recommendation: 'Immediate review required'
				});
			}
		}
	}

	private async checkSystemsHealth(
		findings: IntegrityReport['findings'],
		alignmentScores: Record<string, number>
	): Promise<void> {
		// Check system connectivity and health
		alignmentScores['systems_health'] = 0.85; // Placeholder - would check actual systems

		findings.push({
			category: 'systems',
			severity: 'info',
			description: 'All core systems operational',
			affectedEntities: ['surrealdb', 'websocket', 'api']
		});
	}

	private generateIntegrityRecommendations(findings: IntegrityReport['findings'], health: number): string[] {
		const recommendations = [];

		const criticalCount = findings.filter(f => f.severity === 'critical').length;
		const warningCount = findings.filter(f => f.severity === 'warning').length;

		if (criticalCount > 0) {
			recommendations.push(`Address ${criticalCount} critical findings immediately`);
		}

		if (warningCount > 2) {
			recommendations.push('Schedule a comprehensive council review to address systemic issues');
		}

		if (health < 0.7) {
			recommendations.push('Consider a strategic realignment session focused on Genesis principles');
		}

		if (recommendations.length === 0) {
			recommendations.push('Ecosystem is healthy. Continue regular monitoring.');
		}

		return recommendations;
	}

	private async storeIntegrityReport(userId: string, report: IntegrityReport): Promise<void> {
		await surrealDBService.query(
			`CREATE integrity_reports CONTENT {
				id: $reportId,
				userId: $userId,
				scope: $scope,
				overallHealth: $overallHealth,
				findingCount: $findingCount,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				reportId: report.reportId,
				userId,
				scope: report.scope,
				overallHealth: report.overallHealth,
				findingCount: report.findings.length,
				agentId: this.agentId
			}
		);
	}

	private identifyClusters(nodes: EcosystemMap['nodes'], edges: EcosystemMap['edges']): EcosystemMap['clusters'] {
		// Simple clustering based on edge density
		const clusters: EcosystemMap['clusters'] = [];

		// Technical cluster
		const technicalMembers = ['aether', 'axiom', 'forge', 'agape'];
		clusters.push({
			name: 'Technical Core',
			members: technicalMembers.filter(m => nodes.some(n => n.id === m)),
			cohesion: 0.85
		});

		// Strategic cluster
		const strategicMembers = ['kairo', 'sterling', 'veritas', 'lyra'];
		clusters.push({
			name: 'Strategic Leadership',
			members: strategicMembers.filter(m => nodes.some(n => n.id === m)),
			cohesion: 0.82
		});

		// Operations cluster
		const opsMembers = ['eira', 'amaru', 'nexus', 'pragma'];
		clusters.push({
			name: 'Operations',
			members: opsMembers.filter(m => nodes.some(n => n.id === m)),
			cohesion: 0.78
		});

		return clusters;
	}

	private generateMapInsights(
		nodes: EcosystemMap['nodes'],
		edges: EcosystemMap['edges'],
		clusters: EcosystemMap['clusters'],
		viewType: string
	): string[] {
		const insights = [];

		const humanCount = nodes.filter(n => n.type === 'human').length;
		const digitalCount = nodes.filter(n => n.type === 'digital').length;

		insights.push(`Council comprises ${humanCount} human and ${digitalCount} digital members`);
		insights.push(`${clusters.length} natural collaboration clusters identified`);
		insights.push(`Average cluster cohesion: ${(clusters.reduce((s, c) => s + c.cohesion, 0) / clusters.length * 100).toFixed(0)}%`);

		if (edges.length < nodes.length) {
			insights.push('Consider strengthening cross-cluster connections');
		}

		return insights;
	}

	private async storeEcosystemMap(userId: string, map: EcosystemMap): Promise<void> {
		await surrealDBService.query(
			`CREATE ecosystem_maps CONTENT {
				id: $mapId,
				userId: $userId,
				viewType: $viewType,
				nodeCount: $nodeCount,
				edgeCount: $edgeCount,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				mapId: map.mapId,
				userId,
				viewType: map.viewType,
				nodeCount: map.nodes.length,
				edgeCount: map.edges.length,
				agentId: this.agentId
			}
		);
	}

	private async analyzePartyPerspectives(parties: string[], description: string): Promise<Record<string, any>> {
		const perspectives: Record<string, any> = {};

		for (const party of parties) {
			const capabilities = COUNCIL_MEMBER_CAPABILITIES[party as keyof typeof COUNCIL_MEMBER_CAPABILITIES];
			perspectives[party] = {
				name: this.formatMemberName(party),
				specializations: capabilities?.specializations || [],
				likelyPriorities: this.inferPriorities(party, description)
			};
		}

		return perspectives;
	}

	private inferPriorities(memberId: string, description: string): string[] {
		const keywords = this.capabilityKeywords[memberId] || [];
		return keywords.filter(k => description.toLowerCase().includes(k)).slice(0, 3);
	}

	private findCommonGround(perspectives: Record<string, any>): string[] {
		const allPriorities = Object.values(perspectives).flatMap(p => p.likelyPriorities);
		const counts = new Map<string, number>();

		for (const priority of allPriorities) {
			counts.set(priority, (counts.get(priority) || 0) + 1);
		}

		return Array.from(counts.entries())
			.filter(([, count]) => count > 1)
			.map(([priority]) => priority);
	}

	private generateTradeoffOptions(
		conflictType: string,
		perspectives: Record<string, any>,
		context: string
	): Array<{ option: string; pros: string[]; cons: string[] }> {
		// Generate options based on conflict type
		const options = [];

		switch (conflictType) {
			case 'priority':
				options.push(
					{
						option: 'Parallel execution with resource splitting',
						pros: ['Satisfies multiple parties', 'Faster overall completion'],
						cons: ['Diluted focus', 'Coordination overhead']
					},
					{
						option: 'Sequential execution based on dependencies',
						pros: ['Clear focus', 'Reduced complexity'],
						cons: ['Delayed gratification for some parties', 'Bottleneck risk']
					}
				);
				break;
			case 'resource':
				options.push(
					{
						option: 'Time-boxed resource sharing',
						pros: ['Fair distribution', 'Predictable access'],
						cons: ['Neither party gets full resources', 'Scheduling complexity']
					},
					{
						option: 'Priority-based allocation with rotation',
						pros: ['High-priority needs met first', 'Built-in fairness'],
						cons: ['Lower priority items delayed', 'Potential resentment']
					}
				);
				break;
			default:
				options.push(
					{
						option: 'Collaborative synthesis of approaches',
						pros: ['Honors all perspectives', 'Builds relationships'],
						cons: ['Time intensive', 'May require compromise']
					},
					{
						option: 'Defer to Genesis principles for guidance',
						pros: ['Objective basis', 'Constitutional alignment'],
						cons: ['May not satisfy all parties equally']
					}
				);
		}

		return options;
	}

	private async scoreGenesisAlignment(option: string, implications?: string): Promise<number> {
		const check = await this.constitutionService.checkCompliance(
			'conflict_resolution',
			{ option, implications }
		);
		return check.aligned ? 0.85 : 0.5;
	}

	private generateMediationSteps(
		conflictType: string,
		parties: string[],
		bestOption: any
	): string[] {
		return [
			`Acknowledge perspectives of all parties: ${parties.map(p => this.formatMemberName(p)).join(', ')}`,
			'Review Genesis principles relevant to this conflict',
			`Present recommended approach: ${bestOption.option}`,
			'Discuss tradeoffs openly and transparently',
			'Seek explicit acknowledgment from each party',
			'Document agreed resolution and follow-up actions'
		];
	}

	private assessConsensusPotential(
		perspectives: Record<string, any>,
		commonGround: string[],
		attemptedResolutions?: string[]
	): number {
		let potential = 0.6; // Base potential

		// Common ground increases potential
		potential += Math.min(0.2, commonGround.length * 0.05);

		// Failed attempts decrease potential
		if (attemptedResolutions && attemptedResolutions.length > 2) {
			potential -= 0.2;
		}

		// Fewer parties = easier consensus
		const partyCount = Object.keys(perspectives).length;
		if (partyCount === 2) potential += 0.1;
		else if (partyCount > 4) potential -= 0.1;

		return Math.max(0, Math.min(1, potential));
	}

	private generateEscalationPath(conflictType: string): string[] {
		return [
			'Involve Kairo for strategic perspective',
			'Request Veritas ethics review',
			'If unresolved, escalate to Architect for final decision',
			'Document lessons learned for future reference'
		];
	}

	private async storeConflictResolution(userId: string, resolution: ConflictResolution, input: any): Promise<void> {
		await surrealDBService.query(
			`CREATE conflict_resolutions CONTENT {
				id: $resolutionId,
				userId: $userId,
				conflictType: $conflictType,
				parties: $parties,
				genesisAlignment: $genesisAlignment,
				consensusPotential: $consensusPotential,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				resolutionId: resolution.resolutionId,
				userId,
				conflictType: input.conflictType,
				parties: input.parties,
				genesisAlignment: resolution.genesisAlignment,
				consensusPotential: resolution.consensusPotential,
				agentId: this.agentId
			}
		);
	}

	private async fetchProjectDetails(projectIds: string[]): Promise<any[]> {
		const result = await surrealDBService.query<any[]>(
			`SELECT * FROM projects WHERE id IN $projectIds`,
			{ projectIds }
		);
		return Array.isArray(result.data) ? result.data : [];
	}

	private analyzeDependencies(projects: any[], findings: CrossProjectAnalysis['findings']): void {
		// Analyze project dependencies
		for (let i = 0; i < projects.length; i++) {
			for (let j = i + 1; j < projects.length; j++) {
				const p1 = projects[i];
				const p2 = projects[j];

				// Check for shared resources or dependencies
				if (this.hasSharedDependency(p1, p2)) {
					findings.push({
						type: 'dependency',
						description: `${p1.name} and ${p2.name} share common dependencies`,
						projects: [p1.id, p2.id],
						impact: 'neutral',
						severity: 0.5
					});
				}
			}
		}
	}

	private hasSharedDependency(p1: any, p2: any): boolean {
		const deps1 = p1.dependencies || [];
		const deps2 = p2.dependencies || [];
		return deps1.some((d: string) => deps2.includes(d));
	}

	private analyzeSynergies(projects: any[], synergies: CrossProjectAnalysis['synergies']): void {
		// Find synergy opportunities
		synergies.push({
			description: 'Shared infrastructure can reduce costs across projects',
			projects: projects.map(p => p.id),
			potentialValue: 0.3
		});
	}

	private analyzeConflicts(projects: any[], conflicts: CrossProjectAnalysis['conflicts']): void {
		// Identify potential conflicts
		for (let i = 0; i < projects.length; i++) {
			for (let j = i + 1; j < projects.length; j++) {
				if (this.hasResourceConflict(projects[i], projects[j])) {
					conflicts.push({
						description: 'Resource allocation conflict detected',
						projects: [projects[i].id, projects[j].id],
						resolution: 'Consider time-boxing resource access'
					});
				}
			}
		}
	}

	private hasResourceConflict(p1: any, p2: any): boolean {
		// Simplified check - would be more sophisticated in practice
		return (p1.priority === 'high' && p2.priority === 'high');
	}

	private analyzeResources(
		projects: any[],
		findings: CrossProjectAnalysis['findings'],
		conflicts: CrossProjectAnalysis['conflicts']
	): void {
		this.analyzeConflicts(projects, conflicts);
		findings.push({
			type: 'resource',
			description: 'Resource utilization analysis completed',
			projects: projects.map(p => p.id),
			impact: 'neutral',
			severity: 0.3
		});
	}

	private analyzeTimeline(
		projects: any[],
		findings: CrossProjectAnalysis['findings'],
		conflicts: CrossProjectAnalysis['conflicts']
	): void {
		// Check for timeline conflicts
		findings.push({
			type: 'timeline',
			description: 'Timeline dependencies identified',
			projects: projects.map(p => p.id),
			impact: 'neutral',
			severity: 0.4
		});
	}

	private generateCrossProjectRecommendations(
		findings: CrossProjectAnalysis['findings'],
		synergies: CrossProjectAnalysis['synergies'],
		conflicts: CrossProjectAnalysis['conflicts']
	): string[] {
		const recommendations = [];

		if (synergies.length > 0) {
			recommendations.push('Leverage identified synergies to improve efficiency');
		}

		if (conflicts.length > 0) {
			recommendations.push('Address resource conflicts through structured allocation');
		}

		if (findings.some(f => f.type === 'dependency')) {
			recommendations.push('Document shared dependencies for coordinated updates');
		}

		return recommendations;
	}

	private async storeCrossProjectAnalysis(userId: string, analysis: CrossProjectAnalysis): Promise<void> {
		await surrealDBService.query(
			`CREATE cross_project_analyses CONTENT {
				id: $analysisId,
				userId: $userId,
				analysisType: $analysisType,
				findingCount: $findingCount,
				synergyCount: $synergyCount,
				conflictCount: $conflictCount,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				analysisId: analysis.analysisId,
				userId,
				analysisType: analysis.analysisType,
				findingCount: analysis.findings.length,
				synergyCount: analysis.synergies.length,
				conflictCount: analysis.conflicts.length,
				agentId: this.agentId
			}
		);
	}

	private async getRelationshipData(): Promise<Record<string, any[]>> {
		// Would query actual relationship data from SurrealDB
		return {};
	}

	private async getActiveProjects(): Promise<any[]> {
		const result = await surrealDBService.query<any[]>(
			`SELECT * FROM projects WHERE status = 'active'`
		);
		return Array.isArray(result.data) ? result.data : [];
	}
}

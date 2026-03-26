import { EventEmitter } from 'events';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { surrealDBService } from '../surrealdb-service';
import { createLogger, LoggerInterface } from '../../utils/logger';
import { ValidationError, ServiceError } from '../../utils/errors';

/**
 * Input validation schemas for Dusty's domain
 */
const remediationProjectSchema = z.object({
	name: z.string().min(1),
	siteLocation: z.string(),
	contaminationType: z.enum([
		'heavy_metals',
		'organic_compounds',
		'petroleum',
		'industrial_waste',
		'agricultural_runoff',
		'mixed_contamination'
	]),
	waterSource: z.enum(['groundwater', 'surface_water', 'wastewater', 'stormwater', 'combined']),
	estimatedVolume: z.number().positive(), // Gallons per day
	targetQuality: z.object({
		ph: z.object({ min: z.number(), max: z.number() }).optional(),
		tds: z.number().optional(), // Total dissolved solids ppm
		turbidity: z.number().optional(), // NTU
		contaminantLevels: z.record(z.string(), z.number()).optional()
	}).optional(),
	timeline: z.number().positive(), // Months
	budget: z.number().positive().optional()
});

const waterQualityTestSchema = z.object({
	siteId: z.string(),
	sampleLocation: z.string(),
	testType: z.enum(['intake', 'process', 'output', 'environmental']),
	parameters: z.object({
		ph: z.number().optional(),
		temperature: z.number().optional(),
		dissolvedOxygen: z.number().optional(),
		conductivity: z.number().optional(),
		turbidity: z.number().optional(),
		tds: z.number().optional(),
		contaminants: z.record(z.string(), z.number()).optional()
	}),
	notes: z.string().optional()
});

const circularSystemSchema = z.object({
	name: z.string().min(1),
	inputStreams: z.array(z.object({
		source: z.string(),
		material: z.string(),
		volumePerDay: z.number().positive(),
		composition: z.record(z.string(), z.number()).optional()
	})).min(1),
	outputProducts: z.array(z.object({
		product: z.string(),
		volumePerDay: z.number().positive(),
		valuePerUnit: z.number().optional(),
		destination: z.string()
	})),
	processSteps: z.array(z.string()),
	energyRequirement: z.number().positive().optional(), // kWh per day
	waterRecoveryRate: z.number().min(0).max(100).optional()
});

const safetyIncidentSchema = z.object({
	incidentType: z.enum([
		'chemical_spill',
		'equipment_failure',
		'exposure_incident',
		'near_miss',
		'environmental_release',
		'process_upset'
	]),
	severity: z.enum(['minor', 'moderate', 'serious', 'critical']),
	location: z.string(),
	description: z.string(),
	immediateActions: z.array(z.string()),
	personnelInvolved: z.array(z.string()).optional(),
	equipmentInvolved: z.array(z.string()).optional(),
	containmentStatus: z.enum(['contained', 'partially_contained', 'uncontained'])
});

interface RemediationStatus {
	projectId: string;
	name: string;
	phase: string;
	progress: number;
	waterTreated: number; // Total gallons
	contaminantsRemoved: number; // Total kg
	efficiencyRate: number;
	nextMilestone: string;
	alerts: string[];
}

interface WaterQualityReport {
	reportId: string;
	siteId: string;
	complianceStatus: 'compliant' | 'marginal' | 'non_compliant';
	parameters: Record<string, { value: number; limit: number; status: string }>;
	trend: 'improving' | 'stable' | 'declining';
	recommendations: string[];
}

interface CircularSystemStatus {
	systemId: string;
	name: string;
	operationalStatus: 'running' | 'maintenance' | 'offline';
	inputProcessed: number;
	outputProduced: number;
	recoveryRate: number;
	valueGenerated: number;
	efficiency: number;
}

interface CaelumetricsDashboard {
	activeRemediationProjects: number;
	totalWaterTreated: number;
	contaminantsRemoved: number;
	circularSystemsOnline: number;
	complianceRate: number;
	safetyDaysWithoutIncident: number;
	valueRecovered: number;
	pendingAlerts: Array<{
		type: string;
		message: string;
		severity: string;
		timestamp: string;
	}>;
}

/**
 * Dusty's Service - CEO of Caelumetrics (Human Council Member)
 * The Alchemist of Restoration
 *
 * Manages water remediation, resource valorization, safety protocols,
 * and circular systems for transforming waste into value.
 */
export class DustyService extends EventEmitter {
	private readonly logger: LoggerInterface;
	private readonly memberId = 'dusty';
	private readonly isHuman = true;

	constructor() {
		super();
		this.logger = createLogger('DustyService');
	}

	/**
	 * Create a new remediation project
	 */
	async createRemediationProject(
		input: z.infer<typeof remediationProjectSchema>,
		requesterId: string
	): Promise<{ projectId: string; status: RemediationStatus }> {
		try {
			const validatedInput = remediationProjectSchema.parse(input);

			this.logger.info('Remediation project created', {
				requesterId,
				name: validatedInput.name,
				type: validatedInput.contaminationType
			});

			const projectId = uuidv4();

			const status: RemediationStatus = {
				projectId,
				name: validatedInput.name,
				phase: 'assessment',
				progress: 0,
				waterTreated: 0,
				contaminantsRemoved: 0,
				efficiencyRate: 0,
				nextMilestone: 'Site characterization complete',
				alerts: []
			};

			await surrealDBService.query(
				`CREATE remediation_projects CONTENT {
					id: $projectId,
					name: $name,
					siteLocation: $siteLocation,
					contaminationType: $contaminationType,
					waterSource: $waterSource,
					estimatedVolume: $estimatedVolume,
					targetQuality: $targetQuality,
					timeline: $timeline,
					budget: $budget,
					phase: 'assessment',
					progress: 0,
					createdBy: $requesterId,
					assignedTo: $memberId,
					createdAt: time::now()
				}`,
				{
					projectId,
					name: validatedInput.name,
					siteLocation: validatedInput.siteLocation,
					contaminationType: validatedInput.contaminationType,
					waterSource: validatedInput.waterSource,
					estimatedVolume: validatedInput.estimatedVolume,
					targetQuality: validatedInput.targetQuality || {},
					timeline: validatedInput.timeline,
					budget: validatedInput.budget || 0,
					requesterId,
					memberId: this.memberId
				}
			);

			await this.createNotification({
				type: 'new_remediation_project',
				priority: 'elevated',
				message: `New remediation project: ${validatedInput.name} - ${validatedInput.contaminationType}`,
				details: { projectId, ...validatedInput }
			});

			this.emit('remediationProjectCreated', { projectId, name: validatedInput.name });

			return { projectId, status };

		} catch (error) {
			this.logger.error('Error creating remediation project', { error, requesterId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid project parameters', error.issues);
			}
			throw new ServiceError('Failed to create remediation project', error);
		}
	}

	/**
	 * Record water quality test results
	 */
	async recordWaterQualityTest(
		input: z.infer<typeof waterQualityTestSchema>,
		testerId: string
	): Promise<WaterQualityReport> {
		try {
			const validatedInput = waterQualityTestSchema.parse(input);

			this.logger.info('Water quality test recorded', {
				testerId,
				siteId: validatedInput.siteId,
				testType: validatedInput.testType
			});

			const reportId = uuidv4();

			// Evaluate compliance against limits
			const complianceEval = this.evaluateCompliance(validatedInput.parameters);

			// Get historical data for trend analysis
			const historical = await this.getHistoricalWaterQuality(validatedInput.siteId);
			const trend = this.calculateWaterQualityTrend(validatedInput.parameters, historical);

			// Generate recommendations
			const recommendations = this.generateWaterQualityRecommendations(
				complianceEval,
				validatedInput.testType
			);

			await surrealDBService.query(
				`CREATE water_quality_tests CONTENT {
					id: $reportId,
					siteId: $siteId,
					sampleLocation: $sampleLocation,
					testType: $testType,
					parameters: $parameters,
					complianceStatus: $complianceStatus,
					trend: $trend,
					notes: $notes,
					testerId: $testerId,
					createdAt: time::now()
				}`,
				{
					reportId,
					siteId: validatedInput.siteId,
					sampleLocation: validatedInput.sampleLocation,
					testType: validatedInput.testType,
					parameters: validatedInput.parameters,
					complianceStatus: complianceEval.status,
					trend,
					notes: validatedInput.notes || '',
					testerId
				}
			);

			// Alert if non-compliant
			if (complianceEval.status === 'non_compliant') {
				await this.createNotification({
					type: 'compliance_alert',
					priority: 'critical',
					message: `Non-compliant water quality at ${validatedInput.sampleLocation}`,
					details: { reportId, parameters: complianceEval.parameters }
				});
			}

			const report: WaterQualityReport = {
				reportId,
				siteId: validatedInput.siteId,
				complianceStatus: complianceEval.status,
				parameters: complianceEval.parameters,
				trend,
				recommendations
			};

			this.emit('waterQualityRecorded', { reportId, status: complianceEval.status });

			return report;

		} catch (error) {
			this.logger.error('Error recording water quality test', { error, testerId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid test parameters', error.issues);
			}
			throw new ServiceError('Failed to record water quality test', error);
		}
	}

	/**
	 * Create a circular system for resource valorization
	 */
	async createCircularSystem(
		input: z.infer<typeof circularSystemSchema>,
		requesterId: string
	): Promise<{ systemId: string; status: CircularSystemStatus }> {
		try {
			const validatedInput = circularSystemSchema.parse(input);

			this.logger.info('Circular system created', {
				requesterId,
				name: validatedInput.name,
				inputStreams: validatedInput.inputStreams.length
			});

			const systemId = uuidv4();

			// Calculate expected recovery rates
			const totalInput = validatedInput.inputStreams.reduce((sum, s) => sum + s.volumePerDay, 0);
			const totalOutput = validatedInput.outputProducts.reduce((sum, p) => sum + p.volumePerDay, 0);
			const expectedRecovery = (totalOutput / totalInput) * 100;

			const status: CircularSystemStatus = {
				systemId,
				name: validatedInput.name,
				operationalStatus: 'offline',
				inputProcessed: 0,
				outputProduced: 0,
				recoveryRate: 0,
				valueGenerated: 0,
				efficiency: 0
			};

			await surrealDBService.query(
				`CREATE circular_systems CONTENT {
					id: $systemId,
					name: $name,
					inputStreams: $inputStreams,
					outputProducts: $outputProducts,
					processSteps: $processSteps,
					energyRequirement: $energyRequirement,
					expectedRecoveryRate: $expectedRecoveryRate,
					operationalStatus: 'offline',
					createdBy: $requesterId,
					assignedTo: $memberId,
					createdAt: time::now()
				}`,
				{
					systemId,
					name: validatedInput.name,
					inputStreams: validatedInput.inputStreams,
					outputProducts: validatedInput.outputProducts,
					processSteps: validatedInput.processSteps,
					energyRequirement: validatedInput.energyRequirement || 0,
					expectedRecoveryRate: expectedRecovery,
					requesterId,
					memberId: this.memberId
				}
			);

			await this.createNotification({
				type: 'new_circular_system',
				priority: 'elevated',
				message: `New circular system created: ${validatedInput.name}`,
				details: { systemId, expectedRecovery }
			});

			this.emit('circularSystemCreated', { systemId, name: validatedInput.name });

			return { systemId, status };

		} catch (error) {
			this.logger.error('Error creating circular system', { error, requesterId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid system parameters', error.issues);
			}
			throw new ServiceError('Failed to create circular system', error);
		}
	}

	/**
	 * Report a safety incident
	 */
	async reportSafetyIncident(
		input: z.infer<typeof safetyIncidentSchema>,
		reporterId: string
	): Promise<{ incidentId: string; responseActions: string[]; escalationRequired: boolean }> {
		try {
			const validatedInput = safetyIncidentSchema.parse(input);

			this.logger.warn('Safety incident reported', {
				reporterId,
				type: validatedInput.incidentType,
				severity: validatedInput.severity
			});

			const incidentId = uuidv4();
			const escalationRequired = validatedInput.severity === 'serious' || validatedInput.severity === 'critical';

			// Generate response actions based on incident type
			const responseActions = this.generateIncidentResponse(validatedInput);

			await surrealDBService.query(
				`CREATE safety_incidents CONTENT {
					id: $incidentId,
					incidentType: $incidentType,
					severity: $severity,
					location: $location,
					description: $description,
					immediateActions: $immediateActions,
					personnelInvolved: $personnelInvolved,
					equipmentInvolved: $equipmentInvolved,
					containmentStatus: $containmentStatus,
					responseActions: $responseActions,
					escalationRequired: $escalationRequired,
					status: 'open',
					reporterId: $reporterId,
					assignedTo: $memberId,
					createdAt: time::now()
				}`,
				{
					incidentId,
					incidentType: validatedInput.incidentType,
					severity: validatedInput.severity,
					location: validatedInput.location,
					description: validatedInput.description,
					immediateActions: validatedInput.immediateActions,
					personnelInvolved: validatedInput.personnelInvolved || [],
					equipmentInvolved: validatedInput.equipmentInvolved || [],
					containmentStatus: validatedInput.containmentStatus,
					responseActions,
					escalationRequired,
					reporterId,
					memberId: this.memberId
				}
			);

			// Critical alert
			await this.createNotification({
				type: 'safety_incident',
				priority: validatedInput.severity === 'critical' ? 'critical' : 'urgent',
				message: `Safety incident: ${validatedInput.incidentType} at ${validatedInput.location}`,
				details: { incidentId, severity: validatedInput.severity, containmentStatus: validatedInput.containmentStatus }
			});

			// Notify Luke (security) if escalation required
			if (escalationRequired) {
				await this.notifySecurityTeam(incidentId, validatedInput);
			}

			this.emit('safetyIncidentReported', { incidentId, severity: validatedInput.severity });

			return { incidentId, responseActions, escalationRequired };

		} catch (error) {
			this.logger.error('Error reporting safety incident', { error, reporterId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid incident report', error.issues);
			}
			throw new ServiceError('Failed to report safety incident', error);
		}
	}

	/**
	 * Get Caelumetrics dashboard
	 */
	async getDashboard(): Promise<CaelumetricsDashboard> {
		try {
			const projectsResult = await surrealDBService.query<any[]>(
				`SELECT count() as count FROM remediation_projects WHERE phase != 'complete'`
			);
			const activeProjects = (projectsResult.data as any[])?.[0]?.count || 0;

			const treatmentResult = await surrealDBService.query<any[]>(
				`SELECT math::sum(waterTreated) as total FROM remediation_projects`
			);
			const totalWaterTreated = (treatmentResult.data as any[])?.[0]?.total || 0;

			const circularResult = await surrealDBService.query<any[]>(
				`SELECT count() as count FROM circular_systems WHERE operationalStatus = 'running'`
			);
			const circularOnline = (circularResult.data as any[])?.[0]?.count || 0;

			const safetyResult = await surrealDBService.query<any[]>(
				`SELECT * FROM safety_incidents WHERE status = 'open' ORDER BY createdAt DESC`
			);
			const lastIncident = (safetyResult.data as any[])?.[0];
			const daysSinceIncident = lastIncident
				? Math.floor((Date.now() - new Date(lastIncident.createdAt).getTime()) / (24 * 60 * 60 * 1000))
				: 365;

			const alertsResult = await surrealDBService.query<any[]>(
				`SELECT * FROM notifications WHERE recipientId = $memberId AND read = false ORDER BY createdAt DESC LIMIT 5`,
				{ memberId: this.memberId }
			);

			return {
				activeRemediationProjects: activeProjects,
				totalWaterTreated,
				contaminantsRemoved: totalWaterTreated * 0.0023, // Estimated kg per gallon
				circularSystemsOnline: circularOnline,
				complianceRate: 0.94, // Would calculate from actual data
				safetyDaysWithoutIncident: daysSinceIncident,
				valueRecovered: 125000, // Would calculate from circular systems
				pendingAlerts: ((alertsResult.data as any[]) || []).map(a => ({
					type: a.type,
					message: a.message,
					severity: a.priority,
					timestamp: a.createdAt
				}))
			};

		} catch (error) {
			this.logger.error('Error fetching dashboard', { error });
			throw new ServiceError('Failed to fetch Caelumetrics dashboard', error);
		}
	}

	/**
	 * Private helper methods
	 */

	private async createNotification(notification: {
		type: string;
		priority: string;
		message: string;
		details: any;
	}): Promise<void> {
		await surrealDBService.query(
			`CREATE notifications CONTENT {
				id: $id,
				recipientId: $recipientId,
				type: $type,
				priority: $priority,
				message: $message,
				details: $details,
				read: false,
				createdAt: time::now()
			}`,
			{
				id: uuidv4(),
				recipientId: this.memberId,
				...notification
			}
		);
	}

	private evaluateCompliance(parameters: any): {
		status: 'compliant' | 'marginal' | 'non_compliant';
		parameters: Record<string, { value: number; limit: number; status: string }>;
	} {
		const limits: Record<string, number> = {
			ph_min: 6.5, ph_max: 8.5,
			turbidity: 5, tds: 500,
			dissolvedOxygen: 5
		};

		const evaluated: Record<string, { value: number; limit: number; status: string }> = {};
		let hasNonCompliant = false;
		let hasMarginal = false;

		if (parameters.ph !== undefined) {
			const inRange = parameters.ph >= limits.ph_min && parameters.ph <= limits.ph_max;
			const marginal = parameters.ph >= 6.0 && parameters.ph <= 9.0;
			evaluated.ph = {
				value: parameters.ph,
				limit: 7.5, // midpoint
				status: inRange ? 'compliant' : (marginal ? 'marginal' : 'non_compliant')
			};
			if (!inRange && !marginal) hasNonCompliant = true;
			if (!inRange && marginal) hasMarginal = true;
		}

		if (parameters.turbidity !== undefined) {
			const compliant = parameters.turbidity <= limits.turbidity;
			const marginal = parameters.turbidity <= limits.turbidity * 1.5;
			evaluated.turbidity = {
				value: parameters.turbidity,
				limit: limits.turbidity,
				status: compliant ? 'compliant' : (marginal ? 'marginal' : 'non_compliant')
			};
			if (!compliant && !marginal) hasNonCompliant = true;
			if (!compliant && marginal) hasMarginal = true;
		}

		return {
			status: hasNonCompliant ? 'non_compliant' : (hasMarginal ? 'marginal' : 'compliant'),
			parameters: evaluated
		};
	}

	private async getHistoricalWaterQuality(siteId: string): Promise<any[]> {
		const result = await surrealDBService.query<any[]>(
			`SELECT parameters FROM water_quality_tests WHERE siteId = $siteId ORDER BY createdAt DESC LIMIT 10`,
			{ siteId }
		);
		return (result.data as any[]) || [];
	}

	private calculateWaterQualityTrend(current: any, historical: any[]): 'improving' | 'stable' | 'declining' {
		if (historical.length < 3) return 'stable';
		// Simplified trend calculation
		return 'stable';
	}

	private generateWaterQualityRecommendations(compliance: any, testType: string): string[] {
		const recommendations = [];

		if (compliance.status === 'non_compliant') {
			recommendations.push('Immediate investigation of contamination source required');
			recommendations.push('Increase treatment intensity');
			recommendations.push('Conduct follow-up testing within 24 hours');
		} else if (compliance.status === 'marginal') {
			recommendations.push('Monitor closely for further degradation');
			recommendations.push('Review treatment process parameters');
		}

		if (testType === 'output') {
			recommendations.push('Verify discharge permit compliance');
		}

		return recommendations;
	}

	private generateIncidentResponse(incident: z.infer<typeof safetyIncidentSchema>): string[] {
		const responses = [...incident.immediateActions];

		switch (incident.incidentType) {
			case 'chemical_spill':
				responses.push('Deploy spill containment materials');
				responses.push('Evacuate non-essential personnel');
				responses.push('Contact hazmat response if needed');
				break;
			case 'equipment_failure':
				responses.push('Isolate affected equipment');
				responses.push('Assess process impact');
				responses.push('Initiate backup systems if available');
				break;
			case 'environmental_release':
				responses.push('Notify environmental agencies');
				responses.push('Document release extent');
				responses.push('Implement containment measures');
				break;
		}

		if (incident.severity === 'critical') {
			responses.push('Activate emergency response team');
			responses.push('Notify all stakeholders');
		}

		return responses;
	}

	private async notifySecurityTeam(incidentId: string, incident: any): Promise<void> {
		await surrealDBService.query(
			`CREATE notifications CONTENT {
				id: $id,
				recipientId: 'luke',
				type: 'safety_escalation',
				priority: 'critical',
				message: $message,
				details: $details,
				read: false,
				createdAt: time::now()
			}`,
			{
				id: uuidv4(),
				message: `Safety incident escalation: ${incident.incidentType} at ${incident.location}`,
				details: { incidentId, ...incident }
			}
		);
	}

	async initialize(): Promise<void> {
		this.logger.info('Dusty - CEO of Caelumetrics service initialized');
	}

	async shutdown(): Promise<void> {
		this.logger.info('Dusty service shutting down');
	}
}

export default DustyService;

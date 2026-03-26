import { EventEmitter } from 'events';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { surrealDBService } from '../surrealdb-service';
import { createLogger, LoggerInterface } from '../../utils/logger';
import { ValidationError, ServiceError } from '../../utils/errors';

/**
 * Input validation schemas for Hillary's domain
 */
const environmentalAssessmentSchema = z.object({
	projectId: z.string().min(1),
	location: z.object({
		name: z.string(),
		coordinates: z.object({
			lat: z.number(),
			lng: z.number()
		}).optional(),
		acreage: z.number().positive().optional()
	}),
	assessmentType: z.enum([
		'initial_survey',
		'impact_analysis',
		'restoration_plan',
		'wildlife_census',
		'water_quality',
		'soil_analysis',
		'biodiversity_study'
	]),
	priority: z.enum(['routine', 'elevated', 'urgent', 'critical']).default('routine'),
	deadline: z.string().datetime().optional(),
	notes: z.string().optional()
});

const restorationProjectSchema = z.object({
	name: z.string().min(1),
	location: z.string(),
	scope: z.enum(['small', 'medium', 'large', 'landscape']),
	restorationGoals: z.array(z.enum([
		'native_habitat',
		'water_remediation',
		'soil_regeneration',
		'wildlife_corridor',
		'carbon_sequestration',
		'erosion_control',
		'pollinator_support',
		'wetland_restoration'
	])).min(1),
	timelineMonths: z.number().positive(),
	budget: z.number().positive().optional(),
	partnerOrganizations: z.array(z.string()).optional(),
	requiredPermits: z.array(z.string()).optional()
});

const wildlifeReportSchema = z.object({
	location: z.string(),
	sightingType: z.enum(['routine', 'notable', 'endangered', 'invasive', 'unusual_behavior']),
	species: z.string(),
	count: z.number().positive().optional(),
	behavior: z.string().optional(),
	photos: z.array(z.string()).optional(),
	actionRequired: z.boolean().default(false),
	notes: z.string().optional()
});

const sustainabilityMetricSchema = z.object({
	category: z.enum([
		'energy',
		'water',
		'waste',
		'carbon',
		'biodiversity',
		'land_use',
		'materials'
	]),
	metricName: z.string(),
	currentValue: z.number(),
	targetValue: z.number(),
	unit: z.string(),
	measurementDate: z.string().datetime(),
	projectId: z.string().optional()
});

interface EnvironmentalAssignment {
	assignmentId: string;
	type: string;
	status: 'pending' | 'in_progress' | 'awaiting_review' | 'completed';
	assignedTo: string;
	createdAt: string;
	dueDate?: string;
	priority: string;
	details: Record<string, any>;
}

interface RestorationStatus {
	projectId: string;
	name: string;
	phase: string;
	progress: number;
	milestones: Array<{
		name: string;
		targetDate: string;
		completed: boolean;
	}>;
	healthIndicators: Record<string, number>;
	nextActions: string[];
}

interface EnvironmentalDashboard {
	activeProjects: number;
	pendingAssessments: number;
	restorationProgress: number;
	biodiversityIndex: number;
	carbonOffset: number;
	waterQualityScore: number;
	recentAlerts: Array<{
		type: string;
		message: string;
		severity: string;
		timestamp: string;
	}>;
	upcomingMilestones: Array<{
		project: string;
		milestone: string;
		date: string;
	}>;
}

/**
 * Hillary's Service - Chief Environmental Steward (Human Council Member)
 * The Conscience of the Land
 *
 * This service manages coordination with Hillary for environmental stewardship,
 * restoration projects, wildlife monitoring, and sustainability tracking.
 */
export class HillaryService extends EventEmitter {
	private readonly logger: LoggerInterface;
	private readonly memberId = 'hillary';
	private readonly isHuman = true;

	constructor() {
		super();
		this.logger = createLogger('HillaryService');
	}

	/**
	 * Request an environmental assessment from Hillary
	 */
	async requestAssessment(
		input: z.infer<typeof environmentalAssessmentSchema>,
		requesterId: string
	): Promise<EnvironmentalAssignment> {
		try {
			const validatedInput = environmentalAssessmentSchema.parse(input);

			this.logger.info('Environmental assessment requested', {
				requesterId,
				type: validatedInput.assessmentType,
				location: validatedInput.location.name
			});

			const assignmentId = uuidv4();

			const assignment: EnvironmentalAssignment = {
				assignmentId,
				type: validatedInput.assessmentType,
				status: 'pending',
				assignedTo: this.memberId,
				createdAt: new Date().toISOString(),
				dueDate: validatedInput.deadline,
				priority: validatedInput.priority,
				details: {
					projectId: validatedInput.projectId,
					location: validatedInput.location,
					notes: validatedInput.notes
				}
			};

			// Store assignment
			await this.storeAssignment(assignment, requesterId);

			// Create notification for Hillary
			await this.createNotification({
				type: 'assessment_request',
				priority: validatedInput.priority,
				message: `New ${validatedInput.assessmentType.replace(/_/g, ' ')} requested for ${validatedInput.location.name}`,
				details: assignment
			});

			this.emit('assessmentRequested', {
				assignmentId,
				type: validatedInput.assessmentType,
				requesterId
			});

			return assignment;

		} catch (error) {
			this.logger.error('Error requesting assessment', { error, requesterId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid assessment request', error.issues);
			}
			throw new ServiceError('Failed to request assessment', error);
		}
	}

	/**
	 * Create or update a restoration project
	 */
	async createRestorationProject(
		input: z.infer<typeof restorationProjectSchema>,
		requesterId: string
	): Promise<{ projectId: string; status: RestorationStatus }> {
		try {
			const validatedInput = restorationProjectSchema.parse(input);

			this.logger.info('Restoration project created', {
				requesterId,
				name: validatedInput.name,
				scope: validatedInput.scope
			});

			const projectId = uuidv4();

			// Generate milestones based on scope and timeline
			const milestones = this.generateRestorationMilestones(
				validatedInput.restorationGoals,
				validatedInput.timelineMonths
			);

			const status: RestorationStatus = {
				projectId,
				name: validatedInput.name,
				phase: 'planning',
				progress: 0,
				milestones,
				healthIndicators: {
					soilHealth: 0,
					waterQuality: 0,
					biodiversity: 0,
					vegetationCover: 0
				},
				nextActions: [
					'Site survey and baseline assessment',
					'Stakeholder engagement planning',
					'Permit application preparation',
					'Resource and material sourcing'
				]
			};

			// Store project
			await surrealDBService.query(
				`CREATE restoration_projects CONTENT {
					id: $projectId,
					name: $name,
					location: $location,
					scope: $scope,
					goals: $goals,
					timelineMonths: $timeline,
					budget: $budget,
					partners: $partners,
					permits: $permits,
					status: $status,
					phase: 'planning',
					progress: 0,
					createdBy: $requesterId,
					assignedTo: $memberId,
					createdAt: time::now()
				}`,
				{
					projectId,
					name: validatedInput.name,
					location: validatedInput.location,
					scope: validatedInput.scope,
					goals: validatedInput.restorationGoals,
					timeline: validatedInput.timelineMonths,
					budget: validatedInput.budget || 0,
					partners: validatedInput.partnerOrganizations || [],
					permits: validatedInput.requiredPermits || [],
					status: 'active',
					requesterId,
					memberId: this.memberId
				}
			);

			// Notify Hillary
			await this.createNotification({
				type: 'new_project',
				priority: 'elevated',
				message: `New restoration project created: ${validatedInput.name}`,
				details: { projectId, ...validatedInput }
			});

			this.emit('restorationProjectCreated', { projectId, name: validatedInput.name });

			return { projectId, status };

		} catch (error) {
			this.logger.error('Error creating restoration project', { error, requesterId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid project parameters', error.issues);
			}
			throw new ServiceError('Failed to create restoration project', error);
		}
	}

	/**
	 * Submit a wildlife report/sighting
	 */
	async submitWildlifeReport(
		input: z.infer<typeof wildlifeReportSchema>,
		reporterId: string
	): Promise<{ reportId: string; actionRequired: boolean; recommendations: string[] }> {
		try {
			const validatedInput = wildlifeReportSchema.parse(input);

			this.logger.info('Wildlife report submitted', {
				reporterId,
				species: validatedInput.species,
				type: validatedInput.sightingType
			});

			const reportId = uuidv4();

			// Determine if action is required
			const actionRequired = validatedInput.actionRequired ||
				validatedInput.sightingType === 'endangered' ||
				validatedInput.sightingType === 'invasive';

			// Generate recommendations based on sighting type
			const recommendations = this.generateWildlifeRecommendations(validatedInput);

			// Store report
			await surrealDBService.query(
				`CREATE wildlife_reports CONTENT {
					id: $reportId,
					location: $location,
					sightingType: $sightingType,
					species: $species,
					count: $count,
					behavior: $behavior,
					photos: $photos,
					actionRequired: $actionRequired,
					notes: $notes,
					reporterId: $reporterId,
					assignedTo: $memberId,
					status: $status,
					createdAt: time::now()
				}`,
				{
					reportId,
					location: validatedInput.location,
					sightingType: validatedInput.sightingType,
					species: validatedInput.species,
					count: validatedInput.count || 1,
					behavior: validatedInput.behavior || '',
					photos: validatedInput.photos || [],
					actionRequired,
					notes: validatedInput.notes || '',
					reporterId,
					memberId: this.memberId,
					status: actionRequired ? 'pending_review' : 'logged'
				}
			);

			// Alert Hillary if action required
			if (actionRequired) {
				await this.createNotification({
					type: 'wildlife_alert',
					priority: validatedInput.sightingType === 'endangered' ? 'critical' : 'elevated',
					message: `Wildlife report requires attention: ${validatedInput.species} (${validatedInput.sightingType})`,
					details: { reportId, ...validatedInput }
				});
			}

			this.emit('wildlifeReportSubmitted', {
				reportId,
				species: validatedInput.species,
				actionRequired
			});

			return { reportId, actionRequired, recommendations };

		} catch (error) {
			this.logger.error('Error submitting wildlife report', { error, reporterId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid wildlife report', error.issues);
			}
			throw new ServiceError('Failed to submit wildlife report', error);
		}
	}

	/**
	 * Record a sustainability metric
	 */
	async recordSustainabilityMetric(
		input: z.infer<typeof sustainabilityMetricSchema>,
		recorderId: string
	): Promise<{ metricId: string; trend: 'improving' | 'stable' | 'declining'; insight: string }> {
		try {
			const validatedInput = sustainabilityMetricSchema.parse(input);

			this.logger.info('Sustainability metric recorded', {
				recorderId,
				category: validatedInput.category,
				metric: validatedInput.metricName
			});

			const metricId = uuidv4();

			// Get historical data to determine trend
			const historical = await this.getHistoricalMetrics(
				validatedInput.category,
				validatedInput.metricName
			);

			const trend = this.calculateTrend(validatedInput.currentValue, historical);
			const progressToTarget = (validatedInput.currentValue / validatedInput.targetValue) * 100;

			// Store metric
			await surrealDBService.query(
				`CREATE sustainability_metrics CONTENT {
					id: $metricId,
					category: $category,
					metricName: $metricName,
					currentValue: $currentValue,
					targetValue: $targetValue,
					unit: $unit,
					measurementDate: $measurementDate,
					projectId: $projectId,
					recorderId: $recorderId,
					trend: $trend,
					progressToTarget: $progressToTarget,
					createdAt: time::now()
				}`,
				{
					metricId,
					category: validatedInput.category,
					metricName: validatedInput.metricName,
					currentValue: validatedInput.currentValue,
					targetValue: validatedInput.targetValue,
					unit: validatedInput.unit,
					measurementDate: validatedInput.measurementDate,
					projectId: validatedInput.projectId || null,
					recorderId,
					trend,
					progressToTarget
				}
			);

			const insight = this.generateMetricInsight(validatedInput, trend, progressToTarget);

			this.emit('metricRecorded', {
				metricId,
				category: validatedInput.category,
				trend
			});

			return { metricId, trend, insight };

		} catch (error) {
			this.logger.error('Error recording sustainability metric', { error, recorderId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid metric data', error.issues);
			}
			throw new ServiceError('Failed to record metric', error);
		}
	}

	/**
	 * Get Hillary's environmental dashboard
	 */
	async getDashboard(): Promise<EnvironmentalDashboard> {
		try {
			// Fetch active projects
			const projectsResult = await surrealDBService.query<any[]>(
				`SELECT count() as count FROM restoration_projects WHERE status = 'active'`
			);
			const activeProjects = (projectsResult.data as any[])?.[0]?.count || 0;

			// Fetch pending assessments
			const assessmentsResult = await surrealDBService.query<any[]>(
				`SELECT count() as count FROM environmental_assignments WHERE status = 'pending'`
			);
			const pendingAssessments = (assessmentsResult.data as any[])?.[0]?.count || 0;

			// Calculate average restoration progress
			const progressResult = await surrealDBService.query<any[]>(
				`SELECT math::mean(progress) as avgProgress FROM restoration_projects WHERE status = 'active'`
			);
			const restorationProgress = (progressResult.data as any[])?.[0]?.avgProgress || 0;

			// Get recent alerts
			const alertsResult = await surrealDBService.query<any[]>(
				`SELECT * FROM environmental_alerts ORDER BY timestamp DESC LIMIT 5`
			);
			const recentAlerts = (alertsResult.data as any[]) || [];

			// Get upcoming milestones
			const milestonesResult = await surrealDBService.query<any[]>(
				`SELECT project, milestone, date FROM project_milestones
				 WHERE completed = false AND date > time::now()
				 ORDER BY date ASC LIMIT 5`
			);
			const upcomingMilestones = (milestonesResult.data as any[]) || [];

			const dashboard: EnvironmentalDashboard = {
				activeProjects,
				pendingAssessments,
				restorationProgress,
				biodiversityIndex: 0.72, // Would calculate from actual data
				carbonOffset: 156.5, // Tons CO2
				waterQualityScore: 0.85,
				recentAlerts: recentAlerts.map(a => ({
					type: a.type,
					message: a.message,
					severity: a.severity,
					timestamp: a.timestamp
				})),
				upcomingMilestones: upcomingMilestones.map(m => ({
					project: m.project,
					milestone: m.milestone,
					date: m.date
				}))
			};

			return dashboard;

		} catch (error) {
			this.logger.error('Error fetching dashboard', { error });
			throw new ServiceError('Failed to fetch environmental dashboard', error);
		}
	}

	/**
	 * Get pending tasks for Hillary
	 */
	async getPendingTasks(): Promise<EnvironmentalAssignment[]> {
		try {
			const result = await surrealDBService.query<any[]>(
				`SELECT * FROM environmental_assignments
				 WHERE assignedTo = $memberId AND status IN ['pending', 'in_progress']
				 ORDER BY priority DESC, createdAt ASC`,
				{ memberId: this.memberId }
			);

			return (result.data as any[]) || [];

		} catch (error) {
			this.logger.error('Error fetching pending tasks', { error });
			throw new ServiceError('Failed to fetch pending tasks', error);
		}
	}

	/**
	 * Update assignment status (for Hillary's use)
	 */
	async updateAssignmentStatus(
		assignmentId: string,
		status: 'in_progress' | 'awaiting_review' | 'completed',
		notes?: string
	): Promise<void> {
		try {
			await surrealDBService.query(
				`UPDATE environmental_assignments
				 SET status = $status, notes = $notes, updatedAt = time::now()
				 WHERE id = $assignmentId`,
				{ assignmentId, status, notes: notes || '' }
			);

			this.emit('assignmentUpdated', { assignmentId, status });

		} catch (error) {
			this.logger.error('Error updating assignment', { error, assignmentId });
			throw new ServiceError('Failed to update assignment', error);
		}
	}

	/**
	 * Private helper methods
	 */

	private async storeAssignment(assignment: EnvironmentalAssignment, requesterId: string): Promise<void> {
		await surrealDBService.query(
			`CREATE environmental_assignments CONTENT {
				id: $assignmentId,
				type: $type,
				status: $status,
				assignedTo: $assignedTo,
				createdAt: $createdAt,
				dueDate: $dueDate,
				priority: $priority,
				details: $details,
				requesterId: $requesterId
			}`,
			{
				assignmentId: assignment.assignmentId,
				type: assignment.type,
				status: assignment.status,
				assignedTo: assignment.assignedTo,
				createdAt: assignment.createdAt,
				dueDate: assignment.dueDate || null,
				priority: assignment.priority,
				details: assignment.details,
				requesterId
			}
		);
	}

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
				type: notification.type,
				priority: notification.priority,
				message: notification.message,
				details: notification.details
			}
		);
	}

	private generateRestorationMilestones(
		goals: string[],
		timelineMonths: number
	): RestorationStatus['milestones'] {
		const milestones = [];
		const now = new Date();

		// Phase 1: Planning (first 10% of timeline)
		milestones.push({
			name: 'Site Assessment Complete',
			targetDate: new Date(now.getTime() + (timelineMonths * 0.1 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
			completed: false
		});

		// Phase 2: Preparation (10-25% of timeline)
		milestones.push({
			name: 'Permits and Approvals Secured',
			targetDate: new Date(now.getTime() + (timelineMonths * 0.25 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
			completed: false
		});

		// Phase 3: Implementation (25-75% of timeline)
		if (goals.includes('native_habitat') || goals.includes('vegetation_cover')) {
			milestones.push({
				name: 'Native Planting Complete',
				targetDate: new Date(now.getTime() + (timelineMonths * 0.5 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
				completed: false
			});
		}

		if (goals.includes('water_remediation') || goals.includes('wetland_restoration')) {
			milestones.push({
				name: 'Water Feature Restoration Complete',
				targetDate: new Date(now.getTime() + (timelineMonths * 0.6 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
				completed: false
			});
		}

		// Phase 4: Monitoring (75-100% of timeline)
		milestones.push({
			name: 'Initial Monitoring Period Complete',
			targetDate: new Date(now.getTime() + (timelineMonths * 0.9 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
			completed: false
		});

		milestones.push({
			name: 'Project Handoff and Long-term Plan',
			targetDate: new Date(now.getTime() + (timelineMonths * 30 * 24 * 60 * 60 * 1000)).toISOString(),
			completed: false
		});

		return milestones;
	}

	private generateWildlifeRecommendations(input: z.infer<typeof wildlifeReportSchema>): string[] {
		const recommendations = [];

		switch (input.sightingType) {
			case 'endangered':
				recommendations.push('Document GPS coordinates precisely');
				recommendations.push('Avoid disturbing the area');
				recommendations.push('Report to state wildlife agency');
				recommendations.push('Consider protective buffer zone');
				break;
			case 'invasive':
				recommendations.push('Mark location for removal planning');
				recommendations.push('Document extent of population');
				recommendations.push('Develop eradication strategy');
				recommendations.push('Monitor surrounding areas');
				break;
			case 'unusual_behavior':
				recommendations.push('Continue observation if safe');
				recommendations.push('Check for environmental stressors');
				recommendations.push('Consult wildlife veterinarian if needed');
				break;
			default:
				recommendations.push('Log for biodiversity tracking');
				recommendations.push('Add to species inventory');
		}

		return recommendations;
	}

	private async getHistoricalMetrics(category: string, metricName: string): Promise<number[]> {
		const result = await surrealDBService.query<any[]>(
			`SELECT currentValue FROM sustainability_metrics
			 WHERE category = $category AND metricName = $metricName
			 ORDER BY measurementDate DESC LIMIT 10`,
			{ category, metricName }
		);

		return ((result.data as any[]) || []).map(r => r.currentValue);
	}

	private calculateTrend(current: number, historical: number[]): 'improving' | 'stable' | 'declining' {
		if (historical.length < 2) return 'stable';

		const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
		const change = ((current - avg) / avg) * 100;

		if (change > 5) return 'improving';
		if (change < -5) return 'declining';
		return 'stable';
	}

	private generateMetricInsight(
		input: z.infer<typeof sustainabilityMetricSchema>,
		trend: string,
		progressToTarget: number
	): string {
		const progress = progressToTarget.toFixed(0);

		if (progressToTarget >= 100) {
			return `Target achieved! ${input.metricName} has reached ${progress}% of goal.`;
		} else if (trend === 'improving') {
			return `${input.metricName} is improving. Currently at ${progress}% of target.`;
		} else if (trend === 'declining') {
			return `Attention needed: ${input.metricName} is declining. Currently at ${progress}% of target.`;
		}
		return `${input.metricName} is stable at ${progress}% of target.`;
	}

	async initialize(): Promise<void> {
		this.logger.info('Hillary - Chief Environmental Steward service initialized');
	}

	async shutdown(): Promise<void> {
		this.logger.info('Hillary service shutting down');
	}
}

export default HillaryService;

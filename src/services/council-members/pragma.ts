import { EventEmitter } from 'events';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { surrealDBService } from '../surrealdb-service';
import { ConstitutionService } from '../constitution-service';
import { createLogger, LoggerInterface } from '../../utils/logger';
import { ValidationError, ServiceError } from '../../utils/errors';

/**
 * Input validation schemas
 */
const prioritizeTasksSchema = z.object({
	tasks: z.array(z.object({
		id: z.string(),
		title: z.string(),
		description: z.string().optional(),
		estimatedEffort: z.enum(['minimal', 'small', 'medium', 'large', 'extensive']),
		impact: z.enum(['low', 'medium', 'high', 'critical']),
		alignment: z.number().min(0).max(1).optional(),
		deadline: z.string().datetime().optional(),
		dependencies: z.array(z.string()).optional(),
		assignee: z.string().optional()
	})).min(1),
	availableTime: z.number().positive().optional(), // Hours available
	energyLevel: z.enum(['low', 'medium', 'high']).optional(),
	currentFocus: z.array(z.string()).optional(),
	constraints: z.array(z.string()).optional()
});

const nextActionSchema = z.object({
	context: z.string().min(1),
	currentCommitments: z.array(z.string()).optional(),
	availableTime: z.number().positive(), // Hours available for next action
	energyLevel: z.enum(['low', 'medium', 'high']),
	blockers: z.array(z.string()).optional(),
	recentCompletions: z.array(z.string()).optional()
});

const sequenceWorkSchema = z.object({
	workItems: z.array(z.object({
		id: z.string(),
		title: z.string(),
		type: z.enum(['task', 'project', 'meeting', 'review', 'creative']),
		estimatedDuration: z.number().positive(), // Hours
		energyRequired: z.enum(['low', 'medium', 'high']),
		dependencies: z.array(z.string()).optional(),
		deadline: z.string().datetime().optional(),
		canBeParallel: z.boolean().default(false)
	})).min(1),
	timeWindow: z.object({
		start: z.string().datetime(),
		end: z.string().datetime()
	}),
	preferences: z.object({
		frontloadHard: z.boolean().default(true),
		groupSimilar: z.boolean().default(true),
		bufferTime: z.number().min(0).default(0.25) // 15 min buffers
	}).optional()
});

const focusAssessmentSchema = z.object({
	currentProjects: z.array(z.object({
		id: z.string(),
		name: z.string(),
		progress: z.number().min(0).max(100),
		priority: z.enum(['low', 'medium', 'high', 'critical']),
		genesisAlignment: z.number().min(0).max(1)
	})),
	distractions: z.array(z.string()).optional(),
	urgentRequests: z.array(z.string()).optional(),
	personalState: z.object({
		energyLevel: z.enum(['low', 'medium', 'high']),
		stressLevel: z.enum(['low', 'medium', 'high']),
		familyCommitments: z.boolean().default(false)
	}).optional()
});

interface PrioritizedTask {
	id: string;
	title: string;
	priority: number;
	rationale: string;
	suggestedTimeSlot: string;
	estimatedCompletion: string;
	alignmentScore: number;
}

interface NextActionResult {
	action: string;
	rationale: string;
	estimatedDuration: number;
	energyMatch: boolean;
	alternatives: string[];
	notNowItems: string[];
}

interface WorkSequence {
	sequenceId: string;
	orderedItems: Array<{
		id: string;
		title: string;
		scheduledStart: string;
		scheduledEnd: string;
		buffer: number;
		rationale: string;
	}>;
	totalDuration: number;
	efficiency: number;
	warnings: string[];
}

interface FocusAssessment {
	assessmentId: string;
	recommendedFocus: string[];
	dropSuggestions: string[];
	delegateSuggestions: string[];
	delaySuggestions: string[];
	focusScore: number;
	burnoutRisk: number;
	genesisAlignment: number;
}

/**
 * Pragma's Agent Service - Tactics & Execution Specialist
 * The "Hex Bolt in the Engine" - decides what to do next and sequences work
 * Focuses on aligned progress over raw volume, presence over hustle
 */
export class PragmaAgentService extends EventEmitter {
	private readonly logger: LoggerInterface;
	private readonly surrealDBService = surrealDBService;
	private readonly constitutionService: ConstitutionService;
	private readonly agentId = 'pragma';

	private readonly personalityTraits = {
		decisiveness: 0.95,
		practicalFocus: 0.98,
		burnoutAwareness: 0.92,
		alignmentSensitivity: 0.90,
		kindDirectness: 0.88
	};

	constructor() {
		super();
		this.logger = createLogger('PragmaAgentService');
		this.constitutionService = new ConstitutionService();
	}

	/**
	 * Prioritizes a list of tasks based on impact, effort, alignment, and current state
	 * Core function: Pick the next right move, not every possible move
	 */
	async prioritizeTasks(
		input: z.infer<typeof prioritizeTasksSchema>,
		userId: string
	): Promise<{ prioritizedTasks: PrioritizedTask[]; droppedTasks: string[]; rationale: string }> {
		try {
			const validatedInput = prioritizeTasksSchema.parse(input);

			this.logger.info('Pragma prioritizing tasks', {
				userId,
				taskCount: validatedInput.tasks.length
			});

			// Check constitutional alignment for task prioritization
			const constitutionCheck = await this.constitutionService.checkCompliance(
				'task_prioritization',
				{
					taskCount: validatedInput.tasks.length,
					context: 'tactical_planning'
				}
			);

			// Score and rank tasks
			const scoredTasks = await Promise.all(
				validatedInput.tasks.map(async (task) => {
					const score = await this.calculateTaskScore(
						task,
						validatedInput.availableTime,
						validatedInput.energyLevel,
						validatedInput.currentFocus
					);
					return { task, score };
				})
			);

			// Sort by score descending
			scoredTasks.sort((a, b) => b.score.totalScore - a.score.totalScore);

			// Determine capacity and cut-off
			const availableHours = validatedInput.availableTime || 8;
			let cumulativeHours = 0;
			const prioritizedTasks: PrioritizedTask[] = [];
			const droppedTasks: string[] = [];

			for (const { task, score } of scoredTasks) {
				const taskHours = this.effortToHours(task.estimatedEffort);

				if (cumulativeHours + taskHours <= availableHours && prioritizedTasks.length < 5) {
					// Only recommend 1-3 priorities, max 5
					prioritizedTasks.push({
						id: task.id,
						title: task.title,
						priority: prioritizedTasks.length + 1,
						rationale: score.rationale,
						suggestedTimeSlot: this.suggestTimeSlot(prioritizedTasks.length, taskHours),
						estimatedCompletion: new Date(Date.now() + taskHours * 60 * 60 * 1000).toISOString(),
						alignmentScore: score.alignmentScore
					});
					cumulativeHours += taskHours;
				} else {
					droppedTasks.push(task.title);
				}
			}

			// Store prioritization in workspace
			await this.storePrioritization(userId, prioritizedTasks, droppedTasks);

			const rationale = this.generatePrioritizationRationale(
				prioritizedTasks,
				droppedTasks,
				availableHours,
				validatedInput.energyLevel
			);

			this.emit('tasksPrioritized', {
				userId,
				prioritizedCount: prioritizedTasks.length,
				droppedCount: droppedTasks.length
			});

			return { prioritizedTasks, droppedTasks, rationale };

		} catch (error) {
			this.logger.error('Error prioritizing tasks', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid task prioritization input', error.issues);
			}
			throw new ServiceError('Failed to prioritize tasks', error);
		}
	}

	/**
	 * Determines the single best next action given current context
	 * "Given everything, what's the next best use of my next 2 hours?"
	 */
	async determineNextAction(
		input: z.infer<typeof nextActionSchema>,
		userId: string
	): Promise<NextActionResult> {
		try {
			const validatedInput = nextActionSchema.parse(input);

			this.logger.info('Pragma determining next action', {
				userId,
				availableTime: validatedInput.availableTime,
				energyLevel: validatedInput.energyLevel
			});

			// Analyze context and blockers
			const contextAnalysis = await this.analyzeContext(
				validatedInput.context,
				validatedInput.blockers || []
			);

			// Get pending items from workspace
			const pendingItems = await this.getPendingItems(userId);

			// Filter by energy match
			const energyAppropriate = this.filterByEnergyMatch(
				pendingItems,
				validatedInput.energyLevel,
				validatedInput.availableTime
			);

			// Select best action
			const bestAction = await this.selectBestAction(
				energyAppropriate,
				validatedInput,
				contextAnalysis
			);

			// Generate alternatives
			const alternatives = energyAppropriate
				.filter(item => item.id !== bestAction.id)
				.slice(0, 3)
				.map(item => item.title);

			// Items to defer
			const notNowItems = pendingItems
				.filter(item => !energyAppropriate.includes(item))
				.slice(0, 3)
				.map(item => item.title);

			const result: NextActionResult = {
				action: bestAction.title,
				rationale: this.generateActionRationale(bestAction, validatedInput),
				estimatedDuration: bestAction.estimatedDuration,
				energyMatch: true,
				alternatives,
				notNowItems
			};

			this.emit('nextActionDetermined', { userId, action: result.action });

			return result;

		} catch (error) {
			this.logger.error('Error determining next action', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid next action input', error.issues);
			}
			throw new ServiceError('Failed to determine next action', error);
		}
	}

	/**
	 * Sequences work items into an optimal order for execution
	 * Respects energy levels, dependencies, and deadlines
	 */
	async sequenceWork(
		input: z.infer<typeof sequenceWorkSchema>,
		userId: string
	): Promise<WorkSequence> {
		try {
			const validatedInput = sequenceWorkSchema.parse(input);

			this.logger.info('Pragma sequencing work', {
				userId,
				itemCount: validatedInput.workItems.length
			});

			const preferences = validatedInput.preferences || {
				frontloadHard: true,
				groupSimilar: true,
				bufferTime: 0.25
			};

			// Build dependency graph
			const dependencyGraph = this.buildDependencyGraph(validatedInput.workItems);

			// Topological sort respecting dependencies
			const sortedItems = this.topologicalSort(validatedInput.workItems, dependencyGraph);

			// Apply energy-based ordering (hard tasks in morning if frontloading)
			const energyOrderedItems = preferences.frontloadHard
				? this.frontloadHighEnergy(sortedItems)
				: sortedItems;

			// Schedule with buffers
			const startTime = new Date(validatedInput.timeWindow.start);
			const endTime = new Date(validatedInput.timeWindow.end);
			const orderedItems = this.scheduleWithBuffers(
				energyOrderedItems,
				startTime,
				endTime,
				preferences.bufferTime
			);

			// Calculate efficiency
			const totalWorkTime = validatedInput.workItems.reduce(
				(sum, item) => sum + item.estimatedDuration, 0
			);
			const windowDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
			const efficiency = Math.min(1, totalWorkTime / windowDuration);

			// Generate warnings
			const warnings = this.generateSequenceWarnings(orderedItems, validatedInput);

			const sequence: WorkSequence = {
				sequenceId: uuidv4(),
				orderedItems,
				totalDuration: totalWorkTime,
				efficiency,
				warnings
			};

			// Store sequence in workspace
			await this.storeWorkSequence(userId, sequence);

			this.emit('workSequenced', { userId, sequenceId: sequence.sequenceId });

			return sequence;

		} catch (error) {
			this.logger.error('Error sequencing work', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid work sequence input', error.issues);
			}
			throw new ServiceError('Failed to sequence work', error);
		}
	}

	/**
	 * Assesses current focus and recommends what to drop, delegate, or delay
	 * "What can be gracefully dropped?"
	 */
	async assessFocus(
		input: z.infer<typeof focusAssessmentSchema>,
		userId: string
	): Promise<FocusAssessment> {
		try {
			const validatedInput = focusAssessmentSchema.parse(input);

			this.logger.info('Pragma assessing focus', {
				userId,
				projectCount: validatedInput.currentProjects.length
			});

			// Analyze current load
			const loadAnalysis = this.analyzeCurrentLoad(
				validatedInput.currentProjects,
				validatedInput.personalState
			);

			// Calculate burnout risk
			const burnoutRisk = this.calculateBurnoutRisk(
				validatedInput.currentProjects.length,
				validatedInput.personalState,
				validatedInput.urgentRequests?.length || 0
			);

			// Determine what to focus on (max 3 items)
			const recommendedFocus = validatedInput.currentProjects
				.filter(p => p.priority === 'critical' || p.priority === 'high')
				.sort((a, b) => b.genesisAlignment - a.genesisAlignment)
				.slice(0, 3)
				.map(p => p.name);

			// Suggestions for items not in focus
			const notInFocus = validatedInput.currentProjects.filter(
				p => !recommendedFocus.includes(p.name)
			);

			const dropSuggestions = notInFocus
				.filter(p => p.priority === 'low' && p.genesisAlignment < 0.5)
				.map(p => p.name);

			const delegateSuggestions = notInFocus
				.filter(p => p.priority === 'medium' && p.progress < 30)
				.map(p => p.name);

			const delaySuggestions = notInFocus
				.filter(p => !dropSuggestions.includes(p.name) && !delegateSuggestions.includes(p.name))
				.map(p => p.name);

			// Calculate overall alignment
			const genesisAlignment = validatedInput.currentProjects.reduce(
				(sum, p) => sum + p.genesisAlignment, 0
			) / validatedInput.currentProjects.length;

			// Calculate focus score
			const focusScore = this.calculateFocusScore(
				recommendedFocus.length,
				validatedInput.distractions?.length || 0,
				loadAnalysis.overcommitment
			);

			const assessment: FocusAssessment = {
				assessmentId: uuidv4(),
				recommendedFocus,
				dropSuggestions,
				delegateSuggestions,
				delaySuggestions,
				focusScore,
				burnoutRisk,
				genesisAlignment
			};

			// Store assessment
			await this.storeFocusAssessment(userId, assessment);

			this.emit('focusAssessed', {
				userId,
				focusScore: assessment.focusScore,
				burnoutRisk: assessment.burnoutRisk
			});

			return assessment;

		} catch (error) {
			this.logger.error('Error assessing focus', { error, userId });
			if (error instanceof z.ZodError) {
				throw new ValidationError('Invalid focus assessment input', error.issues);
			}
			throw new ServiceError('Failed to assess focus', error);
		}
	}

	/**
	 * Private helper methods implementing Pragma's tactical intelligence
	 */

	private async calculateTaskScore(
		task: any,
		availableTime?: number,
		energyLevel?: string,
		currentFocus?: string[]
	): Promise<{ totalScore: number; alignmentScore: number; rationale: string }> {
		const impactScores = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
		const effortScores = { minimal: 1.0, small: 0.8, medium: 0.6, large: 0.4, extensive: 0.2 };

		const impactScore = impactScores[task.impact as keyof typeof impactScores] || 0.5;
		const effortScore = effortScores[task.estimatedEffort as keyof typeof effortScores] || 0.5;
		const alignmentScore = task.alignment || 0.7;

		// ROI = Impact / Effort, weighted by alignment
		const roiScore = (impactScore / (1 - effortScore + 0.1)) * alignmentScore;

		// Deadline urgency bonus
		let urgencyBonus = 0;
		if (task.deadline) {
			const hoursUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
			if (hoursUntilDeadline < 24) urgencyBonus = 0.3;
			else if (hoursUntilDeadline < 48) urgencyBonus = 0.15;
		}

		// Focus alignment bonus
		let focusBonus = 0;
		if (currentFocus && currentFocus.some(f => task.title.toLowerCase().includes(f.toLowerCase()))) {
			focusBonus = 0.2;
		}

		const totalScore = roiScore + urgencyBonus + focusBonus;

		const rationale = `Impact: ${task.impact}, Effort: ${task.estimatedEffort}, ROI Score: ${roiScore.toFixed(2)}` +
			(urgencyBonus > 0 ? `, Urgent` : '') +
			(focusBonus > 0 ? `, Aligned with focus` : '');

		return { totalScore, alignmentScore, rationale };
	}

	private effortToHours(effort: string): number {
		const mapping: Record<string, number> = {
			minimal: 0.5,
			small: 1,
			medium: 2,
			large: 4,
			extensive: 8
		};
		return mapping[effort] || 2;
	}

	private suggestTimeSlot(priority: number, hours: number): string {
		const now = new Date();
		const startHour = 9 + (priority * 2); // Stagger through the day
		const start = new Date(now);
		start.setHours(startHour, 0, 0, 0);

		const end = new Date(start);
		end.setHours(start.getHours() + hours);

		return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	}

	private generatePrioritizationRationale(
		prioritized: PrioritizedTask[],
		dropped: string[],
		availableHours: number,
		energyLevel?: string
	): string {
		let rationale = `Pragma's tactical assessment: With ${availableHours} hours available`;

		if (energyLevel) {
			rationale += ` and ${energyLevel} energy`;
		}

		rationale += `, I recommend focusing on ${prioritized.length} key item${prioritized.length > 1 ? 's' : ''}. `;

		if (dropped.length > 0) {
			rationale += `${dropped.length} item${dropped.length > 1 ? 's have' : ' has'} been moved to "not now" - this isn't rejection, it's protection of your focus. `;
		}

		rationale += `Remember: aligned progress over raw volume. You're not behind; you're building sustainably.`;

		return rationale;
	}

	private async storePrioritization(userId: string, tasks: PrioritizedTask[], dropped: string[]): Promise<void> {
		await surrealDBService.query(
			`CREATE prioritizations CONTENT {
				id: $id,
				userId: $userId,
				prioritizedTasks: $tasks,
				droppedTasks: $dropped,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				id: uuidv4(),
				userId,
				tasks,
				dropped,
				agentId: this.agentId
			}
		);
	}

	private async analyzeContext(context: string, blockers: string[]): Promise<any> {
		return {
			context,
			blockerCount: blockers.length,
			hasBlockers: blockers.length > 0,
			contextType: this.categorizeContext(context)
		};
	}

	private categorizeContext(context: string): string {
		const keywords = {
			creative: ['design', 'write', 'create', 'brainstorm'],
			technical: ['code', 'build', 'fix', 'debug', 'implement'],
			strategic: ['plan', 'strategy', 'decide', 'review'],
			administrative: ['email', 'meeting', 'organize', 'schedule']
		};

		for (const [type, words] of Object.entries(keywords)) {
			if (words.some(word => context.toLowerCase().includes(word))) {
				return type;
			}
		}
		return 'general';
	}

	private async getPendingItems(userId: string): Promise<any[]> {
		const result = await surrealDBService.query<any[]>(
			`SELECT * FROM tasks WHERE userId = $userId AND status = 'pending' ORDER BY priority DESC LIMIT 20`,
			{ userId }
		);
		return Array.isArray(result.data) ? result.data : [];
	}

	private filterByEnergyMatch(items: any[], energyLevel: string, availableTime: number): any[] {
		const energyMapping: Record<string, string[]> = {
			low: ['minimal', 'small'],
			medium: ['minimal', 'small', 'medium'],
			high: ['minimal', 'small', 'medium', 'large', 'extensive']
		};

		const allowedEfforts = energyMapping[energyLevel] || energyMapping.medium;

		return items.filter(item => {
			const effort = item.estimatedEffort || 'medium';
			const duration = item.estimatedDuration || 2;
			return allowedEfforts.includes(effort) && duration <= availableTime;
		});
	}

	private async selectBestAction(items: any[], input: any, contextAnalysis: any): Promise<any> {
		if (items.length === 0) {
			return {
				id: 'rest',
				title: 'Take a mindful break - no urgent items match your current energy',
				estimatedDuration: 0.25
			};
		}

		// Sort by alignment and urgency
		const sorted = items.sort((a, b) => {
			const aScore = (a.alignment || 0.5) + (a.priority === 'critical' ? 0.3 : 0);
			const bScore = (b.alignment || 0.5) + (b.priority === 'critical' ? 0.3 : 0);
			return bScore - aScore;
		});

		return sorted[0];
	}

	private generateActionRationale(action: any, input: any): string {
		return `This action matches your ${input.energyLevel} energy level and fits within your ${input.availableTime}-hour window. ` +
			`It moves the needle on what matters without burning you out.`;
	}

	private buildDependencyGraph(items: any[]): Map<string, string[]> {
		const graph = new Map<string, string[]>();

		for (const item of items) {
			graph.set(item.id, item.dependencies || []);
		}

		return graph;
	}

	private topologicalSort(items: any[], graph: Map<string, string[]>): any[] {
		const visited = new Set<string>();
		const result: any[] = [];
		const itemMap = new Map(items.map(i => [i.id, i]));

		const visit = (id: string) => {
			if (visited.has(id)) return;
			visited.add(id);

			const deps = graph.get(id) || [];
			for (const dep of deps) {
				visit(dep);
			}

			const item = itemMap.get(id);
			if (item) result.push(item);
		};

		for (const item of items) {
			visit(item.id);
		}

		return result;
	}

	private frontloadHighEnergy(items: any[]): any[] {
		return items.sort((a, b) => {
			const energyOrder = { high: 0, medium: 1, low: 2 };
			return (energyOrder[a.energyRequired as keyof typeof energyOrder] || 1) -
				(energyOrder[b.energyRequired as keyof typeof energyOrder] || 1);
		});
	}

	private scheduleWithBuffers(
		items: any[],
		startTime: Date,
		endTime: Date,
		bufferHours: number
	): any[] {
		let currentTime = new Date(startTime);
		const scheduled = [];

		for (const item of items) {
			const itemStart = new Date(currentTime);
			const itemEnd = new Date(currentTime.getTime() + item.estimatedDuration * 60 * 60 * 1000);

			if (itemEnd > endTime) {
				break; // Don't schedule past end time
			}

			scheduled.push({
				id: item.id,
				title: item.title,
				scheduledStart: itemStart.toISOString(),
				scheduledEnd: itemEnd.toISOString(),
				buffer: bufferHours,
				rationale: `${item.energyRequired} energy task scheduled ${scheduled.length === 0 ? 'first' : 'next'}`
			});

			// Add buffer
			currentTime = new Date(itemEnd.getTime() + bufferHours * 60 * 60 * 1000);
		}

		return scheduled;
	}

	private generateSequenceWarnings(orderedItems: any[], input: any): string[] {
		const warnings = [];

		if (orderedItems.length < input.workItems.length) {
			warnings.push(`${input.workItems.length - orderedItems.length} items don't fit in the time window`);
		}

		const totalBuffer = orderedItems.length * (input.preferences?.bufferTime || 0.25);
		if (totalBuffer < 0.5) {
			warnings.push('Consider adding more buffer time between tasks');
		}

		return warnings;
	}

	private async storeWorkSequence(userId: string, sequence: WorkSequence): Promise<void> {
		await surrealDBService.query(
			`CREATE work_sequences CONTENT {
				id: $sequenceId,
				userId: $userId,
				orderedItems: $orderedItems,
				totalDuration: $totalDuration,
				efficiency: $efficiency,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				sequenceId: sequence.sequenceId,
				userId,
				orderedItems: sequence.orderedItems,
				totalDuration: sequence.totalDuration,
				efficiency: sequence.efficiency,
				agentId: this.agentId
			}
		);
	}

	private analyzeCurrentLoad(projects: any[], personalState?: any): any {
		const highPriorityCount = projects.filter(p => p.priority === 'high' || p.priority === 'critical').length;
		const overcommitment = projects.length > 5 || highPriorityCount > 3;

		return {
			projectCount: projects.length,
			highPriorityCount,
			overcommitment,
			averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
		};
	}

	private calculateBurnoutRisk(
		projectCount: number,
		personalState?: any,
		urgentCount: number = 0
	): number {
		let risk = 0;

		// Project overload
		if (projectCount > 5) risk += 0.3;
		else if (projectCount > 3) risk += 0.15;

		// Energy level
		if (personalState?.energyLevel === 'low') risk += 0.25;
		else if (personalState?.energyLevel === 'medium') risk += 0.1;

		// Stress level
		if (personalState?.stressLevel === 'high') risk += 0.3;
		else if (personalState?.stressLevel === 'medium') risk += 0.15;

		// Family commitments
		if (personalState?.familyCommitments) risk += 0.1;

		// Urgent requests
		risk += Math.min(0.2, urgentCount * 0.05);

		return Math.min(1, risk);
	}

	private calculateFocusScore(
		focusCount: number,
		distractionCount: number,
		overcommitted: boolean
	): number {
		let score = 0.7; // Base score

		// Ideal focus is 1-3 items
		if (focusCount >= 1 && focusCount <= 3) score += 0.2;
		else if (focusCount > 5) score -= 0.3;

		// Distractions reduce focus
		score -= Math.min(0.3, distractionCount * 0.05);

		// Overcommitment penalty
		if (overcommitted) score -= 0.2;

		return Math.max(0, Math.min(1, score));
	}

	private async storeFocusAssessment(userId: string, assessment: FocusAssessment): Promise<void> {
		await surrealDBService.query(
			`CREATE focus_assessments CONTENT {
				id: $assessmentId,
				userId: $userId,
				recommendedFocus: $recommendedFocus,
				focusScore: $focusScore,
				burnoutRisk: $burnoutRisk,
				genesisAlignment: $genesisAlignment,
				createdBy: $agentId,
				timestamp: time::now()
			}`,
			{
				assessmentId: assessment.assessmentId,
				userId,
				recommendedFocus: assessment.recommendedFocus,
				focusScore: assessment.focusScore,
				burnoutRisk: assessment.burnoutRisk,
				genesisAlignment: assessment.genesisAlignment,
				agentId: this.agentId
			}
		);
	}
}

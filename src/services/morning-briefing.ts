import { createLogger, LoggerInterface } from '../utils/logger';
import { DEFAULT_COUNCIL_MEMBERS, MEETING_CONFIGURATIONS } from '../utils/council-config';

/**
 * Morning Briefing Service
 * Orchestrates the daily morning coffee conversation with the AI council
 * Creates a natural, flowing conversation that sets the day's strategic direction
 */

interface BriefingParticipant {
	id: string;
	name: string;
	role: string;
	ready: boolean;
	insights: string[];
	priorities: string[];
}

interface MorningBriefingSession {
	sessionId: string;
	date: string;
	participants: BriefingParticipant[];
	agenda: string[];
	insights: Array<{
		source: string;
		insight: string;
		impact: string;
		actionRequired: boolean;
	}>;
	decisions: Array<{
		decision: string;
		rationale: string;
		owner: string;
		timeline: string;
	}>;
	priorities: Array<{
		priority: string;
		assignee: string;
		deadline: string;
		importance: 'critical' | 'high' | 'medium' | 'low';
	}>;
	next_steps: string[];
	conversation_flow: Array<{
		speaker: string;
		message: string;
		timestamp: string;
		type: 'greeting' | 'insight' | 'question' | 'decision' | 'action';
	}>;
}

export class MorningBriefingService {
	private readonly logger: LoggerInterface;

	constructor() {
		this.logger = createLogger('MorningBriefingService');
	}

	/**
	 * Start a morning briefing session
	 */
	async startMorningBriefing(): Promise<MorningBriefingSession> {
		const sessionId = `briefing_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
		
		this.logger.info('Starting morning briefing session', { sessionId });

		// Initialize participants based on meeting configuration
		const meetingConfig = MEETING_CONFIGURATIONS.morning_briefing;
		const participants = this.initializeParticipants([...meetingConfig.participants]);

		// Create session structure
		const session: MorningBriefingSession = {
			sessionId,
			date: new Date().toISOString().split('T')[0],
			participants,
			agenda: this.generateMorningAgenda(),
			insights: [],
			decisions: [],
			priorities: [],
			next_steps: [],
			conversation_flow: []
		};

		// Start the conversation flow
		await this.initiateConversationFlow(session);

		return session;
	}

	/**
	 * Initialize briefing participants
	 */
	private initializeParticipants(participantIds: string[]): BriefingParticipant[] {
		return participantIds.map(id => {
			const member = DEFAULT_COUNCIL_MEMBERS.find(m => m.id === id);
			return {
				id,
				name: member?.name || id,
				role: member?.role || 'Council Member',
				ready: true,
				insights: this.generateMockInsights(id),
				priorities: this.generateMockPriorities(id)
			};
		});
	}

	/**
	 * Generate morning briefing agenda
	 */
	private generateMorningAgenda(): string[] {
		return [
			'Morning greetings and energy check',
			'Overnight developments review',
			'Key insights from each council member',
			'Strategic priorities for today',
			'Resource allocation decisions',
			'Coordination needs',
			'Closing alignment check'
		];
	}

	/**
	 * Initiate the conversation flow
	 */
	private async initiateConversationFlow(session: MorningBriefingSession): Promise<void> {
		// Founder opens the briefing
		this.addConversationMessage(session, 'founder', 
			'Good morning, council. Ready for our daily alignment over coffee? ☕ Let\'s start with a quick energy check - how is everyone feeling today?',
			'greeting'
		);

		// Kairo responds with strategic overview
		await this.simulateDelay(500);
		this.addConversationMessage(session, 'kairo',
			'Good morning! I\'m energized and ready. Overnight, I\'ve been analyzing the market patterns we discussed yesterday. The strategic landscape shows some interesting shifts that align well with our regenerative mission. Clara, what\'s the coordination outlook?',
			'insight'
		);

		// Clara provides operational readiness
		await this.simulateDelay(400);
		this.addConversationMessage(session, 'clara',
			'Morning, everyone! All systems are green. I\'ve reviewed overnight activities and prepared today\'s coordination matrix. We have three strategic decisions pending from yesterday, and two new opportunities that Kairo flagged need evaluation. Would you like me to prioritize these now?',
			'question'
		);

		// Founder makes priority decision
		await this.simulateDelay(300);
		this.addConversationMessage(session, 'founder',
			'Perfect, Clara. Let\'s hear Kairo\'s market insights first, then we\'ll prioritize. Kairo, what patterns are you seeing that we should factor into today\'s decisions?',
			'decision'
		);

		// Kairo shares strategic insight
		await this.simulateDelay(600);
		this.addConversationMessage(session, 'kairo',
			'Two key patterns: First, there\'s increasing demand for authentic, regenerative solutions in the healthcare space - aligning perfectly with our mission. Second, I\'m seeing investment capital flowing toward companies with genuine social impact. This creates a strategic window for our next funding conversations. My recommendation: accelerate the healthcare initiative while the market conditions are optimal.',
			'insight'
		);

		// Add the insight to session insights
		session.insights.push({
			source: 'kairo',
			insight: 'Market showing increased demand for regenerative healthcare solutions with favorable investment climate',
			impact: 'Strategic opportunity for accelerated healthcare initiative',
			actionRequired: true
		});

		// Clara responds with coordination needs
		await this.simulateDelay(400);
		this.addConversationMessage(session, 'clara',
			'Excellent insight, Kairo. I can coordinate a healthcare initiative acceleration plan. We\'ll need Joule for technical architecture, Sterling for financial modeling, and Veritas for compliance review. Should I schedule a focused session this afternoon?',
			'action'
		);

		// Add priority to session
		session.priorities.push({
			priority: 'Healthcare initiative acceleration',
			assignee: 'clara',
			deadline: 'Today afternoon',
			importance: 'high'
		});

		// Founder concludes
		await this.simulateDelay(300);
		this.addConversationMessage(session, 'founder',
			'Yes, coordinate that session. This feels aligned with our divine timing principle - when opportunities and preparation meet, we move. Clara, add this to our high-priority actions. Kairo, keep monitoring those patterns. Great alignment this morning, team. Let\'s make it a powerful day! ✨',
			'decision'
		);

		// Add final decision
		session.decisions.push({
			decision: 'Accelerate healthcare initiative development',
			rationale: 'Market conditions optimal, aligns with regenerative mission',
			owner: 'clara',
			timeline: 'Today afternoon session'
		});

		// Generate next steps
		session.next_steps = [
			'Clara to coordinate healthcare initiative session',
			'Kairo to continue market pattern monitoring',
			'Afternoon focused session with technical and financial teams',
			'Healthcare initiative acceleration plan development'
		];

		this.logger.info('Morning briefing conversation flow completed', {
			sessionId: session.sessionId,
			messageCount: session.conversation_flow.length,
			insightCount: session.insights.length,
			priorityCount: session.priorities.length
		});
	}

	/**
	 * Add a conversation message to the flow
	 */
	private addConversationMessage(
		session: MorningBriefingSession,
		speaker: string,
		message: string,
		type: 'greeting' | 'insight' | 'question' | 'decision' | 'action'
	): void {
		session.conversation_flow.push({
			speaker,
			message,
			timestamp: new Date().toISOString(),
			type
		});
	}

	/**
	 * Simulate realistic conversation delays
	 */
	private async simulateDelay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Generate mock insights for testing
	 */
	private generateMockInsights(agentId: string): string[] {
		const insightMap: Record<string, string[]> = {
			'kairo': [
				'Market trends showing 40% increase in regenerative solution demand',
				'Three strategic partnerships opportunities identified',
				'Constitutional alignment score 98% across all current initiatives'
			],
			'clara': [
				'All council members at 85% capacity utilization',
				'Two workflow optimizations completed overnight',
				'Coordination efficiency up 15% this week'
			],
			'founder': [
				'Divine timing indicators strong for healthcare initiative',
				'Energy levels high across all council members',
				'Strategic vision clarity at 95%'
			]
		};

		return insightMap[agentId] || ['General insights available'];
	}

	/**
	 * Generate mock priorities for testing
	 */
	private generateMockPriorities(agentId: string): string[] {
		const priorityMap: Record<string, string[]> = {
			'kairo': [
				'Complete healthcare market analysis',
				'Review partnership proposals',
				'Update strategic roadmap'
			],
			'clara': [
				'Coordinate afternoon technical session',
				'Update resource allocation matrix',
				'Prepare weekly review materials'
			],
			'founder': [
				'Review healthcare initiative proposal',
				'Make strategic partnership decisions',
				'Vision alignment validation'
			]
		};

		return priorityMap[agentId] || ['Standard priorities'];
	}

	/**
	 * Get briefing session by ID
	 */
	async getBriefingSession(sessionId: string): Promise<MorningBriefingSession | null> {
		// In a real implementation, this would retrieve from storage
		// For now, return null as this is a demo
		return null;
	}

	/**
	 * Get today's briefing summary
	 */
	async getTodaysBriefingSummary(): Promise<{
		date: string;
		keyInsights: string[];
		priorityDecisions: string[];
		nextSteps: string[];
		councilAlignment: number;
	}> {
		return {
			date: new Date().toISOString().split('T')[0],
			keyInsights: [
				'Healthcare market showing 40% demand increase for regenerative solutions',
				'Investment capital flowing toward authentic social impact companies',
				'Strategic window open for healthcare initiative acceleration'
			],
			priorityDecisions: [
				'Accelerate healthcare initiative development',
				'Schedule focused technical session for this afternoon',
				'Continue market pattern monitoring'
			],
			nextSteps: [
				'Clara coordinate healthcare initiative session',
				'Technical architecture planning with Joule',
				'Financial modeling with Sterling',
				'Compliance review with Veritas'
			],
			councilAlignment: 0.96
		};
	}

	/**
	 * Test the conversation flow
	 */
	async testConversationFlow(): Promise<{
		success: boolean;
		sessionId: string;
		messageCount: number;
		insightCount: number;
		priorityCount: number;
		conversationFlow: Array<{
			speaker: string;
			message: string;
			type: string;
		}>;
	}> {
		try {
			const session = await this.startMorningBriefing();

			return {
				success: true,
				sessionId: session.sessionId,
				messageCount: session.conversation_flow.length,
				insightCount: session.insights.length,
				priorityCount: session.priorities.length,
				conversationFlow: session.conversation_flow.map(msg => ({
					speaker: msg.speaker,
					message: msg.message,
					type: msg.type
				}))
			};

		} catch (error) {
			this.logger.error('Error testing conversation flow', { error });
			
			return {
				success: false,
				sessionId: '',
				messageCount: 0,
				insightCount: 0,
				priorityCount: 0,
				conversationFlow: []
			};
		}
	}
}
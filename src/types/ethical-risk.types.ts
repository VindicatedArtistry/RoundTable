/**
 * Ethical Risk Type Definitions
 * Types for ethical risk assessment and management in TheRoundTable AI Council
 */

export interface EthicalRisk {
	id: string;
	entityId: string;
	entityType: 'decision' | 'partnership' | 'policy' | 'action';
	riskFactors: string[];
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	context?: Record<string, any>;
	assessment: EthicalRiskAssessment;
	analysis: EthicalAnalysis;
	mitigationStrategies: MitigationStrategies;
	escalationRequired: boolean;
	status: 'active' | 'mitigated' | 'resolved' | 'escalated';
	flaggedAt: Date;
	resolvedAt?: Date;
	flaggedBy: string;
	assignedTo?: string;
}

export interface EthicalRiskAssessment {
	severity: 'low' | 'medium' | 'high' | 'critical';
	probability: number; // 0.0 to 1.0
	impact: number; // 0.0 to 1.0
	riskScore: number; // Combined probability * impact * severity multiplier
	category: EthicalRiskCategory[];
	confidence: number; // 0.0 to 1.0 - confidence in the assessment
	methodology: string;
	assessedAt: Date;
}

export interface EthicalAnalysis {
	principles: string[]; // Ethical principles involved
	violations: string[]; // Specific violations identified
	stakeholderImpact: StakeholderImpact[];
	reasoning: string;
	ethicalFramework: string; // Framework used for analysis
	conflictingValues: string[];
	supportingValues: string[];
	longTermImplications: string[];
}

export interface StakeholderImpact {
	stakeholderGroup: string;
	impactType: 'positive' | 'negative' | 'neutral';
	impactSeverity: 'low' | 'medium' | 'high';
	description: string;
	affectedRights: string[];
	mitigationRequired: boolean;
}

export interface MitigationStrategies {
	immediate: MitigationAction[];
	shortTerm: MitigationAction[];
	longTerm: MitigationAction[];
	monitoring: MonitoringAction[];
	preventive: PreventiveAction[];
}

export interface MitigationAction {
	action: string;
	description: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	estimatedEffort: string;
	estimatedCost: string;
	timeline: string;
	responsibleParty: string;
	successCriteria: string[];
	dependencies: string[];
}

export interface MonitoringAction {
	metric: string;
	frequency: string;
	threshold: string;
	alertConditions: string[];
	responsibleParty: string;
	reportingRequirements: string[];
}

export interface PreventiveAction {
	action: string;
	description: string;
	implementation: string;
	effectiveness: number; // 0.0 to 1.0
	applicability: string[];
	maintainRequirements: string[];
}

export type EthicalRiskCategory = 
	| 'privacy_violation'
	| 'discrimination_bias'
	| 'autonomy_infringement'
	| 'transparency_deficit'
	| 'accountability_gap'
	| 'fairness_concern'
	| 'security_vulnerability'
	| 'consent_violation'
	| 'data_misuse'
	| 'algorithmic_harm'
	| 'human_dignity'
	| 'social_justice'
	| 'environmental_impact'
	| 'economic_inequality'
	| 'power_imbalance'
	| 'cultural_insensitivity'
	| 'rights_violation'
	| 'manipulation_concern'
	| 'deception_risk'
	| 'exploitation_potential';

export interface EthicalRiskEscalation {
	escalationId: string;
	riskId: string;
	escalatedAt: Date;
	escalatedBy: string;
	escalationLevel: 'council_review' | 'emergency_session' | 'external_oversight' | 'legal_consultation';
	urgency: 'normal' | 'high' | 'critical' | 'emergency';
	escalationReason: string;
	requiredActions: string[];
	stakeholdersNotified: string[];
	timeline: string;
	reviewBoard: string[];
}

export interface EthicalRiskReport {
	reportId: string;
	reportPeriod: {
		startDate: Date;
		endDate: Date;
	};
	totalRisks: number;
	risksByCategory: Record<EthicalRiskCategory, number>;
	risksBySeverity: Record<'low' | 'medium' | 'high' | 'critical', number>;
	risksByStatus: Record<'active' | 'mitigated' | 'resolved' | 'escalated', number>;
	topRisks: EthicalRisk[];
	mitigationEffectiveness: {
		totalMitigations: number;
		successfulMitigations: number;
		averageResolutionTime: number;
		effectivenessScore: number;
	};
	trendsAnalysis: {
		riskTrends: string[];
		emergingPatterns: string[];
		systemicIssues: string[];
		recommendations: string[];
	};
	generatedAt: Date;
	generatedBy: string;
}

export interface CreateEthicalRiskRequest {
	entityId: string;
	entityType: 'decision' | 'partnership' | 'policy' | 'action';
	riskFactors: string[];
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	context?: Record<string, any>;
	flaggedBy: string;
	immediateAction?: boolean;
}

export interface UpdateEthicalRiskRequest {
	riskId: string;
	updates: Partial<Pick<EthicalRisk, 'severity' | 'description' | 'status' | 'assignedTo'>>;
	mitigationUpdates?: Partial<MitigationStrategies>;
	reason: string;
	updatedBy: string;
}

export interface EthicalRiskQuery {
	entityId?: string;
	entityType?: 'decision' | 'partnership' | 'policy' | 'action';
	severity?: 'low' | 'medium' | 'high' | 'critical';
	status?: 'active' | 'mitigated' | 'resolved' | 'escalated';
	category?: EthicalRiskCategory;
	assignedTo?: string;
	flaggedBy?: string;
	dateRange?: {
		startDate: Date;
		endDate: Date;
	};
	includeResolved?: boolean;
	sortBy?: 'severity' | 'flaggedAt' | 'riskScore' | 'priority';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

export interface EthicalRiskQueryResult {
	risks: EthicalRisk[];
	total: number;
	page: number;
	limit: number;
	summary: {
		activeCritical: number;
		activeHigh: number;
		pendingEscalation: number;
		averageRiskScore: number;
	};
}
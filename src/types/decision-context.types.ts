/**
 * Decision Context Type Definitions
 * Types for decision-making context and analysis in TheRoundTable AI Council
 */

export interface DecisionContext {
	decisionId: string;
	description: string;
	stakeholders: string[];
	potentialImpact: 'low' | 'medium' | 'high' | 'critical';
	timeframe: string;
	resources: string[];
	risks: string[];
	objectives: string[];
	constraints: string[];
	precedents: DecisionPrecedent[];
	dependencies: DecisionDependency[];
	successCriteria: string[];
	alternativeOptions: DecisionAlternative[];
	consultationRequired: boolean;
	publicDisclosure: boolean;
	legalImplications: LegalImplication[];
	ethicalConsiderations: EthicalConsideration[];
	environmentalImpact?: EnvironmentalImpact;
	economicImpact?: EconomicImpact;
	socialImpact?: SocialImpact;
	technicalRequirements?: TechnicalRequirement[];
	dataRequirements?: DataRequirement[];
	communicationPlan?: CommunicationPlan;
	reviewProcess?: ReviewProcess;
	approvalWorkflow?: ApprovalWorkflow;
	contingencyPlans?: ContingencyPlan[];
	monitoringPlan?: MonitoringPlan;
	context?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	lastModifiedBy: string;
}

export interface DecisionPrecedent {
	precedentId: string;
	title: string;
	description: string;
	outcome: string;
	relevance: 'high' | 'medium' | 'low';
	dateDecided: Date;
	decisionMakers: string[];
	lessonsLearned: string[];
	applicableAspects: string[];
}

export interface DecisionDependency {
	dependencyId: string;
	description: string;
	dependencyType: 'internal' | 'external' | 'regulatory' | 'technical' | 'financial';
	status: 'pending' | 'resolved' | 'blocked' | 'not_applicable';
	criticality: 'blocking' | 'high' | 'medium' | 'low';
	expectedResolution?: Date;
	responsibleParty: string;
	mitigationPlan?: string;
}

export interface DecisionAlternative {
	alternativeId: string;
	title: string;
	description: string;
	pros: string[];
	cons: string[];
	estimatedCost: string;
	estimatedBenefit: string;
	feasibility: 'high' | 'medium' | 'low';
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	implementationComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
	timeToImplement: string;
	resourceRequirements: string[];
	stakeholderSupport: 'strong' | 'moderate' | 'weak' | 'opposed';
}

export interface LegalImplication {
	implicationId: string;
	area: 'compliance' | 'liability' | 'contractual' | 'regulatory' | 'intellectual_property';
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	requirements: string[];
	constraints: string[];
	recommendedActions: string[];
	legalReview: boolean;
	expertConsultation: boolean;
	regulatoryApproval: boolean;
}

export interface EthicalConsideration {
	considerationId: string;
	principle: string;
	description: string;
	stakeholdersAffected: string[];
	potentialHarm: string[];
	potentialBenefit: string[];
	mitigationRequired: boolean;
	mitigationStrategies: string[];
	ethicalFramework: string;
	consultation: {
		required: boolean;
		stakeholders: string[];
		timeline: string;
	};
}

export interface EnvironmentalImpact {
	impactId: string;
	categories: EnvironmentalCategory[];
	overallAssessment: 'positive' | 'neutral' | 'negative' | 'mixed';
	mitigationRequired: boolean;
	mitigationMeasures: string[];
	monitoringRequirements: string[];
	complianceRequirements: string[];
	sustainabilityAlignment: boolean;
}

export interface EconomicImpact {
	impactId: string;
	directCosts: CostItem[];
	indirectCosts: CostItem[];
	benefits: BenefitItem[];
	roi: number;
	paybackPeriod: string;
	budgetImpact: 'positive' | 'neutral' | 'negative';
	fundingSource: string[];
	costBenefitAnalysis: string;
	economicRisks: string[];
}

export interface SocialImpact {
	impactId: string;
	affectedCommunities: string[];
	impactTypes: SocialImpactType[];
	overallAssessment: 'positive' | 'neutral' | 'negative' | 'mixed';
	engagementPlan: string;
	feedbackMechanisms: string[];
	culturalConsiderations: string[];
	accessibilityRequirements: string[];
	inclusionMeasures: string[];
}

export interface TechnicalRequirement {
	requirementId: string;
	category: 'infrastructure' | 'software' | 'hardware' | 'integration' | 'security' | 'performance';
	description: string;
	priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have';
	complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
	dependencies: string[];
	acceptanceCriteria: string[];
	testingRequirements: string[];
}

export interface DataRequirement {
	requirementId: string;
	dataType: string;
	source: string;
	quality: 'high' | 'medium' | 'low';
	availability: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
	privacyRequirements: string[];
	securityRequirements: string[];
	retentionPeriod: string;
	accessControls: string[];
}

export interface CommunicationPlan {
	planId: string;
	audiences: CommunicationAudience[];
	channels: string[];
	timeline: CommunicationTimeline[];
	keyMessages: string[];
	responsibleParties: string[];
	feedbackMechanisms: string[];
	crisisProtocol: string;
}

export interface ReviewProcess {
	processId: string;
	stages: ReviewStage[];
	reviewers: string[];
	timeline: string;
	criteria: string[];
	approvalThreshold: string;
	escalationPath: string[];
	documentationRequirements: string[];
}

export interface ApprovalWorkflow {
	workflowId: string;
	steps: ApprovalStep[];
	parallelApprovals: boolean;
	timeoutHandling: string;
	escalationRules: EscalationRule[];
	notificationRules: NotificationRule[];
}

export interface ContingencyPlan {
	planId: string;
	scenario: string;
	probability: 'low' | 'medium' | 'high';
	impact: 'low' | 'medium' | 'high' | 'critical';
	triggers: string[];
	responses: string[];
	responsibleParties: string[];
	resources: string[];
	timeline: string;
}

export interface MonitoringPlan {
	planId: string;
	kpis: KeyPerformanceIndicator[];
	reportingFrequency: string;
	reportingFormat: string;
	stakeholderReports: string[];
	alertThresholds: AlertThreshold[];
	reviewSchedule: string;
	correctionMechanisms: string[];
}

export type EnvironmentalCategory = 
	| 'carbon_footprint'
	| 'energy_consumption'
	| 'waste_generation'
	| 'resource_usage'
	| 'biodiversity'
	| 'water_usage'
	| 'pollution'
	| 'land_use';

export interface CostItem {
	itemId: string;
	description: string;
	amount: number;
	currency: string;
	category: string;
	recurring: boolean;
	frequency?: string;
}

export interface BenefitItem {
	itemId: string;
	description: string;
	value: number;
	currency: string;
	category: string;
	quantifiable: boolean;
	timeframe: string;
}

export type SocialImpactType = 
	| 'employment'
	| 'education'
	| 'health'
	| 'safety'
	| 'equity'
	| 'accessibility'
	| 'community_cohesion'
	| 'cultural_preservation';

export interface CommunicationAudience {
	audienceId: string;
	name: string;
	type: 'internal' | 'external' | 'regulatory' | 'public';
	interests: string[];
	preferredChannels: string[];
	messagingApproach: string;
}

export interface CommunicationTimeline {
	phase: string;
	timing: string;
	activities: string[];
	deliverables: string[];
	responsible: string[];
}

export interface ReviewStage {
	stageId: string;
	name: string;
	description: string;
	reviewers: string[];
	criteria: string[];
	timeline: string;
	deliverables: string[];
	approvalRequired: boolean;
}

export interface ApprovalStep {
	stepId: string;
	name: string;
	approvers: string[];
	requiredApprovals: number;
	timeout: string;
	autoApproval: boolean;
	conditions: string[];
}

export interface EscalationRule {
	ruleId: string;
	condition: string;
	escalateTo: string[];
	timeframe: string;
	notification: boolean;
}

export interface NotificationRule {
	ruleId: string;
	trigger: string;
	recipients: string[];
	channel: string;
	template: string;
}

export interface KeyPerformanceIndicator {
	kpiId: string;
	name: string;
	description: string;
	target: string;
	measurement: string;
	frequency: string;
	responsible: string;
}

export interface AlertThreshold {
	thresholdId: string;
	metric: string;
	condition: string;
	value: number;
	severity: 'info' | 'warning' | 'critical';
	action: string[];
}

export interface CreateDecisionContextRequest {
	description: string;
	stakeholders: string[];
	potentialImpact: 'low' | 'medium' | 'high' | 'critical';
	timeframe: string;
	resources: string[];
	risks: string[];
	objectives: string[];
	createdBy: string;
	consultationRequired?: boolean;
	publicDisclosure?: boolean;
	context?: Record<string, any>;
}

export interface UpdateDecisionContextRequest {
	decisionId: string;
	updates: Partial<DecisionContext>;
	reason: string;
	updatedBy: string;
}

export interface DecisionContextQuery {
	decisionId?: string;
	createdBy?: string;
	potentialImpact?: 'low' | 'medium' | 'high' | 'critical';
	stakeholder?: string;
	dateRange?: {
		startDate: Date;
		endDate: Date;
	};
	hasRisks?: boolean;
	consultationRequired?: boolean;
	publicDisclosure?: boolean;
	sortBy?: 'createdAt' | 'updatedAt' | 'potentialImpact';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

export interface DecisionContextQueryResult {
	contexts: DecisionContext[];
	total: number;
	page: number;
	limit: number;
	summary: {
		totalStakeholders: number;
		avgRiskCount: number;
		impactDistribution: Record<string, number>;
		consultationRequired: number;
	};
}
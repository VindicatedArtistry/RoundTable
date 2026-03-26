/**
 * Transparency Type Definitions
 * Types for transparency reporting and accountability in TheRoundTable AI Council
 */

export interface TransparencyReport {
	reportId: string;
	reportMetadata: TransparencyReportMetadata;
	executiveSummary: ExecutiveSummary;
	decisionAnalysis: DecisionAnalysis;
	partnershipOversight: PartnershipOversight;
	ethicalMetrics: EthicalMetrics;
	financialTransparency: FinancialTransparency;
	governanceReview: GovernanceReview;
	stakeholderEngagement: StakeholderEngagement;
	publicInterestAssessment: PublicInterestAssessment;
	accountabilityMeasures: AccountabilityMeasures;
	recommendations: TransparencyRecommendations;
	appendices: TransparencyAppendices;
	dataIntegrity: DataIntegrityVerification;
	accessControls: AccessControls;
	distributionLog: DistributionLog[];
	feedback: ReportFeedback[];
	status: 'draft' | 'under_review' | 'approved' | 'published' | 'archived';
	createdAt: Date;
	publishedAt?: Date;
	nextReportDue?: Date;
	retentionPeriod: string;
	publiclyAvailable: boolean;
}

export interface TransparencyReportMetadata {
	period: ReportingPeriod;
	type: 'quarterly' | 'annual' | 'incident' | 'compliance' | 'thematic' | 'ad_hoc';
	scope: TransparencyScope[];
	version: string;
	language: string[];
	format: 'pdf' | 'html' | 'interactive' | 'api' | 'dataset';
	generatedAt: Date;
	generatedBy: string;
	reviewedBy: string[];
	approvedBy: string[];
	accessLevel: 'public' | 'stakeholder' | 'internal' | 'restricted';
	classification: 'unclassified' | 'confidential' | 'restricted';
	reportingStandards: string[];
	methodology: string;
	dataQuality: DataQualityAssessment;
	limitations: string[];
	assumptions: string[];
}

export interface ExecutiveSummary {
	keyHighlights: string[];
	totalDecisions: number;
	constitutionalCompliance: ComplianceMetric;
	ethicalScore: EthicalScoreMetric;
	transparencyIndex: TransparencyIndex;
	publicEngagement: PublicEngagementMetric;
	stakeholderSatisfaction: SatisfactionMetric;
	keyFindings: Finding[];
	significantChanges: SignificantChange[];
	emergingTrends: Trend[];
	performanceAgainstTargets: PerformanceMetric[];
	riskProfile: RiskProfileSummary;
	improvementAreas: ImprovementArea[];
	achievementsHighlights: Achievement[];
}

export interface DecisionAnalysis {
	totalDecisions: number;
	decisionsByType: Record<string, DecisionTypeAnalysis>;
	decisionsByImpact: Record<string, number>;
	decisionTimelines: TimelineAnalysis;
	stakeholderInvolvement: StakeholderInvolvementAnalysis;
	publicConsultation: PublicConsultationAnalysis;
	complianceMetrics: DecisionComplianceMetrics;
	auditResults: AuditResultsSummary;
	appealsChallenges: AppealsChallengesAnalysis;
	implementationTracking: ImplementationTracking;
	outcomeAssessment: OutcomeAssessment;
	lessonsLearned: LessonLearned[];
	bestPractices: BestPractice[];
	processImprovements: ProcessImprovement[];
}

export interface PartnershipOversight {
	activePartnerships: number;
	newPartnerships: number;
	terminatedPartnerships: number;
	partnershipsByType: Record<string, PartnershipTypeAnalysis>;
	reviewedAgreements: number;
	ethicalConcerns: EthicalConcernAnalysis;
	riskAssessments: PartnershipRiskAnalysis;
	complianceMonitoring: PartnershipComplianceAnalysis;
	performanceEvaluation: PartnershipPerformanceAnalysis;
	financialOversight: PartnershipFinancialAnalysis;
	stakeholderFeedback: PartnershipStakeholderFeedback;
	benefitsRealization: BenefitsRealizationAnalysis;
	disputeResolution: DisputeResolutionAnalysis;
	terminationAnalysis: TerminationAnalysis;
}

export interface EthicalMetrics {
	risksFlagged: number;
	risksResolved: number;
	risksByCategory: Record<string, EthicalRiskCategoryAnalysis>;
	risksBySeverity: Record<string, number>;
	averageResolutionTime: number;
	escalationRate: number;
	stakeholderImpact: StakeholderImpactMetrics;
	publicInterest: PublicInterestMetrics;
	ethicalFrameworkCompliance: EthicalFrameworkCompliance;
	violationAnalysis: ViolationAnalysis;
	mitigationEffectiveness: MitigationEffectivenessAnalysis;
	preventiveActions: PreventiveActionAnalysis;
	ethicalTraining: EthicalTrainingMetrics;
	culturalAssessment: EthicalCultureAssessment;
}

export interface FinancialTransparency {
	budgetOverview: BudgetOverview;
	expenditureAnalysis: ExpenditureAnalysis;
	revenueAnalysis: RevenueAnalysis;
	contractualCommitments: ContractualCommitmentsAnalysis;
	costBenefitAnalysis: CostBenefitAnalysis;
	financialControls: FinancialControlsAssessment;
	auditFindings: FinancialAuditFindings;
	procurementTransparency: ProcurementTransparency;
	grantFunding: GrantFundingAnalysis;
	investmentPortfolio: InvestmentPortfolioAnalysis;
	riskManagement: FinancialRiskManagement;
	performanceIndicators: FinancialPerformanceIndicators;
}

export interface GovernanceReview {
	structureAnalysis: GovernanceStructureAnalysis;
	decisionMakingProcesses: DecisionMakingAnalysis;
	accountabilityMechanisms: AccountabilityMechanismAnalysis;
	policyFramework: PolicyFrameworkAnalysis;
	complianceOversight: ComplianceOversightAnalysis;
	riskManagement: GovernanceRiskManagement;
	performanceManagement: PerformanceManagementAnalysis;
	stakeholderGovernance: StakeholderGovernanceAnalysis;
	boardEffectiveness: BoardEffectivenessAnalysis;
	committeeFunctioning: CommitteeFunctioningAnalysis;
	conflictOfInterest: ConflictOfInterestAnalysis;
	transparencyMechanisms: TransparencyMechanismAnalysis;
}

export interface StakeholderEngagement {
	stakeholderMapping: StakeholderMappingAnalysis;
	engagementActivities: EngagementActivityAnalysis;
	feedbackAnalysis: StakeholderFeedbackAnalysis;
	satisfactionSurveys: SatisfactionSurveyAnalysis;
	publicConsultation: PublicConsultationAnalysis;
	communityOutreach: CommunityOutreachAnalysis;
	digitalEngagement: DigitalEngagementAnalysis;
	accessibilityMeasures: AccessibilityMeasureAnalysis;
	inclusionInitiatives: InclusionInitiativeAnalysis;
	culturalSensitivity: CulturalSensitivityAnalysis;
	responseiveness: ResponsivenessAnalysis;
	grievanceMechanisms: GrievanceMechanismAnalysis;
}

export interface PublicInterestAssessment {
	publicBenefit: PublicBenefitAnalysis;
	socialImpact: SocialImpactAnalysis;
	environmentalImpact: EnvironmentalImpactAnalysis;
	economicImpact: EconomicImpactAnalysis;
	humanRightsImpact: HumanRightsImpactAnalysis;
	equityConsiderations: EquityConsiderationAnalysis;
	accessibilityAssessment: AccessibilityAssessmentAnalysis;
	sustainabilityMetrics: SustainabilityMetricsAnalysis;
	innovationImpact: InnovationImpactAnalysis;
	knowledgeSharing: KnowledgeSharingAnalysis;
	capacityBuilding: CapacityBuildingAnalysis;
	publicTrust: PublicTrustAnalysis;
}

export interface AccountabilityMeasures {
	oversightMechanisms: OversightMechanismAnalysis;
	reportingFramework: ReportingFrameworkAnalysis;
	auditProgram: AuditProgramAnalysis;
	performanceMonitoring: PerformanceMonitoringAnalysis;
	correctionMechanisms: CorrectionMechanismAnalysis;
	sanctionsEnforcement: SanctionsEnforcementAnalysis;
	appealProcesses: AppealProcessAnalysis;
	whistleblowerProtection: WhistleblowerProtectionAnalysis;
	complaintsHandling: ComplaintsHandlingAnalysis;
	remedialActions: RemedialActionAnalysis;
	continuousImprovement: ContinuousImprovementAnalysis;
	externalOversight: ExternalOversightAnalysis;
}

export interface TransparencyRecommendations {
	immediate: RecommendationItem[];
	shortTerm: RecommendationItem[];
	longTerm: RecommendationItem[];
	strategic: RecommendationItem[];
	operational: RecommendationItem[];
	governance: RecommendationItem[];
	policy: RecommendationItem[];
	technology: RecommendationItem[];
	capacity: RecommendationItem[];
	stakeholder: RecommendationItem[];
	systemic: RecommendationItem[];
	innovation: RecommendationItem[];
}

export interface TransparencyAppendices {
	methodology: string;
	dataIntegrity: string;
	qualityAssurance: string;
	limitations: string[];
	assumptions: string[];
	dataSource: DataSourceDescription[];
	glossary: GlossaryTerm[];
	references: Reference[];
	acknowledgments: string[];
	contactInformation: ContactInformation[];
	feedbackChannels: FeedbackChannel[];
	supplementaryData: SupplementaryDataset[];
}

// Supporting Types

export type TransparencyScope = 
	| 'decisions'
	| 'partnerships'
	| 'finances'
	| 'operations'
	| 'governance'
	| 'ethics'
	| 'stakeholder_engagement'
	| 'public_interest'
	| 'accountability'
	| 'risk_management'
	| 'performance'
	| 'compliance';

export interface ReportingPeriod {
	startDate: Date;
	endDate: Date;
	reportingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'special';
	fiscalYear?: string;
	calendarYear?: number;
	specialEventReference?: string;
}

export interface DataQualityAssessment {
	completeness: number; // 0.0 to 1.0
	accuracy: number; // 0.0 to 1.0
	consistency: number; // 0.0 to 1.0
	timeliness: number; // 0.0 to 1.0
	validity: number; // 0.0 to 1.0
	overallScore: number; // 0.0 to 1.0
	dataGaps: string[];
	qualityIssues: string[];
	improvementActions: string[];
}

export interface ComplianceMetric {
	overallScore: number; // 0.0 to 1.0
	totalAssessments: number;
	compliantDecisions: number;
	nonCompliantDecisions: number;
	complianceRate: number; // 0.0 to 1.0
	trendDirection: 'improving' | 'stable' | 'declining';
	keyViolations: string[];
	improvementActions: string[];
}

export interface EthicalScoreMetric {
	overallScore: number; // 0.0 to 10.0
	averageScore: number;
	scoreDistribution: Record<string, number>;
	trendAnalysis: TrendAnalysis;
	benchmarkComparison: BenchmarkComparison;
	improvementAreas: string[];
	bestPerformingAreas: string[];
}

export interface TransparencyIndex {
	overallIndex: number; // 0.0 to 1.0
	componentScores: Record<string, number>;
	methodology: string;
	benchmarking: IndexBenchmarking;
	trendAnalysis: TrendAnalysis;
	improvementRecommendations: string[];
	internationalComparison: string[];
}

export interface Finding {
	findingId: string;
	category: 'positive' | 'concern' | 'recommendation' | 'risk' | 'opportunity';
	title: string;
	description: string;
	significance: 'low' | 'medium' | 'high' | 'critical';
	evidence: string[];
	implications: string[];
	recommendations: string[];
	responsible: string[];
	timeline: string;
	followUp: boolean;
}

export interface RecommendationItem {
	recommendationId: string;
	title: string;
	description: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	category: string;
	rationale: string;
	expectedBenefit: string;
	implementationSteps: string[];
	timeline: string;
	responsible: string[];
	resources: string[];
	riskMitigation: string[];
	successCriteria: string[];
	dependencies: string[];
}

export interface DataIntegrityVerification {
	verificationMethod: string;
	hashVerification: boolean;
	digitalSignature: boolean;
	auditTrail: boolean;
	dataLineage: boolean;
	qualityChecks: QualityCheck[];
	verificationResults: VerificationResult[];
	integrityScore: number; // 0.0 to 1.0
	lastVerified: Date;
	verifiedBy: string[];
}

export interface AccessControls {
	publicAccess: boolean;
	registrationRequired: boolean;
	accessLevels: AccessLevel[];
	downloadPermissions: DownloadPermission[];
	redistributionTerms: string;
	citationRequirements: string;
	dataProtection: DataProtectionMeasure[];
	privacyControls: PrivacyControl[];
}

export interface DistributionLog {
	distributionId: string;
	channel: 'website' | 'email' | 'api' | 'print' | 'media' | 'stakeholder_portal';
	recipients: string[];
	distributionDate: Date;
	format: string;
	accessCount: number;
	downloadCount: number;
	feedback: boolean;
	acknowledgment: boolean;
}

export interface ReportFeedback {
	feedbackId: string;
	source: 'stakeholder' | 'public' | 'expert' | 'oversight_body' | 'media';
	feedbackType: 'general' | 'specific' | 'technical' | 'policy' | 'process';
	rating: number; // 1 to 5
	comments: string;
	suggestions: string[];
	areas: string[];
	priority: 'low' | 'medium' | 'high';
	actionRequired: boolean;
	response: string;
	responseDate?: Date;
	status: 'received' | 'under_review' | 'responded' | 'implemented' | 'closed';
}

// Request/Response Types

export interface CreateTransparencyReportRequest {
	reportType: 'quarterly' | 'annual' | 'incident' | 'compliance' | 'thematic' | 'ad_hoc';
	reportingPeriod: ReportingPeriod;
	scope: TransparencyScope[];
	accessLevel: 'public' | 'stakeholder' | 'internal' | 'restricted';
	includeMetrics: boolean;
	customSections?: string[];
	requestedBy: string;
	specialInstructions?: string;
	deadline?: Date;
	distributionList?: string[];
}

export interface TransparencyReportQuery {
	reportId?: string;
	reportType?: 'quarterly' | 'annual' | 'incident' | 'compliance' | 'thematic' | 'ad_hoc';
	dateRange?: {
		startDate: Date;
		endDate: Date;
	};
	accessLevel?: 'public' | 'stakeholder' | 'internal' | 'restricted';
	status?: 'draft' | 'under_review' | 'approved' | 'published' | 'archived';
	scope?: TransparencyScope[];
	createdBy?: string;
	publiclyAvailable?: boolean;
	sortBy?: 'createdAt' | 'publishedAt' | 'reportType' | 'accessLevel';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

export interface TransparencyReportQueryResult {
	reports: TransparencyReport[];
	total: number;
	page: number;
	limit: number;
	summary: {
		publishedReports: number;
		publicReports: number;
		averageTransparencyScore: number;
		mostAccessedReport: string;
		latestReport: string;
	};
}

export interface TransparencyMetrics {
	reportingFrequency: Record<string, number>;
	accessibilityScore: number;
	publicEngagementLevel: number;
	stakeholderSatisfaction: number;
	informationQuality: number;
	responsivenessIndex: number;
	accountabilityScore: number;
	overallTransparencyRating: number;
	benchmarkPosition: string;
	improvementTrend: 'improving' | 'stable' | 'declining';
}

// Additional supporting interfaces (simplified for brevity)
export interface DecisionTypeAnalysis { count: number; complianceRate: number; averageScore: number; }
export interface TimelineAnalysis { averageProcessingTime: number; delays: number; }
export interface StakeholderInvolvementAnalysis { engagementRate: number; satisfactionScore: number; }
export interface PublicConsultationAnalysis { consultations: number; participationRate: number; }
export interface DecisionComplianceMetrics { overallRate: number; byCategory: Record<string, number>; }
export interface AuditResultsSummary { totalAudits: number; findings: number; compliance: number; }
export interface AppealsChallengesAnalysis { total: number; successful: number; processing: number; }
export interface ImplementationTracking { onTime: number; delayed: number; cancelled: number; }
export interface OutcomeAssessment { successful: number; mixed: number; unsuccessful: number; }
export interface LessonLearned { lesson: string; application: string; impact: string; }
export interface BestPractice { practice: string; benefits: string; scalability: string; }
export interface ProcessImprovement { improvement: string; impact: string; implementation: string; }
export interface PartnershipTypeAnalysis { count: number; performance: number; risks: number; }
export interface EthicalConcernAnalysis { total: number; resolved: number; ongoing: number; }
export interface PartnershipRiskAnalysis { assessed: number; highRisk: number; mitigated: number; }
export interface PartnershipComplianceAnalysis { compliant: number; violations: number; rate: number; }
export interface PartnershipPerformanceAnalysis { performing: number; underperforming: number; rating: number; }
export interface PartnershipFinancialAnalysis { value: number; savings: number; roi: number; }
export interface PartnershipStakeholderFeedback { positive: number; negative: number; neutral: number; }
export interface BenefitsRealizationAnalysis { realized: number; partial: number; unrealized: number; }
export interface DisputeResolutionAnalysis { total: number; resolved: number; pending: number; }
export interface TerminationAnalysis { total: number; planned: number; premature: number; }
export interface SignificantChange { change: string; impact: string; implications: string[]; }
export interface Trend { trend: string; direction: string; significance: string; }
export interface PerformanceMetric { metric: string; target: number; actual: number; variance: number; }
export interface RiskProfileSummary { level: string; key: string[]; mitigation: string[]; }
export interface ImprovementArea { area: string; priority: string; actions: string[]; }
export interface Achievement { achievement: string; impact: string; recognition: string; }
export interface EthicalRiskCategoryAnalysis { count: number; severity: string; trend: string; }
export interface StakeholderImpactMetrics { affected: number; positive: number; mitigation: number; }
export interface PublicInterestMetrics { alignment: number; benefit: number; concerns: number; }
export interface EthicalFrameworkCompliance { rate: number; gaps: string[]; improvements: string[]; }
export interface ViolationAnalysis { total: number; byType: Record<string, number>; trends: string[]; }
export interface MitigationEffectivenessAnalysis { effective: number; partial: number; ineffective: number; }
export interface PreventiveActionAnalysis { implemented: number; planned: number; effectiveness: number; }
export interface EthicalTrainingMetrics { coverage: number; completion: number; effectiveness: number; }
export interface EthicalCultureAssessment { score: number; strengths: string[]; improvements: string[]; }
export interface TrendAnalysis { direction: string; magnitude: number; significance: string; }
export interface BenchmarkComparison { position: string; gap: number; leaders: string[]; }
export interface IndexBenchmarking { rank: number; score: number; peers: string[]; }
export interface QualityCheck { check: string; result: boolean; issues: string[]; }
export interface VerificationResult { method: string; result: boolean; confidence: number; }
export interface AccessLevel { level: string; permissions: string[]; users: string[]; }
export interface DownloadPermission { format: string; allowed: boolean; restrictions: string[]; }
export interface DataProtectionMeasure { measure: string; implementation: string; effectiveness: string; }
export interface PrivacyControl { control: string; purpose: string; impact: string; }
export interface DataSourceDescription { source: string; description: string; quality: string; }
export interface GlossaryTerm { term: string; definition: string; context: string; }
export interface Reference { title: string; author: string; date: Date; url?: string; }
export interface ContactInformation { role: string; contact: string; purpose: string; }
export interface FeedbackChannel { channel: string; purpose: string; process: string; }
export interface SupplementaryDataset { name: string; description: string; format: string; access: string; }
export interface BudgetOverview { total: number; allocated: number; spent: number; variance: number; }
export interface ExpenditureAnalysis { byCategory: Record<string, number>; trends: string[]; }
export interface RevenueAnalysis { sources: Record<string, number>; trends: string[]; }
export interface ContractualCommitmentsAnalysis { total: number; fulfilled: number; pending: number; }
export interface CostBenefitAnalysis { costs: number; benefits: number; ratio: number; }
export interface FinancialControlsAssessment { strength: string; gaps: string[]; recommendations: string[]; }
export interface FinancialAuditFindings { findings: number; material: number; resolved: number; }
export interface ProcurementTransparency { processes: string[]; competition: number; transparency: number; }
export interface GrantFundingAnalysis { received: number; utilized: number; compliance: number; }
export interface InvestmentPortfolioAnalysis { value: number; performance: number; risk: string; }
export interface FinancialRiskManagement { risks: string[]; mitigation: string[]; monitoring: string[]; }
export interface FinancialPerformanceIndicators { indicators: Record<string, number>; trends: string[]; }

// Additional missing analysis types
export interface PublicEngagementMetric { score: number; participation: number; reach: number; trend: string; }
export interface SatisfactionMetric { score: number; responses: number; positive: number; negative: number; }
export interface GovernanceStructureAnalysis { effectiveness: number; structure: string; gaps: string[]; }
export interface DecisionMakingAnalysis { efficiency: number; transparency: number; participation: number; }
export interface AccountabilityMechanismAnalysis { coverage: number; effectiveness: number; gaps: string[]; }
export interface PolicyFrameworkAnalysis { completeness: number; currency: number; alignment: number; }
export interface ComplianceOversightAnalysis { coverage: number; findings: number; resolved: number; }
export interface GovernanceRiskManagement { risks: string[]; controls: string[]; effectiveness: number; }
export interface PerformanceManagementAnalysis { systems: string[]; effectiveness: number; improvements: string[]; }
export interface StakeholderGovernanceAnalysis { representation: number; voice: number; influence: number; }
export interface BoardEffectivenessAnalysis { score: number; attendance: number; decisions: number; }
export interface CommitteeFunctioningAnalysis { committees: number; effectiveness: Record<string, number>; }
export interface ConflictOfInterestAnalysis { declarations: number; managed: number; violations: number; }
export interface TransparencyMechanismAnalysis { mechanisms: string[]; effectiveness: number; gaps: string[]; }
export interface StakeholderMappingAnalysis { groups: number; engagement: Record<string, number>; }
export interface EngagementActivityAnalysis { activities: number; participation: number; outcomes: string[]; }
export interface StakeholderFeedbackAnalysis { received: number; addressed: number; satisfaction: number; }
export interface SatisfactionSurveyAnalysis { surveys: number; responses: number; score: number; }
export interface CommunityOutreachAnalysis { events: number; reach: number; impact: string; }
export interface DigitalEngagementAnalysis { platforms: string[]; reach: number; engagement: number; }
export interface AccessibilityMeasureAnalysis { measures: string[]; compliance: number; gaps: string[]; }
export interface InclusionInitiativeAnalysis { initiatives: number; coverage: number; impact: string; }
export interface CulturalSensitivityAnalysis { score: number; training: number; incidents: number; }
export interface ResponsivenessAnalysis { averageTime: number; satisfaction: number; improvements: string[]; }
export interface GrievanceMechanismAnalysis { mechanisms: string[]; cases: number; resolved: number; }
export interface PublicBenefitAnalysis { benefits: string[]; value: number; reach: number; }
export interface SocialImpactAnalysis { positive: number; negative: number; net: number; areas: string[]; }
export interface EnvironmentalImpactAnalysis { footprint: number; reduction: number; initiatives: string[]; }
export interface EconomicImpactAnalysis { direct: number; indirect: number; total: number; jobs: number; }
export interface HumanRightsImpactAnalysis { assessments: number; risks: string[]; actions: string[]; }
export interface EquityConsiderationAnalysis { score: number; gaps: string[]; actions: string[]; }
export interface AccessibilityAssessmentAnalysis { compliance: number; barriers: string[]; improvements: string[]; }
export interface SustainabilityMetricsAnalysis { score: number; targets: Record<string, number>; progress: number; }
export interface InnovationImpactAnalysis { innovations: number; value: number; adoption: number; }
export interface KnowledgeSharingAnalysis { activities: number; reach: number; impact: string; }
export interface CapacityBuildingAnalysis { programs: number; participants: number; outcomes: string[]; }
export interface PublicTrustAnalysis { score: number; trend: string; factors: string[]; }
export interface OversightMechanismAnalysis { mechanisms: string[]; effectiveness: number; coverage: number; }
export interface ReportingFrameworkAnalysis { frameworks: string[]; compliance: number; gaps: string[]; }
export interface AuditProgramAnalysis { audits: number; coverage: number; findings: number; }
export interface PerformanceMonitoringAnalysis { indicators: number; tracking: number; reporting: number; }
export interface CorrectionMechanismAnalysis { mechanisms: string[]; used: number; effectiveness: number; }
export interface SanctionsEnforcementAnalysis { cases: number; enforced: number; outcomes: string[]; }
export interface AppealProcessAnalysis { processes: string[]; cases: number; success: number; }
export interface WhistleblowerProtectionAnalysis { reports: number; investigated: number; protections: string[]; }
export interface ComplaintsHandlingAnalysis { received: number; resolved: number; averageTime: number; }
export interface RemedialActionAnalysis { actions: number; implemented: number; effectiveness: number; }
export interface ContinuousImprovementAnalysis { initiatives: number; impact: string; ongoing: number; }
export interface ExternalOversightAnalysis { bodies: string[]; reviews: number; findings: number; }
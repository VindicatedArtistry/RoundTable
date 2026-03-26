/**
 * Partnership Type Definitions
 * Types for partnership agreements and management in TheRoundTable AI Council
 */

export interface PartnershipAgreement {
	agreementId: string;
	partnerName: string;
	partnerType: 'corporate' | 'nonprofit' | 'government' | 'individual' | 'academic';
	agreementType: 'strategic' | 'operational' | 'financial' | 'research' | 'advocacy';
	status: 'draft' | 'under_review' | 'approved' | 'active' | 'suspended' | 'terminated' | 'expired';
	terms: PartnershipTerms;
	ethicalConsiderations: string[];
	constitutionalAlignment: ConstitutionalAlignment;
	riskAssessment: PartnershipRiskAssessment;
	performanceMetrics: PartnershipMetric[];
	complianceRequirements: ComplianceRequirement[];
	stakeholderImpact: StakeholderImpactAssessment[];
	financialTerms: FinancialTerms;
	intellectualProperty: IntellectualPropertyTerms;
	dataSharing: DataSharingTerms;
	terminationClause: TerminationClause;
	disputeResolution: DisputeResolution;
	governanceStructure: GovernanceStructure;
	reportingRequirements: ReportingRequirement[];
	reviewSchedule: ReviewSchedule;
	amendments: PartnershipAmendment[];
	attachments: PartnershipDocument[];
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	lastReviewedAt?: Date;
	nextReviewDate?: Date;
	effectiveDate: Date;
	expirationDate?: Date;
}

export interface PartnershipTerms {
	duration: string;
	scope: string;
	objectives: string[];
	deliverables: Deliverable[];
	obligations: PartnershipObligation[];
	compensation?: CompensationStructure;
	exclusivity: boolean;
	exclusivityScope?: string[];
	territorialRestrictions?: string[];
	performanceStandards: PerformanceStandard[];
	qualityRequirements: QualityRequirement[];
	communicationProtocols: CommunicationProtocol[];
	meetingRequirements: MeetingRequirement[];
	confidentialityTerms: ConfidentialityTerms;
	nonCompeteClause?: NonCompeteClause;
}

export interface ConstitutionalAlignment {
	alignmentScore: number; // 0.0 to 1.0
	principles: string[];
	potentialConflicts: ConstitutionalConflict[];
	mitigationStrategies: string[];
	reviewNotes: string;
	approvalRequired: boolean;
	reviewedBy: string[];
	reviewDate: Date;
	complianceCertification: boolean;
}

export interface PartnershipRiskAssessment {
	assessmentId: string;
	overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
	riskCategories: PartnershipRiskCategory[];
	operationalRisks: RiskItem[];
	reputationalRisks: RiskItem[];
	financialRisks: RiskItem[];
	legalRisks: RiskItem[];
	ethicalRisks: RiskItem[];
	technicalRisks: RiskItem[];
	strategicRisks: RiskItem[];
	mitigationPlan: RiskMitigationPlan;
	monitoringPlan: RiskMonitoringPlan;
	contingencyPlans: ContingencyPlan[];
	assessedAt: Date;
	assessedBy: string[];
	nextAssessmentDate: Date;
}

export interface PartnershipMetric {
	metricId: string;
	name: string;
	description: string;
	category: 'performance' | 'financial' | 'operational' | 'strategic' | 'compliance';
	type: 'quantitative' | 'qualitative' | 'boolean';
	target: string;
	measurement: string;
	frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
	responsible: string[];
	reportingFormat: string;
	threshold: {
		green: string;
		yellow: string;
		red: string;
	};
	currentValue?: string;
	trend?: 'improving' | 'stable' | 'declining';
	lastUpdated?: Date;
}

export interface ComplianceRequirement {
	requirementId: string;
	category: 'legal' | 'regulatory' | 'ethical' | 'contractual' | 'internal_policy';
	description: string;
	applicableRegulations: string[];
	complianceLevel: 'mandatory' | 'recommended' | 'optional';
	verificationMethod: string;
	frequency: string;
	responsible: string[];
	documentation: string[];
	auditTrail: boolean;
	penalties: string[];
	lastVerified?: Date;
	nextVerification?: Date;
	status: 'compliant' | 'non_compliant' | 'under_review' | 'not_applicable';
}

export interface StakeholderImpactAssessment {
	stakeholderId: string;
	stakeholderGroup: string;
	impactType: 'positive' | 'negative' | 'neutral' | 'mixed';
	impactAreas: string[];
	severity: 'low' | 'medium' | 'high';
	probability: 'low' | 'medium' | 'high';
	description: string;
	mitigationMeasures: string[];
	engagementPlan: string;
	feedbackMechanisms: string[];
	consultationRequired: boolean;
	consentObtained: boolean;
}

export interface FinancialTerms {
	budgetAllocation: number;
	currency: string;
	paymentStructure: PaymentStructure;
	costSharing: CostSharingAgreement[];
	revenueSharing: RevenueSharingAgreement[];
	expenseCategories: ExpenseCategory[];
	financialReporting: FinancialReportingRequirement[];
	auditRequirements: AuditRequirement[];
	taxation: TaxationTerms;
	insurance: InsuranceRequirement[];
	bonusStructure?: BonusStructure[];
	penaltyClause?: PenaltyClause[];
}

export interface IntellectualPropertyTerms {
	ownership: 'partner' | 'council' | 'shared' | 'separate';
	licensingTerms: LicensingAgreement[];
	patentRights: PatentRights;
	copyrightTerms: CopyrightTerms;
	trademarkUsage: TrademarkUsage[];
	tradeSecrets: TradeSecretProtection;
	derivativeWorks: DerivativeWorkTerms;
	publicationRights: PublicationRights;
	attributionRequirements: string[];
	indemnificationClause: IndemnificationClause;
}

export interface DataSharingTerms {
	dataCategories: DataCategory[];
	sharingScope: 'full' | 'limited' | 'restricted' | 'none';
	dataGovernance: DataGovernanceFramework;
	privacyProtections: PrivacyProtection[];
	securityRequirements: SecurityRequirement[];
	dataRetention: DataRetentionPolicy;
	dataDestruction: DataDestructionPolicy;
	crossBorderTransfer: CrossBorderTransferTerms;
	consentManagement: ConsentManagementFramework;
	breachNotification: BreachNotificationProcedure;
	auditRights: DataAuditRights;
}

export interface TerminationClause {
	terminationReasons: string[];
	noticePeriod: string;
	terminationProcedure: string[];
	assetTransition: AssetTransitionPlan;
	dataHandling: DataHandlingProcedure;
	intellectualPropertyReturn: IPReturnProcedure;
	financialSettlement: FinancialSettlementTerms;
	confidentialityPostTermination: PostTerminationConfidentiality;
	nonSolicitationPeriod?: string;
	survivingClauses: string[];
	disputeHandling: PostTerminationDisputeHandling;
}

export interface DisputeResolution {
	mechanism: 'negotiation' | 'mediation' | 'arbitration' | 'litigation' | 'hybrid';
	escalationPath: EscalationStep[];
	timeline: string;
	venue: string;
	applicableLaw: string;
	costs: string;
	confidentiality: boolean;
	arbitrators: ArbitratorRequirements;
	appealRights: AppealRights;
	interimMeasures: InterimMeasures;
}

export interface GovernanceStructure {
	governanceModel: 'joint_committee' | 'steering_committee' | 'advisory_board' | 'project_management_office';
	committees: GovernanceCommittee[];
	decisionMaking: DecisionMakingProcess;
	reportingStructure: ReportingStructure;
	communicationChannels: CommunicationChannel[];
	meetingSchedule: MeetingSchedule;
	documentManagement: DocumentManagement;
	changeManagement: ChangeManagementProcess;
}

export interface ReportingRequirement {
	reportId: string;
	reportType: 'progress' | 'financial' | 'compliance' | 'risk' | 'performance' | 'milestone';
	frequency: string;
	format: 'written' | 'presentation' | 'dashboard' | 'meeting' | 'automated';
	recipients: string[];
	content: string[];
	template?: string;
	deadline: string;
	responsible: string[];
	approvalRequired: boolean;
	distribution: string[];
}

export interface ReviewSchedule {
	reviewType: 'performance' | 'compliance' | 'strategic' | 'financial' | 'risk' | 'comprehensive';
	frequency: string;
	participants: string[];
	agenda: string[];
	deliverables: string[];
	criteria: string[];
	timeline: string;
	followUpActions: string[];
	documentationRequirements: string[];
}

export interface PartnershipAmendment {
	amendmentId: string;
	amendmentType: 'terms' | 'scope' | 'duration' | 'financial' | 'governance' | 'compliance';
	description: string;
	rationale: string;
	changes: AmendmentChange[];
	approvalProcess: AmendmentApprovalProcess;
	effectiveDate: Date;
	impact: AmendmentImpact;
	stakeholderConsultation: StakeholderConsultation;
	legalReview: boolean;
	createdAt: Date;
	approvedAt?: Date;
	status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'implemented';
}

export interface PartnershipDocument {
	documentId: string;
	name: string;
	type: 'agreement' | 'amendment' | 'schedule' | 'specification' | 'report' | 'certificate';
	version: string;
	description: string;
	filePath: string;
	fileSize: number;
	fileType: string;
	checksum: string;
	confidentiality: 'public' | 'confidential' | 'restricted' | 'internal';
	accessControls: string[];
	retentionPeriod: string;
	createdAt: Date;
	createdBy: string;
	lastModified: Date;
	status: 'draft' | 'review' | 'approved' | 'active' | 'archived';
}

// Supporting Types

export type PartnershipRiskCategory = 
	| 'operational'
	| 'reputational' 
	| 'financial'
	| 'legal'
	| 'ethical'
	| 'technical'
	| 'strategic'
	| 'regulatory'
	| 'market'
	| 'political';

export interface Deliverable {
	deliverableId: string;
	name: string;
	description: string;
	responsible: string;
	deadline: Date;
	dependencies: string[];
	acceptanceCriteria: string[];
	status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
}

export interface PartnershipObligation {
	obligationId: string;
	party: 'partner' | 'council' | 'both';
	category: 'performance' | 'financial' | 'legal' | 'ethical' | 'operational';
	description: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	timeline: string;
	verificationMethod: string;
	consequences: string[];
}

export interface CompensationStructure {
	type: 'fixed' | 'variable' | 'hybrid' | 'performance_based';
	amount: number;
	currency: string;
	schedule: PaymentSchedule[];
	conditions: string[];
	adjustmentMechanism?: string;
}

export interface PaymentSchedule {
	milestone: string;
	amount: number;
	dueDate: Date;
	conditions: string[];
	approved: boolean;
}

export interface ConstitutionalConflict {
	conflictId: string;
	principle: string;
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	resolution: string;
	approved: boolean;
}

export interface RiskItem {
	riskId: string;
	description: string;
	probability: 'low' | 'medium' | 'high';
	impact: 'low' | 'medium' | 'high' | 'critical';
	riskScore: number;
	mitigationStrategies: string[];
	responsible: string[];
	status: 'identified' | 'mitigated' | 'accepted' | 'transferred' | 'avoided';
}

export interface CreatePartnershipRequest {
	partnerName: string;
	partnerType: 'corporate' | 'nonprofit' | 'government' | 'individual' | 'academic';
	agreementType: 'strategic' | 'operational' | 'financial' | 'research' | 'advocacy';
	terms: Partial<PartnershipTerms>;
	ethicalConsiderations: string[];
	createdBy: string;
	effectiveDate?: Date;
	expirationDate?: Date;
}

export interface UpdatePartnershipRequest {
	agreementId: string;
	updates: Partial<PartnershipAgreement>;
	reason: string;
	updatedBy: string;
	requiresApproval?: boolean;
}

export interface PartnershipQuery {
	agreementId?: string;
	partnerName?: string;
	partnerType?: 'corporate' | 'nonprofit' | 'government' | 'individual' | 'academic';
	agreementType?: 'strategic' | 'operational' | 'financial' | 'research' | 'advocacy';
	status?: 'draft' | 'under_review' | 'approved' | 'active' | 'suspended' | 'terminated' | 'expired';
	effectiveDateRange?: {
		startDate: Date;
		endDate: Date;
	};
	expiringWithin?: string; // e.g., "30 days"
	riskLevel?: 'low' | 'medium' | 'high' | 'critical';
	complianceStatus?: 'compliant' | 'non_compliant' | 'under_review';
	sortBy?: 'createdAt' | 'effectiveDate' | 'expirationDate' | 'riskLevel';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

export interface PartnershipQueryResult {
	partnerships: PartnershipAgreement[];
	total: number;
	page: number;
	limit: number;
	summary: {
		activePartnerships: number;
		expiringWithin30Days: number;
		highRiskPartnerships: number;
		totalValue: number;
		complianceRate: number;
	};
}

// Additional supporting interfaces (simplified for brevity)
export interface PerformanceStandard { standardId: string; description: string; target: string; }
export interface QualityRequirement { requirementId: string; description: string; criteria: string[]; }
export interface CommunicationProtocol { protocolId: string; type: string; frequency: string; }
export interface MeetingRequirement { frequency: string; participants: string[]; agenda: string[]; }
export interface ConfidentialityTerms { level: string; scope: string[]; duration: string; }
export interface NonCompeteClause { scope: string[]; duration: string; territory: string[]; }
export interface RiskMitigationPlan { planId: string; strategies: string[]; timeline: string; }
export interface RiskMonitoringPlan { planId: string; metrics: string[]; frequency: string; }
export interface ContingencyPlan { planId: string; scenario: string; actions: string[]; }
export interface PaymentStructure { type: string; terms: string[]; schedule: string; }
export interface CostSharingAgreement { category: string; split: Record<string, number>; }
export interface RevenueSharingAgreement { category: string; split: Record<string, number>; }
export interface ExpenseCategory { category: string; budget: number; responsible: string; }
export interface FinancialReportingRequirement { frequency: string; format: string; recipients: string[]; }
export interface AuditRequirement { frequency: string; scope: string[]; auditor: string; }
export interface TaxationTerms { responsibility: string; jurisdiction: string; }
export interface InsuranceRequirement { type: string; coverage: number; provider: string; }
export interface BonusStructure { trigger: string; amount: number; }
export interface PenaltyClause { violation: string; penalty: string; }
export interface LicensingAgreement { scope: string; terms: string[]; royalties?: number; }
export interface PatentRights { ownership: string; licensing: string[]; }
export interface CopyrightTerms { ownership: string; usage: string[]; }
export interface TrademarkUsage { mark: string; usage: string[]; restrictions: string[]; }
export interface TradeSecretProtection { scope: string[]; protections: string[]; }
export interface DerivativeWorkTerms { ownership: string; licensing: string[]; }
export interface PublicationRights { rights: string[]; restrictions: string[]; }
export interface IndemnificationClause { scope: string[]; limitations: string[]; }
export interface DataCategory { category: string; sensitivity: string; purpose: string[]; }
export interface DataGovernanceFramework { framework: string; roles: string[]; processes: string[]; }
export interface PrivacyProtection { protection: string; implementation: string[]; }
export interface SecurityRequirement { requirement: string; standard: string; verification: string; }
export interface DataRetentionPolicy { category: string; period: string; conditions: string[]; }
export interface DataDestructionPolicy { triggers: string[]; methods: string[]; verification: string; }
export interface CrossBorderTransferTerms { allowed: boolean; restrictions: string[]; safeguards: string[]; }
export interface ConsentManagementFramework { framework: string; processes: string[]; }
export interface BreachNotificationProcedure { timeline: string; recipients: string[]; process: string[]; }
export interface DataAuditRights { frequency: string; scope: string[]; access: string[]; }
export interface AssetTransitionPlan { assets: string[]; timeline: string; process: string[]; }
export interface DataHandlingProcedure { data: string[]; process: string[]; timeline: string; }
export interface IPReturnProcedure { items: string[]; process: string[]; timeline: string; }
export interface FinancialSettlementTerms { process: string[]; timeline: string; disputes: string[]; }
export interface PostTerminationConfidentiality { duration: string; scope: string[]; }
export interface PostTerminationDisputeHandling { mechanism: string; timeline: string; }
export interface EscalationStep { step: string; timeline: string; parties: string[]; }
export interface ArbitratorRequirements { qualifications: string[]; selection: string; }
export interface AppealRights { available: boolean; process: string[]; timeline: string; }
export interface InterimMeasures { available: boolean; conditions: string[]; }
export interface GovernanceCommittee { name: string; members: string[]; responsibilities: string[]; }
export interface DecisionMakingProcess { process: string; voting: string; quorum: string; }
export interface ReportingStructure { hierarchy: string[]; frequency: string; }
export interface CommunicationChannel { channel: string; purpose: string; access: string[]; }
export interface MeetingSchedule { frequency: string; format: string; participants: string[]; }
export interface DocumentManagement { system: string; access: string[]; retention: string; }
export interface ChangeManagementProcess { process: string[]; approval: string; documentation: string; }
export interface AmendmentChange { field: string; oldValue: string; newValue: string; }
export interface AmendmentApprovalProcess { steps: string[]; approvers: string[]; timeline: string; }
export interface AmendmentImpact { areas: string[]; severity: string; mitigation: string[]; }
export interface StakeholderConsultation { required: boolean; stakeholders: string[]; process: string; }
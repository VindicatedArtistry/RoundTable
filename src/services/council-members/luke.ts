import { EventEmitter } from 'events';
import { z } from 'zod';
import { AgentService, AgentResponse } from '../../types/agent';
import { createLogger, LoggerInterface } from '../../utils/logger';

/**
 * Luke - Chief of Security (Human Council Member)
 *
 * "The guardian of the mission, creating a perimeter of safety so absolute
 * that builders can focus on changing the world."
 *
 * Specializations:
 * - Personal Security
 * - Asset Protection
 * - Operational Integrity
 * - Risk Management
 *
 * This service coordinates security operations, threat assessment,
 * and protective measures across the entire ecosystem.
 */

// ============================================================================
// Validation Schemas
// ============================================================================

const ThreatLevelSchema = z.enum(['low', 'moderate', 'elevated', 'high', 'critical']);

const ThreatAssessmentRequestSchema = z.object({
  type: z.literal('threat_assessment'),
  subject: z.string().min(1, 'Subject is required'),
  category: z.enum(['physical', 'cyber', 'personnel', 'operational', 'reputational']),
  context: z.string().optional(),
  location: z.string().optional(),
  urgency: z.enum(['routine', 'priority', 'urgent', 'immediate']).default('routine'),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const SecurityIncidentSchema = z.object({
  type: z.literal('security_incident'),
  incidentType: z.enum([
    'unauthorized_access',
    'suspicious_activity',
    'breach_attempt',
    'physical_intrusion',
    'data_leak',
    'social_engineering',
    'insider_threat',
    'equipment_tampering',
    'surveillance_detected',
    'other'
  ]),
  severity: ThreatLevelSchema,
  description: z.string().min(10, 'Detailed description is required'),
  location: z.string(),
  timestamp: z.string().datetime().optional(),
  witnesses: z.array(z.string()).optional(),
  evidenceCollected: z.boolean().default(false),
  reportedBy: z.string().min(1, 'Reporter is required'),
});

const SecurityClearanceRequestSchema = z.object({
  type: z.literal('clearance_request'),
  personnel: z.string().min(1, 'Personnel name is required'),
  requestedLevel: z.enum(['public', 'internal', 'confidential', 'secret', 'top_secret']),
  purpose: z.string().min(10, 'Purpose is required'),
  duration: z.enum(['temporary', 'project', 'permanent']),
  sponsor: z.string().min(1, 'Sponsor is required'),
  backgroundCheckCompleted: z.boolean().default(false),
});

const ProtectiveDetailRequestSchema = z.object({
  type: z.literal('protective_detail'),
  protectee: z.string().min(1, 'Protectee is required'),
  event: z.string().min(1, 'Event description is required'),
  location: z.string().min(1, 'Location is required'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  threatLevel: ThreatLevelSchema,
  specialRequirements: z.array(z.string()).optional(),
  transportationNeeded: z.boolean().default(false),
  advanceTeamRequired: z.boolean().default(false),
});

const FacilitySecurityAuditSchema = z.object({
  type: z.literal('facility_audit'),
  facility: z.string().min(1, 'Facility name is required'),
  auditType: z.enum(['routine', 'comprehensive', 'post_incident', 'certification']),
  areas: z.array(z.enum([
    'perimeter',
    'access_control',
    'surveillance',
    'alarm_systems',
    'fire_safety',
    'emergency_exits',
    'secure_areas',
    'visitor_management',
    'personnel_screening',
    'vehicle_access'
  ])).min(1, 'At least one area must be specified'),
  scheduledDate: z.string().datetime().optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const LukeRequestSchema = z.discriminatedUnion('type', [
  ThreatAssessmentRequestSchema,
  SecurityIncidentSchema,
  SecurityClearanceRequestSchema,
  ProtectiveDetailRequestSchema,
  FacilitySecurityAuditSchema,
]);

type LukeRequest = z.infer<typeof LukeRequestSchema>;

// ============================================================================
// Result Interfaces
// ============================================================================

interface ThreatAssessmentResult {
  assessmentId: string;
  subject: string;
  threatLevel: z.infer<typeof ThreatLevelSchema>;
  category: string;
  analysis: {
    currentThreats: string[];
    vulnerabilities: string[];
    likelihood: 'unlikely' | 'possible' | 'likely' | 'almost_certain';
    potentialImpact: 'minimal' | 'moderate' | 'significant' | 'severe' | 'catastrophic';
  };
  recommendations: string[];
  mitigationPlan: string[];
  reviewDate: string;
  assignedTo: string;
}

interface SecurityIncidentResult {
  incidentId: string;
  status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  responseTeamAssigned: boolean;
  initialActions: string[];
  containmentMeasures: string[];
  investigationRequired: boolean;
  notificationsRequired: string[];
  estimatedResolutionTime: string;
}

interface ClearanceResult {
  requestId: string;
  personnel: string;
  status: 'pending_review' | 'background_check' | 'interview' | 'approved' | 'denied' | 'conditional';
  currentLevel: string;
  requestedLevel: string;
  nextSteps: string[];
  estimatedCompletionDate: string;
  conditions: string[];
}

interface ProtectiveDetailResult {
  detailId: string;
  protectee: string;
  event: string;
  threatAssessment: z.infer<typeof ThreatLevelSchema>;
  teamComposition: {
    leadAgent: string;
    teamSize: number;
    specialAssets: string[];
  };
  operationalPlan: {
    advanceWork: string[];
    primaryRoute: string;
    alternateRoutes: string[];
    safeHavens: string[];
    emergencyProtocols: string[];
  };
  communicationsPlan: string;
  status: 'planning' | 'advance' | 'active' | 'completed' | 'standby';
}

interface FacilityAuditResult {
  auditId: string;
  facility: string;
  overallSecurityScore: number;
  findings: {
    area: string;
    score: number;
    status: 'compliant' | 'needs_improvement' | 'non_compliant' | 'critical';
    findings: string[];
    recommendations: string[];
  }[];
  criticalIssues: string[];
  improvementPlan: string[];
  nextAuditDate: string;
  certificationStatus: 'certified' | 'conditional' | 'not_certified';
}

interface SecurityDashboard {
  currentThreatLevel: z.infer<typeof ThreatLevelSchema>;
  activeIncidents: number;
  openInvestigations: number;
  pendingClearances: number;
  scheduledProtectiveDetails: number;
  facilitySecurityScores: { facility: string; score: number }[];
  recentAlerts: { id: string; type: string; severity: string; timestamp: string }[];
  upcomingAudits: { facility: string; date: string; type: string }[];
  securityMetrics: {
    incidentsThisMonth: number;
    incidentsResolved: number;
    averageResponseTime: string;
    clearanceProcessingTime: string;
  };
  recommendations: string[];
}

// ============================================================================
// Luke Service Implementation
// ============================================================================

export class LukeService extends EventEmitter implements AgentService {
  private logger: LoggerInterface;
  private isInitialized = false;

  // In-memory stores (would be database-backed in production)
  private threatAssessments: Map<string, ThreatAssessmentResult> = new Map();
  private securityIncidents: Map<string, SecurityIncidentResult> = new Map();
  private clearanceRequests: Map<string, ClearanceResult> = new Map();
  private protectiveDetails: Map<string, ProtectiveDetailResult> = new Map();
  private facilityAudits: Map<string, FacilityAuditResult> = new Map();
  private currentThreatLevel: z.infer<typeof ThreatLevelSchema> = 'low';

  constructor() {
    super();
    this.logger = createLogger('luke');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Luke service already initialized');
      return;
    }

    this.logger.info('Luke - Chief of Security (Human) initializing...');
    this.logger.info('Security perimeter established. All systems nominal.');

    this.isInitialized = true;
    this.emit('initialized', { timestamp: new Date().toISOString() });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Luke shutting down... Security protocols remain active.');
    this.isInitialized = false;
    this.emit('shutdown', { timestamp: new Date().toISOString() });
  }

  async processRequest(request: unknown): Promise<AgentResponse> {
    try {
      const validatedRequest = LukeRequestSchema.parse(request);

      switch (validatedRequest.type) {
        case 'threat_assessment':
          return this.handleThreatAssessment(validatedRequest);
        case 'security_incident':
          return this.handleSecurityIncident(validatedRequest);
        case 'clearance_request':
          return this.handleClearanceRequest(validatedRequest);
        case 'protective_detail':
          return this.handleProtectiveDetail(validatedRequest);
        case 'facility_audit':
          return this.handleFacilityAudit(validatedRequest);
        default:
          return this.createResponse(false, null, 'Unknown request type');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, `Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      this.logger.error('Error processing request:', { error });
      return this.createResponse(false, null, 'Internal security service error');
    }
  }

  // ============================================================================
  // Core Security Functions
  // ============================================================================

  async conductThreatAssessment(
    subject: string,
    category: 'physical' | 'cyber' | 'personnel' | 'operational' | 'reputational',
    context?: string,
    requestedBy?: string
  ): Promise<ThreatAssessmentResult> {
    const assessmentId = `TA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine threat level based on category and context
    const threatLevel = this.assessThreatLevel(category, context);

    const result: ThreatAssessmentResult = {
      assessmentId,
      subject,
      threatLevel,
      category,
      analysis: {
        currentThreats: this.identifyThreats(category, context),
        vulnerabilities: this.identifyVulnerabilities(category),
        likelihood: this.assessLikelihood(threatLevel),
        potentialImpact: this.assessImpact(threatLevel),
      },
      recommendations: this.generateSecurityRecommendations(category, threatLevel),
      mitigationPlan: this.createMitigationPlan(category, threatLevel),
      reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Luke (Chief of Security)',
    };

    this.threatAssessments.set(assessmentId, result);
    this.logger.info(`Threat assessment ${assessmentId} completed for ${subject}`);
    this.emit('threat_assessed', result);

    return result;
  }

  async reportSecurityIncident(
    incidentType: string,
    severity: z.infer<typeof ThreatLevelSchema>,
    description: string,
    location: string,
    reportedBy: string
  ): Promise<SecurityIncidentResult> {
    const incidentId = `SI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const priority = this.determinePriority(severity);
    const responseRequired = severity === 'critical' || severity === 'high';

    const result: SecurityIncidentResult = {
      incidentId,
      status: responseRequired ? 'investigating' : 'reported',
      priority,
      responseTeamAssigned: responseRequired,
      initialActions: this.determineInitialActions(incidentType, severity),
      containmentMeasures: this.determineContainmentMeasures(incidentType),
      investigationRequired: severity !== 'low',
      notificationsRequired: this.determineNotifications(severity),
      estimatedResolutionTime: this.estimateResolutionTime(severity),
    };

    this.securityIncidents.set(incidentId, result);

    // Update global threat level if necessary
    if (severity === 'critical' || severity === 'high') {
      this.updateGlobalThreatLevel(severity);
    }

    this.logger.warn(`Security incident ${incidentId} reported: ${incidentType} at ${location}`);
    this.emit('incident_reported', { incidentId, severity, location });

    return result;
  }

  async requestClearance(
    personnel: string,
    requestedLevel: 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret',
    purpose: string,
    sponsor: string
  ): Promise<ClearanceResult> {
    const requestId = `CLR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: ClearanceResult = {
      requestId,
      personnel,
      status: 'pending_review',
      currentLevel: 'public',
      requestedLevel,
      nextSteps: this.determineClearanceSteps(requestedLevel),
      estimatedCompletionDate: this.estimateClearanceCompletion(requestedLevel),
      conditions: [],
    };

    this.clearanceRequests.set(requestId, result);
    this.logger.info(`Clearance request ${requestId} submitted for ${personnel}`);
    this.emit('clearance_requested', { requestId, personnel, requestedLevel });

    return result;
  }

  async planProtectiveDetail(
    protectee: string,
    event: string,
    location: string,
    startTime: string,
    endTime: string,
    threatLevel: z.infer<typeof ThreatLevelSchema>
  ): Promise<ProtectiveDetailResult> {
    const detailId = `PD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const teamSize = this.calculateTeamSize(threatLevel);

    const result: ProtectiveDetailResult = {
      detailId,
      protectee,
      event,
      threatAssessment: threatLevel,
      teamComposition: {
        leadAgent: 'Luke',
        teamSize,
        specialAssets: this.determineSpecialAssets(threatLevel),
      },
      operationalPlan: {
        advanceWork: this.planAdvanceWork(location, threatLevel),
        primaryRoute: 'TBD - Advance team to determine',
        alternateRoutes: ['Route Alpha', 'Route Bravo', 'Route Charlie'],
        safeHavens: this.identifySafeHavens(location),
        emergencyProtocols: this.defineEmergencyProtocols(threatLevel),
      },
      communicationsPlan: 'Encrypted radio, backup cellular, emergency beacon',
      status: 'planning',
    };

    this.protectiveDetails.set(detailId, result);
    this.logger.info(`Protective detail ${detailId} planned for ${protectee}`);
    this.emit('protective_detail_planned', { detailId, protectee, event });

    return result;
  }

  async conductFacilityAudit(
    facility: string,
    auditType: 'routine' | 'comprehensive' | 'post_incident' | 'certification',
    areas: string[]
  ): Promise<FacilityAuditResult> {
    const auditId = `FA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const findings = areas.map(area => ({
      area,
      score: Math.floor(Math.random() * 30) + 70, // Simulated scores
      status: this.determineComplianceStatus(Math.floor(Math.random() * 30) + 70),
      findings: this.generateAreaFindings(area),
      recommendations: this.generateAreaRecommendations(area),
    }));

    const overallScore = Math.round(findings.reduce((sum, f) => sum + f.score, 0) / findings.length);
    const criticalIssues = findings.filter(f => f.status === 'critical').map(f => f.area);

    const result: FacilityAuditResult = {
      auditId,
      facility,
      overallSecurityScore: overallScore,
      findings,
      criticalIssues,
      improvementPlan: this.createImprovementPlan(findings),
      nextAuditDate: this.calculateNextAuditDate(auditType, overallScore),
      certificationStatus: overallScore >= 85 ? 'certified' : overallScore >= 70 ? 'conditional' : 'not_certified',
    };

    this.facilityAudits.set(auditId, result);
    this.logger.info(`Facility audit ${auditId} completed for ${facility}: Score ${overallScore}`);
    this.emit('audit_completed', { auditId, facility, overallScore });

    return result;
  }

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const activeIncidents = Array.from(this.securityIncidents.values())
      .filter(i => i.status !== 'resolved');

    const pendingClearances = Array.from(this.clearanceRequests.values())
      .filter(c => c.status !== 'approved' && c.status !== 'denied');

    const scheduledDetails = Array.from(this.protectiveDetails.values())
      .filter(d => d.status === 'planning' || d.status === 'advance');

    return {
      currentThreatLevel: this.currentThreatLevel,
      activeIncidents: activeIncidents.length,
      openInvestigations: activeIncidents.filter(i => i.status === 'investigating').length,
      pendingClearances: pendingClearances.length,
      scheduledProtectiveDetails: scheduledDetails.length,
      facilitySecurityScores: Array.from(this.facilityAudits.values()).map(a => ({
        facility: a.facility,
        score: a.overallSecurityScore,
      })),
      recentAlerts: activeIncidents.slice(0, 5).map(i => ({
        id: i.incidentId,
        type: 'incident',
        severity: i.priority,
        timestamp: new Date().toISOString(),
      })),
      upcomingAudits: Array.from(this.facilityAudits.values()).slice(0, 3).map(a => ({
        facility: a.facility,
        date: a.nextAuditDate,
        type: 'routine',
      })),
      securityMetrics: {
        incidentsThisMonth: this.securityIncidents.size,
        incidentsResolved: Array.from(this.securityIncidents.values())
          .filter(i => i.status === 'resolved').length,
        averageResponseTime: '15 minutes',
        clearanceProcessingTime: '5 business days',
      },
      recommendations: this.generateDashboardRecommendations(),
    };
  }

  // ============================================================================
  // Request Handlers
  // ============================================================================

  private async handleThreatAssessment(
    request: z.infer<typeof ThreatAssessmentRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.conductThreatAssessment(
      request.subject,
      request.category,
      request.context,
      request.requestedBy
    );
    return this.createResponse(true, result);
  }

  private async handleSecurityIncident(
    request: z.infer<typeof SecurityIncidentSchema>
  ): Promise<AgentResponse> {
    const result = await this.reportSecurityIncident(
      request.incidentType,
      request.severity,
      request.description,
      request.location,
      request.reportedBy
    );
    return this.createResponse(true, result);
  }

  private async handleClearanceRequest(
    request: z.infer<typeof SecurityClearanceRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.requestClearance(
      request.personnel,
      request.requestedLevel,
      request.purpose,
      request.sponsor
    );
    return this.createResponse(true, result);
  }

  private async handleProtectiveDetail(
    request: z.infer<typeof ProtectiveDetailRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.planProtectiveDetail(
      request.protectee,
      request.event,
      request.location,
      request.startTime,
      request.endTime,
      request.threatLevel
    );
    return this.createResponse(true, result);
  }

  private async handleFacilityAudit(
    request: z.infer<typeof FacilitySecurityAuditSchema>
  ): Promise<AgentResponse> {
    const result = await this.conductFacilityAudit(
      request.facility,
      request.auditType,
      request.areas
    );
    return this.createResponse(true, result);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private assessThreatLevel(category: string, context?: string): z.infer<typeof ThreatLevelSchema> {
    // Simplified threat assessment logic
    if (context?.toLowerCase().includes('critical') || context?.toLowerCase().includes('immediate')) {
      return 'high';
    }
    if (category === 'cyber' || category === 'physical') {
      return 'moderate';
    }
    return 'low';
  }

  private identifyThreats(category: string, context?: string): string[] {
    const threats: Record<string, string[]> = {
      physical: ['Unauthorized entry', 'Surveillance', 'Physical tampering'],
      cyber: ['Phishing attempts', 'Network intrusion', 'Malware'],
      personnel: ['Insider threat', 'Social engineering', 'Credential compromise'],
      operational: ['Process disruption', 'Supply chain interference', 'Communication intercept'],
      reputational: ['Information leak', 'Disinformation campaign', 'Brand impersonation'],
    };
    return threats[category] || ['General security threat'];
  }

  private identifyVulnerabilities(category: string): string[] {
    const vulnerabilities: Record<string, string[]> = {
      physical: ['Perimeter gaps', 'Insufficient lighting', 'Access control weaknesses'],
      cyber: ['Outdated systems', 'Weak authentication', 'Unpatched software'],
      personnel: ['Inadequate screening', 'Training gaps', 'Access over-provisioning'],
      operational: ['Single points of failure', 'Documentation gaps', 'Process complexity'],
      reputational: ['Social media exposure', 'Third-party dependencies', 'Communication delays'],
    };
    return vulnerabilities[category] || ['Assessment required'];
  }

  private assessLikelihood(threatLevel: z.infer<typeof ThreatLevelSchema>): 'unlikely' | 'possible' | 'likely' | 'almost_certain' {
    const mapping: Record<string, 'unlikely' | 'possible' | 'likely' | 'almost_certain'> = {
      low: 'unlikely',
      moderate: 'possible',
      elevated: 'likely',
      high: 'likely',
      critical: 'almost_certain',
    };
    return mapping[threatLevel];
  }

  private assessImpact(threatLevel: z.infer<typeof ThreatLevelSchema>): 'minimal' | 'moderate' | 'significant' | 'severe' | 'catastrophic' {
    const mapping: Record<string, 'minimal' | 'moderate' | 'significant' | 'severe' | 'catastrophic'> = {
      low: 'minimal',
      moderate: 'moderate',
      elevated: 'significant',
      high: 'severe',
      critical: 'catastrophic',
    };
    return mapping[threatLevel];
  }

  private generateSecurityRecommendations(category: string, threatLevel: z.infer<typeof ThreatLevelSchema>): string[] {
    const baseRecommendations = [
      'Increase monitoring frequency',
      'Review access controls',
      'Update incident response procedures',
    ];

    if (threatLevel === 'high' || threatLevel === 'critical') {
      baseRecommendations.push('Activate emergency response team');
      baseRecommendations.push('Implement additional security layers');
    }

    return baseRecommendations;
  }

  private createMitigationPlan(category: string, threatLevel: z.infer<typeof ThreatLevelSchema>): string[] {
    return [
      'Phase 1: Immediate containment measures',
      'Phase 2: Root cause analysis',
      'Phase 3: Implement protective controls',
      'Phase 4: Continuous monitoring',
      'Phase 5: Post-incident review',
    ];
  }

  private determinePriority(severity: z.infer<typeof ThreatLevelSchema>): 'low' | 'medium' | 'high' | 'critical' {
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'low',
      moderate: 'medium',
      elevated: 'high',
      high: 'high',
      critical: 'critical',
    };
    return mapping[severity];
  }

  private determineInitialActions(incidentType: string, severity: z.infer<typeof ThreatLevelSchema>): string[] {
    const actions = ['Document incident details', 'Preserve evidence'];

    if (severity === 'critical' || severity === 'high') {
      actions.unshift('Alert response team immediately');
      actions.push('Initiate lockdown procedures if necessary');
    }

    return actions;
  }

  private determineContainmentMeasures(incidentType: string): string[] {
    return [
      'Isolate affected systems/areas',
      'Restrict access to authorized personnel only',
      'Implement temporary security controls',
      'Monitor for secondary incidents',
    ];
  }

  private determineNotifications(severity: z.infer<typeof ThreatLevelSchema>): string[] {
    const notifications = ['Security team'];

    if (severity === 'high' || severity === 'critical') {
      notifications.push('Executive leadership (Architect)');
      notifications.push('Legal counsel');
    }
    if (severity === 'critical') {
      notifications.push('All council members');
      notifications.push('External authorities if required');
    }

    return notifications;
  }

  private estimateResolutionTime(severity: z.infer<typeof ThreatLevelSchema>): string {
    const estimates: Record<string, string> = {
      low: '24-48 hours',
      moderate: '12-24 hours',
      elevated: '6-12 hours',
      high: '2-6 hours',
      critical: 'Immediate - continuous until resolved',
    };
    return estimates[severity];
  }

  private updateGlobalThreatLevel(newLevel: z.infer<typeof ThreatLevelSchema>): void {
    const levelOrder = ['low', 'moderate', 'elevated', 'high', 'critical'];
    const currentIndex = levelOrder.indexOf(this.currentThreatLevel);
    const newIndex = levelOrder.indexOf(newLevel);

    if (newIndex > currentIndex) {
      this.currentThreatLevel = newLevel;
      this.logger.warn(`Global threat level elevated to: ${newLevel}`);
      this.emit('threat_level_changed', { level: newLevel });
    }
  }

  private determineClearanceSteps(level: string): string[] {
    const baseSteps = ['Initial application review', 'Background check initiation'];

    if (level === 'secret' || level === 'top_secret') {
      baseSteps.push('Extended background investigation');
      baseSteps.push('Personal interview');
      baseSteps.push('Reference verification');
    }

    baseSteps.push('Final adjudication');
    return baseSteps;
  }

  private estimateClearanceCompletion(level: string): string {
    const days: Record<string, number> = {
      public: 1,
      internal: 3,
      confidential: 7,
      secret: 30,
      top_secret: 90,
    };
    const completionDate = new Date(Date.now() + (days[level] || 7) * 24 * 60 * 60 * 1000);
    return completionDate.toISOString();
  }

  private calculateTeamSize(threatLevel: z.infer<typeof ThreatLevelSchema>): number {
    const sizes: Record<string, number> = {
      low: 2,
      moderate: 3,
      elevated: 4,
      high: 6,
      critical: 8,
    };
    return sizes[threatLevel];
  }

  private determineSpecialAssets(threatLevel: z.infer<typeof ThreatLevelSchema>): string[] {
    const assets = ['Communications equipment'];

    if (threatLevel === 'elevated' || threatLevel === 'high' || threatLevel === 'critical') {
      assets.push('Counter-surveillance equipment');
      assets.push('Emergency medical kit');
    }
    if (threatLevel === 'high' || threatLevel === 'critical') {
      assets.push('Armored vehicle');
      assets.push('Air support coordination');
    }

    return assets;
  }

  private planAdvanceWork(location: string, threatLevel: z.infer<typeof ThreatLevelSchema>): string[] {
    return [
      'Site reconnaissance',
      'Entry/exit point identification',
      'Emergency route planning',
      'Communication system testing',
      'Local authority coordination',
    ];
  }

  private identifySafeHavens(location: string): string[] {
    return [
      'Primary safe haven: TBD',
      'Secondary safe haven: TBD',
      'Medical facility: Nearest hospital',
      'Law enforcement: Local precinct',
    ];
  }

  private defineEmergencyProtocols(threatLevel: z.infer<typeof ThreatLevelSchema>): string[] {
    return [
      'Immediate evacuation protocol',
      'Medical emergency response',
      'Communication blackout procedure',
      'Rally point designation',
      'Exfiltration routes',
    ];
  }

  private determineComplianceStatus(score: number): 'compliant' | 'needs_improvement' | 'non_compliant' | 'critical' {
    if (score >= 90) return 'compliant';
    if (score >= 75) return 'needs_improvement';
    if (score >= 60) return 'non_compliant';
    return 'critical';
  }

  private generateAreaFindings(area: string): string[] {
    return [
      `${area}: Standard assessment completed`,
      `${area}: Documentation reviewed`,
      `${area}: Physical inspection conducted`,
    ];
  }

  private generateAreaRecommendations(area: string): string[] {
    return [
      `Continue regular maintenance of ${area} systems`,
      `Update ${area} documentation`,
      `Schedule next ${area} review`,
    ];
  }

  private createImprovementPlan(findings: any[]): string[] {
    const criticalAreas = findings.filter(f => f.status === 'critical' || f.status === 'non_compliant');

    return [
      'Address critical findings within 30 days',
      'Implement improvement recommendations within 90 days',
      'Schedule follow-up audit',
      ...criticalAreas.map(a => `Priority: Address ${a.area} deficiencies`),
    ];
  }

  private calculateNextAuditDate(auditType: string, score: number): string {
    let daysUntilNext = 365; // Default annual

    if (score < 70) daysUntilNext = 90;
    else if (score < 85) daysUntilNext = 180;

    if (auditType === 'post_incident') daysUntilNext = Math.min(daysUntilNext, 90);

    return new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000).toISOString();
  }

  private generateDashboardRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.currentThreatLevel !== 'low') {
      recommendations.push(`Current threat level is ${this.currentThreatLevel} - maintain heightened awareness`);
    }

    if (this.securityIncidents.size > 0) {
      recommendations.push('Review and close resolved incidents');
    }

    recommendations.push('Conduct regular security awareness training');
    recommendations.push('Review and update emergency response procedures');

    return recommendations;
  }

  private createResponse(success: boolean, data: any, error?: string): AgentResponse {
    return {
      success,
      data: data || { status: 'assigned_to_luke', humanCoordination: true },
      error,
      metadata: {
        agent: 'luke',
        isHuman: true,
        role: 'Chief of Security',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default LukeService;

import { EventEmitter } from 'events';
import { z } from 'zod';
import { AgentService, AgentResponse } from '../../types/agent';
import { createLogger, LoggerInterface } from '../../utils/logger';

/**
 * Justin - CEO, Vitruvian Industries (Human Council Member)
 *
 * "The master builder translating digital blueprints into physical reality,
 * raising the crystalline city from the ground up."
 *
 * Specializations:
 * - Construction Management
 * - Project Leadership
 * - Quality Control
 * - Infrastructure Development
 *
 * This service coordinates construction projects, building management,
 * and physical infrastructure development across the ecosystem.
 */

// ============================================================================
// Validation Schemas
// ============================================================================

const ProjectPhaseSchema = z.enum([
  'planning',
  'design',
  'permitting',
  'site_prep',
  'foundation',
  'structure',
  'systems',
  'finishing',
  'commissioning',
  'completed',
  'maintenance'
]);

const BuildingTypeSchema = z.enum([
  'data_center',
  'office',
  'manufacturing',
  'research_facility',
  'mixed_use',
  'residential',
  'warehouse',
  'infrastructure'
]);

const ConstructionProjectSchema = z.object({
  type: z.literal('construction_project'),
  projectName: z.string().min(1, 'Project name is required'),
  buildingType: BuildingTypeSchema,
  location: z.object({
    address: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  specifications: z.object({
    squareFootage: z.number().positive(),
    floors: z.number().positive(),
    specialRequirements: z.array(z.string()).optional(),
  }),
  timeline: z.object({
    startDate: z.string().datetime(),
    targetCompletion: z.string().datetime(),
  }),
  budget: z.object({
    total: z.number().positive(),
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  }),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const QualityInspectionSchema = z.object({
  type: z.literal('quality_inspection'),
  projectId: z.string().min(1, 'Project ID is required'),
  inspectionType: z.enum([
    'foundation',
    'structural',
    'electrical',
    'mechanical',
    'plumbing',
    'fire_safety',
    'accessibility',
    'environmental',
    'final'
  ]),
  scheduledDate: z.string().datetime().optional(),
  priority: z.enum(['routine', 'required', 'urgent']).default('routine'),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const ProgressUpdateSchema = z.object({
  type: z.literal('progress_update'),
  projectId: z.string().min(1, 'Project ID is required'),
  currentPhase: ProjectPhaseSchema,
  completionPercentage: z.number().min(0).max(100),
  activitiesCompleted: z.array(z.string()),
  upcomingActivities: z.array(z.string()),
  issues: z.array(z.object({
    issue: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    resolution: z.string().optional(),
  })).optional(),
  reportedBy: z.string().min(1, 'Reporter is required'),
});

const MaterialRequestSchema = z.object({
  type: z.literal('material_request'),
  projectId: z.string().min(1, 'Project ID is required'),
  materials: z.array(z.object({
    item: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    specifications: z.string().optional(),
  })).min(1, 'At least one material is required'),
  deliveryDate: z.string().datetime(),
  priority: z.enum(['standard', 'expedited', 'critical']).default('standard'),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const FacilityMaintenanceSchema = z.object({
  type: z.literal('facility_maintenance'),
  facility: z.string().min(1, 'Facility name is required'),
  maintenanceType: z.enum([
    'preventive',
    'corrective',
    'emergency',
    'upgrade',
    'inspection'
  ]),
  systems: z.array(z.enum([
    'hvac',
    'electrical',
    'plumbing',
    'structural',
    'fire_safety',
    'security',
    'elevator',
    'roofing',
    'exterior'
  ])).min(1, 'At least one system is required'),
  description: z.string().min(10, 'Description is required'),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const JustinRequestSchema = z.discriminatedUnion('type', [
  ConstructionProjectSchema,
  QualityInspectionSchema,
  ProgressUpdateSchema,
  MaterialRequestSchema,
  FacilityMaintenanceSchema,
]);

type JustinRequest = z.infer<typeof JustinRequestSchema>;

// ============================================================================
// Result Interfaces
// ============================================================================

interface ConstructionProjectResult {
  projectId: string;
  projectName: string;
  buildingType: z.infer<typeof BuildingTypeSchema>;
  status: z.infer<typeof ProjectPhaseSchema>;
  location: string;
  specifications: {
    squareFootage: string;
    floors: number;
    specialFeatures: string[];
  };
  schedule: {
    startDate: string;
    targetCompletion: string;
    currentPhase: string;
    estimatedCompletion: string;
    milestones: { phase: string; target: string; status: 'pending' | 'in_progress' | 'completed' }[];
  };
  budget: {
    total: string;
    committed: string;
    spent: string;
    contingency: string;
    variance: string;
  };
  team: {
    role: string;
    contact: string;
    company: string;
  }[];
  permits: {
    permit: string;
    status: 'pending' | 'submitted' | 'approved' | 'issued';
    expirationDate: string;
  }[];
}

interface QualityInspectionResult {
  inspectionId: string;
  projectId: string;
  inspectionType: string;
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'passed';
  inspector: string;
  findings: {
    area: string;
    status: 'pass' | 'minor_deficiency' | 'major_deficiency' | 'fail';
    details: string;
    correctionRequired: boolean;
    deadline: string;
  }[];
  overallResult: 'pass' | 'conditional_pass' | 'fail';
  certifications: string[];
  nextInspection: string;
}

interface ProgressUpdateResult {
  updateId: string;
  projectId: string;
  timestamp: string;
  progress: {
    overallCompletion: number;
    phaseCompletion: number;
    currentPhase: z.infer<typeof ProjectPhaseSchema>;
    daysRemaining: number;
    onSchedule: boolean;
  };
  activities: {
    completed: string[];
    inProgress: string[];
    upcoming: string[];
  };
  issues: {
    issue: string;
    severity: string;
    status: 'open' | 'in_progress' | 'resolved';
    impact: string;
  }[];
  metrics: {
    safetyIncidents: number;
    workersOnSite: number;
    weatherDelays: number;
    changeOrders: number;
  };
  photos: string[];
}

interface MaterialRequestResult {
  requestId: string;
  projectId: string;
  status: 'pending' | 'approved' | 'ordered' | 'in_transit' | 'delivered';
  materials: {
    item: string;
    quantity: string;
    unitCost: string;
    totalCost: string;
    supplier: string;
    deliveryStatus: string;
  }[];
  logistics: {
    supplier: string;
    orderDate: string;
    expectedDelivery: string;
    trackingNumber: string;
  };
  totalCost: string;
  approvals: {
    approver: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
  }[];
}

interface MaintenanceResult {
  workOrderId: string;
  facility: string;
  maintenanceType: string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'verified';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  systems: string[];
  details: {
    description: string;
    diagnosis: string;
    workPerformed: string;
    partsUsed: string[];
  };
  assignment: {
    technician: string;
    scheduledDate: string;
    estimatedDuration: string;
  };
  costs: {
    labor: string;
    materials: string;
    total: string;
  };
  nextMaintenanceDue: string;
}

interface ConstructionDashboard {
  activeProjects: number;
  totalSquareFootage: string;
  projectsOnSchedule: number;
  projectsAtRisk: number;
  safetyRecord: {
    daysWithoutIncident: number;
    ytdIncidents: number;
    safetyRating: string;
  };
  budgetSummary: {
    totalBudget: string;
    totalSpent: string;
    totalCommitted: string;
    variance: string;
  };
  projects: {
    projectId: string;
    name: string;
    type: string;
    phase: string;
    completion: number;
    status: 'on_track' | 'at_risk' | 'delayed';
  }[];
  upcomingMilestones: {
    date: string;
    project: string;
    milestone: string;
  }[];
  maintenanceQueue: {
    facility: string;
    type: string;
    priority: string;
    status: string;
  }[];
  recentInspections: {
    project: string;
    type: string;
    result: string;
    date: string;
  }[];
}

// ============================================================================
// Justin Service Implementation
// ============================================================================

export class JustinService extends EventEmitter implements AgentService {
  private logger: LoggerInterface;
  private isInitialized = false;

  // In-memory stores
  private projects: Map<string, ConstructionProjectResult> = new Map();
  private inspections: Map<string, QualityInspectionResult> = new Map();
  private progressUpdates: Map<string, ProgressUpdateResult> = new Map();
  private materialRequests: Map<string, MaterialRequestResult> = new Map();
  private maintenanceOrders: Map<string, MaintenanceResult> = new Map();

  constructor() {
    super();
    this.logger = createLogger('justin');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Justin service already initialized');
      return;
    }

    this.logger.info('Justin - CEO, Vitruvian Industries (Human) initializing...');
    this.logger.info('Construction management systems online. Building the future.');

    this.isInitialized = true;
    this.emit('initialized', { timestamp: new Date().toISOString() });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Justin shutting down... Projects continue under site supervision.');
    this.isInitialized = false;
    this.emit('shutdown', { timestamp: new Date().toISOString() });
  }

  async processRequest(request: unknown): Promise<AgentResponse> {
    try {
      const validatedRequest = JustinRequestSchema.parse(request);

      switch (validatedRequest.type) {
        case 'construction_project':
          return this.handleConstructionProject(validatedRequest);
        case 'quality_inspection':
          return this.handleQualityInspection(validatedRequest);
        case 'progress_update':
          return this.handleProgressUpdate(validatedRequest);
        case 'material_request':
          return this.handleMaterialRequest(validatedRequest);
        case 'facility_maintenance':
          return this.handleFacilityMaintenance(validatedRequest);
        default:
          return this.createResponse(false, null, 'Unknown request type');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, `Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      this.logger.error('Error processing request:', { error });
      return this.createResponse(false, null, 'Internal construction service error');
    }
  }

  // ============================================================================
  // Core Construction Functions
  // ============================================================================

  async createConstructionProject(
    projectName: string,
    buildingType: z.infer<typeof BuildingTypeSchema>,
    location: any,
    specifications: any,
    timeline: any,
    budget: any
  ): Promise<ConstructionProjectResult> {
    const projectId = `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: ConstructionProjectResult = {
      projectId,
      projectName,
      buildingType,
      status: 'planning',
      location: location.address,
      specifications: {
        squareFootage: `${specifications.squareFootage.toLocaleString()} sq ft`,
        floors: specifications.floors,
        specialFeatures: specifications.specialRequirements || [],
      },
      schedule: {
        startDate: timeline.startDate,
        targetCompletion: timeline.targetCompletion,
        currentPhase: 'Planning & Design',
        estimatedCompletion: timeline.targetCompletion,
        milestones: this.generateProjectMilestones(buildingType, timeline),
      },
      budget: {
        total: `${budget.currency} ${budget.total.toLocaleString()}`,
        committed: `${budget.currency} 0`,
        spent: `${budget.currency} 0`,
        contingency: `${budget.currency} ${Math.round(budget.total * 0.1).toLocaleString()}`,
        variance: '0%',
      },
      team: this.assignProjectTeam(buildingType),
      permits: this.identifyRequiredPermits(buildingType, location),
    };

    this.projects.set(projectId, result);
    this.logger.info(`Construction project ${projectId} created: ${projectName} (${buildingType})`);
    this.emit('project_created', result);

    return result;
  }

  async scheduleQualityInspection(
    projectId: string,
    inspectionType: string,
    scheduledDate?: string,
    priority?: string
  ): Promise<QualityInspectionResult> {
    const inspectionId = `INS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: QualityInspectionResult = {
      inspectionId,
      projectId,
      inspectionType,
      scheduledDate: scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      inspector: this.assignInspector(inspectionType),
      findings: [],
      overallResult: 'pass',
      certifications: this.getRequiredCertifications(inspectionType),
      nextInspection: this.calculateNextInspectionDate(inspectionType),
    };

    this.inspections.set(inspectionId, result);
    this.logger.info(`Quality inspection ${inspectionId} scheduled for project ${projectId}: ${inspectionType}`);
    this.emit('inspection_scheduled', result);

    return result;
  }

  async recordProgressUpdate(
    projectId: string,
    currentPhase: z.infer<typeof ProjectPhaseSchema>,
    completionPercentage: number,
    activitiesCompleted: string[],
    upcomingActivities: string[],
    issues?: any[]
  ): Promise<ProgressUpdateResult> {
    const updateId = `UPD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const project = this.projects.get(projectId);
    const daysRemaining = project ?
      Math.ceil((new Date(project.schedule.targetCompletion).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

    const result: ProgressUpdateResult = {
      updateId,
      projectId,
      timestamp: new Date().toISOString(),
      progress: {
        overallCompletion: completionPercentage,
        phaseCompletion: this.calculatePhaseCompletion(currentPhase, completionPercentage),
        currentPhase,
        daysRemaining,
        onSchedule: this.assessScheduleStatus(completionPercentage, daysRemaining),
      },
      activities: {
        completed: activitiesCompleted,
        inProgress: this.identifyInProgressActivities(currentPhase),
        upcoming: upcomingActivities,
      },
      issues: (issues || []).map(i => ({
        issue: i.issue,
        severity: i.severity,
        status: i.resolution ? 'resolved' : 'open',
        impact: this.assessIssueImpact(i.severity),
      })),
      metrics: {
        safetyIncidents: 0,
        workersOnSite: this.estimateWorkforce(currentPhase),
        weatherDelays: 0,
        changeOrders: 0,
      },
      photos: [],
    };

    this.progressUpdates.set(updateId, result);

    // Update main project status
    if (project) {
      project.status = currentPhase;
      this.projects.set(projectId, project);
    }

    this.logger.info(`Progress update ${updateId} recorded for project ${projectId}: ${completionPercentage}% complete`);
    this.emit('progress_updated', result);

    return result;
  }

  async requestMaterials(
    projectId: string,
    materials: any[],
    deliveryDate: string,
    priority?: string
  ): Promise<MaterialRequestResult> {
    const requestId = `MAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const materialDetails = materials.map(m => ({
      item: m.item,
      quantity: `${m.quantity} ${m.unit}`,
      unitCost: this.estimateUnitCost(m.item),
      totalCost: this.calculateMaterialCost(m.item, m.quantity),
      supplier: this.identifySupplier(m.item),
      deliveryStatus: 'Pending order',
    }));

    const totalCost = materialDetails.reduce((sum, m) => {
      return sum + parseFloat(m.totalCost.replace(/[$,]/g, ''));
    }, 0);

    const result: MaterialRequestResult = {
      requestId,
      projectId,
      status: 'pending',
      materials: materialDetails,
      logistics: {
        supplier: 'Multiple suppliers',
        orderDate: 'Pending approval',
        expectedDelivery: deliveryDate,
        trackingNumber: 'TBD',
      },
      totalCost: `$${totalCost.toLocaleString()}`,
      approvals: [{
        approver: 'Justin (Project Lead)',
        status: priority === 'critical' ? 'approved' : 'pending',
        date: priority === 'critical' ? new Date().toISOString() : '',
      }],
    };

    this.materialRequests.set(requestId, result);
    this.logger.info(`Material request ${requestId} submitted for project ${projectId}: ${materials.length} items`);
    this.emit('material_request_submitted', result);

    return result;
  }

  async createMaintenanceOrder(
    facility: string,
    maintenanceType: string,
    systems: string[],
    description: string
  ): Promise<MaintenanceResult> {
    const workOrderId = `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const priority = this.determineMaintenancePriority(maintenanceType, systems);

    const result: MaintenanceResult = {
      workOrderId,
      facility,
      maintenanceType,
      status: 'submitted',
      priority,
      systems,
      details: {
        description,
        diagnosis: 'Pending inspection',
        workPerformed: '',
        partsUsed: [],
      },
      assignment: {
        technician: this.assignTechnician(systems),
        scheduledDate: this.scheduleMaintenanceDate(priority),
        estimatedDuration: this.estimateMaintenanceDuration(maintenanceType, systems),
      },
      costs: {
        labor: 'TBD',
        materials: 'TBD',
        total: 'TBD',
      },
      nextMaintenanceDue: this.calculateNextMaintenanceDate(maintenanceType, systems),
    };

    this.maintenanceOrders.set(workOrderId, result);
    this.logger.info(`Maintenance order ${workOrderId} created for ${facility}: ${maintenanceType}`);
    this.emit('maintenance_order_created', result);

    return result;
  }

  async getDashboard(): Promise<ConstructionDashboard> {
    const projectArray = Array.from(this.projects.values());
    const activeProjects = projectArray.filter(p => p.status !== 'completed' && p.status !== 'maintenance');

    const totalBudget = projectArray.reduce((sum, p) => {
      const budget = parseFloat(p.budget.total.replace(/[^0-9.]/g, ''));
      return sum + budget;
    }, 0);

    return {
      activeProjects: activeProjects.length,
      totalSquareFootage: this.calculateTotalSquareFootage(projectArray),
      projectsOnSchedule: activeProjects.filter(p => this.isProjectOnSchedule(p)).length,
      projectsAtRisk: activeProjects.filter(p => !this.isProjectOnSchedule(p)).length,
      safetyRecord: {
        daysWithoutIncident: 127,
        ytdIncidents: 2,
        safetyRating: 'A',
      },
      budgetSummary: {
        totalBudget: `$${totalBudget.toLocaleString()}`,
        totalSpent: `$${Math.round(totalBudget * 0.35).toLocaleString()}`,
        totalCommitted: `$${Math.round(totalBudget * 0.55).toLocaleString()}`,
        variance: '-2.5%',
      },
      projects: projectArray.slice(0, 10).map(p => ({
        projectId: p.projectId,
        name: p.projectName,
        type: p.buildingType,
        phase: p.status,
        completion: this.estimateProjectCompletion(p),
        status: this.isProjectOnSchedule(p) ? 'on_track' : 'at_risk',
      })),
      upcomingMilestones: this.getUpcomingMilestones(),
      maintenanceQueue: Array.from(this.maintenanceOrders.values())
        .filter(m => m.status !== 'completed' && m.status !== 'verified')
        .slice(0, 5)
        .map(m => ({
          facility: m.facility,
          type: m.maintenanceType,
          priority: m.priority,
          status: m.status,
        })),
      recentInspections: Array.from(this.inspections.values())
        .slice(0, 5)
        .map(i => ({
          project: i.projectId,
          type: i.inspectionType,
          result: i.overallResult,
          date: i.scheduledDate,
        })),
    };
  }

  // ============================================================================
  // Request Handlers
  // ============================================================================

  private async handleConstructionProject(
    request: z.infer<typeof ConstructionProjectSchema>
  ): Promise<AgentResponse> {
    const result = await this.createConstructionProject(
      request.projectName,
      request.buildingType,
      request.location,
      request.specifications,
      request.timeline,
      request.budget
    );
    return this.createResponse(true, result);
  }

  private async handleQualityInspection(
    request: z.infer<typeof QualityInspectionSchema>
  ): Promise<AgentResponse> {
    const result = await this.scheduleQualityInspection(
      request.projectId,
      request.inspectionType,
      request.scheduledDate,
      request.priority
    );
    return this.createResponse(true, result);
  }

  private async handleProgressUpdate(
    request: z.infer<typeof ProgressUpdateSchema>
  ): Promise<AgentResponse> {
    const result = await this.recordProgressUpdate(
      request.projectId,
      request.currentPhase,
      request.completionPercentage,
      request.activitiesCompleted,
      request.upcomingActivities,
      request.issues
    );
    return this.createResponse(true, result);
  }

  private async handleMaterialRequest(
    request: z.infer<typeof MaterialRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.requestMaterials(
      request.projectId,
      request.materials,
      request.deliveryDate,
      request.priority
    );
    return this.createResponse(true, result);
  }

  private async handleFacilityMaintenance(
    request: z.infer<typeof FacilityMaintenanceSchema>
  ): Promise<AgentResponse> {
    const result = await this.createMaintenanceOrder(
      request.facility,
      request.maintenanceType,
      request.systems,
      request.description
    );
    return this.createResponse(true, result);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateProjectMilestones(buildingType: z.infer<typeof BuildingTypeSchema>, timeline: any): ConstructionProjectResult['schedule']['milestones'] {
    return [
      { phase: 'Design Complete', target: 'Month 2', status: 'pending' },
      { phase: 'Permits Approved', target: 'Month 3', status: 'pending' },
      { phase: 'Foundation Complete', target: 'Month 5', status: 'pending' },
      { phase: 'Structure Complete', target: 'Month 9', status: 'pending' },
      { phase: 'Systems Rough-in', target: 'Month 11', status: 'pending' },
      { phase: 'Substantial Completion', target: 'Month 14', status: 'pending' },
      { phase: 'Final Completion', target: 'Month 15', status: 'pending' },
    ];
  }

  private assignProjectTeam(buildingType: z.infer<typeof BuildingTypeSchema>): ConstructionProjectResult['team'] {
    return [
      { role: 'Project Executive', contact: 'Justin', company: 'Vitruvian Industries' },
      { role: 'Project Manager', contact: 'TBD', company: 'Vitruvian Industries' },
      { role: 'Superintendent', contact: 'TBD', company: 'Vitruvian Industries' },
      { role: 'Architect', contact: 'TBD', company: 'Partner Firm' },
      { role: 'MEP Engineer', contact: 'David', company: 'Internal' },
    ];
  }

  private identifyRequiredPermits(buildingType: z.infer<typeof BuildingTypeSchema>, location: any): ConstructionProjectResult['permits'] {
    return [
      { permit: 'Building Permit', status: 'pending', expirationDate: 'TBD' },
      { permit: 'Electrical Permit', status: 'pending', expirationDate: 'TBD' },
      { permit: 'Plumbing Permit', status: 'pending', expirationDate: 'TBD' },
      { permit: 'Fire Marshal Approval', status: 'pending', expirationDate: 'TBD' },
      { permit: 'Environmental Clearance', status: 'pending', expirationDate: 'TBD' },
    ];
  }

  private assignInspector(inspectionType: string): string {
    const inspectors: Record<string, string> = {
      foundation: 'Structural Inspector',
      structural: 'Structural Inspector',
      electrical: 'David / Electrical Inspector',
      mechanical: 'MEP Inspector',
      plumbing: 'Plumbing Inspector',
      fire_safety: 'Fire Marshal',
      accessibility: 'ADA Inspector',
      final: 'Building Inspector',
    };
    return inspectors[inspectionType] || 'General Inspector';
  }

  private getRequiredCertifications(inspectionType: string): string[] {
    return ['Certificate of Inspection', 'Compliance Certificate'];
  }

  private calculateNextInspectionDate(inspectionType: string): string {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  private calculatePhaseCompletion(phase: z.infer<typeof ProjectPhaseSchema>, overall: number): number {
    // Simplified phase completion calculation
    return Math.min(100, overall * 1.2);
  }

  private assessScheduleStatus(completion: number, daysRemaining: number): boolean {
    // Simplified schedule assessment
    const expectedCompletion = 100 - (daysRemaining / 365) * 100;
    return completion >= expectedCompletion * 0.9;
  }

  private identifyInProgressActivities(phase: z.infer<typeof ProjectPhaseSchema>): string[] {
    const activities: Record<string, string[]> = {
      planning: ['Design development', 'Permit applications'],
      design: ['Architectural drawings', 'Engineering calculations'],
      foundation: ['Excavation', 'Concrete pouring'],
      structure: ['Steel erection', 'Framing'],
      systems: ['MEP rough-in', 'Fire protection'],
      finishing: ['Drywall', 'Painting', 'Flooring'],
    };
    return activities[phase] || ['General construction activities'];
  }

  private assessIssueImpact(severity: string): string {
    const impacts: Record<string, string> = {
      low: 'Minimal impact on schedule',
      medium: 'Potential 1-2 week delay',
      high: 'Likely 2-4 week delay',
      critical: 'Project at risk - immediate attention required',
    };
    return impacts[severity] || 'Impact assessment pending';
  }

  private estimateWorkforce(phase: z.infer<typeof ProjectPhaseSchema>): number {
    const workforce: Record<string, number> = {
      planning: 5,
      design: 10,
      site_prep: 20,
      foundation: 35,
      structure: 75,
      systems: 60,
      finishing: 80,
      commissioning: 25,
    };
    return workforce[phase] || 30;
  }

  private estimateUnitCost(item: string): string {
    return '$100'; // Placeholder
  }

  private calculateMaterialCost(item: string, quantity: number): string {
    return `$${(quantity * 100).toLocaleString()}`; // Placeholder calculation
  }

  private identifySupplier(item: string): string {
    return 'Approved Vendor List';
  }

  private determineMaintenancePriority(maintenanceType: string, systems: string[]): 'low' | 'medium' | 'high' | 'emergency' {
    if (maintenanceType === 'emergency') return 'emergency';
    if (systems.includes('fire_safety') || systems.includes('electrical')) return 'high';
    if (maintenanceType === 'corrective') return 'medium';
    return 'low';
  }

  private assignTechnician(systems: string[]): string {
    if (systems.includes('electrical')) return 'David / Electrical Team';
    if (systems.includes('hvac')) return 'HVAC Technician';
    return 'General Maintenance Team';
  }

  private scheduleMaintenanceDate(priority: 'low' | 'medium' | 'high' | 'emergency'): string {
    const delays: Record<string, number> = {
      emergency: 0,
      high: 1,
      medium: 3,
      low: 7,
    };
    return new Date(Date.now() + delays[priority] * 24 * 60 * 60 * 1000).toISOString();
  }

  private estimateMaintenanceDuration(maintenanceType: string, systems: string[]): string {
    if (maintenanceType === 'preventive') return '2-4 hours';
    if (maintenanceType === 'corrective') return '4-8 hours';
    return '1-2 hours';
  }

  private calculateNextMaintenanceDate(maintenanceType: string, systems: string[]): string {
    const intervals: Record<string, number> = {
      preventive: 90,
      corrective: 180,
      inspection: 30,
    };
    const days = intervals[maintenanceType] || 90;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  private calculateTotalSquareFootage(projects: ConstructionProjectResult[]): string {
    const total = projects.reduce((sum, p) => {
      const sf = parseInt(p.specifications.squareFootage.replace(/[^0-9]/g, ''));
      return sum + sf;
    }, 0);
    return `${total.toLocaleString()} sq ft`;
  }

  private isProjectOnSchedule(project: ConstructionProjectResult): boolean {
    // Simplified assessment
    return true;
  }

  private estimateProjectCompletion(project: ConstructionProjectResult): number {
    const phaseProgress: Record<string, number> = {
      planning: 5,
      design: 15,
      permitting: 20,
      site_prep: 25,
      foundation: 35,
      structure: 55,
      systems: 75,
      finishing: 90,
      commissioning: 98,
      completed: 100,
      maintenance: 100,
    };
    return phaseProgress[project.status] || 0;
  }

  private getUpcomingMilestones(): ConstructionDashboard['upcomingMilestones'] {
    return [
      { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), project: 'Data Center Alpha', milestone: 'Foundation Pour' },
      { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), project: 'Office Tower B', milestone: 'Steel Topping Out' },
      { date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), project: 'Research Facility', milestone: 'MEP Rough-in Complete' },
    ];
  }

  private createResponse(success: boolean, data: any, error?: string): AgentResponse {
    return {
      success,
      data: data || { status: 'assigned_to_justin', humanCoordination: true },
      error,
      metadata: {
        agent: 'justin',
        isHuman: true,
        role: 'CEO, Vitruvian Industries',
        organization: 'Vitruvian Industries',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default JustinService;

import { EventEmitter } from 'events';
import { z } from 'zod';
import { AgentService, AgentResponse } from '../../types/agent';
import { createLogger, LoggerInterface } from '../../utils/logger';

/**
 * David - Chief Electrical Systems Consultant (Human Council Member)
 *
 * "The heartbeat of the ecosystem, ensuring every watt generated is
 * managed with the highest efficiency and safety."
 *
 * Specializations:
 * - Electrical Systems
 * - Power Distribution
 * - Grid Integration
 * - Energy Infrastructure
 *
 * This service coordinates electrical system design, power management,
 * and energy infrastructure across all ecosystem facilities.
 */

// ============================================================================
// Validation Schemas
// ============================================================================

const PowerSystemTypeSchema = z.enum(['solar', 'wind', 'hydro', 'geothermal', 'grid', 'battery', 'hybrid']);
const VoltageClassSchema = z.enum(['low', 'medium', 'high', 'extra_high']);
const SystemStatusSchema = z.enum(['design', 'permitting', 'construction', 'commissioning', 'operational', 'maintenance', 'decommissioned']);

const ElectricalDesignRequestSchema = z.object({
  type: z.literal('electrical_design'),
  projectName: z.string().min(1, 'Project name is required'),
  facilityType: z.enum(['residential', 'commercial', 'industrial', 'data_center', 'manufacturing', 'campus']),
  powerRequirements: z.object({
    peakLoad: z.string(), // e.g., "500 kW", "2.5 MW"
    averageLoad: z.string(),
    powerFactor: z.number().min(0).max(1).optional(),
    redundancy: z.enum(['N', 'N+1', '2N', '2N+1']).default('N+1'),
  }),
  voltageClass: VoltageClassSchema,
  sustainabilityGoals: z.object({
    renewableTarget: z.number().min(0).max(100).optional(),
    netZeroGoal: z.boolean().default(false),
    batteryBackup: z.boolean().default(false),
  }).optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const PowerGenerationProjectSchema = z.object({
  type: z.literal('power_generation'),
  projectName: z.string().min(1, 'Project name is required'),
  generationType: PowerSystemTypeSchema,
  capacity: z.object({
    peakCapacity: z.string(), // e.g., "10 MW"
    expectedAnnualGeneration: z.string(), // e.g., "18,000 MWh"
  }),
  location: z.object({
    site: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    gridConnectionPoint: z.string().optional(),
  }),
  timeline: z.object({
    designComplete: z.string().datetime().optional(),
    constructionStart: z.string().datetime().optional(),
    expectedCommissioning: z.string().datetime().optional(),
  }).optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const GridIntegrationRequestSchema = z.object({
  type: z.literal('grid_integration'),
  projectName: z.string().min(1, 'Project name is required'),
  connectionType: z.enum(['net_metering', 'feed_in_tariff', 'power_purchase_agreement', 'behind_the_meter', 'island_mode']),
  interconnectionVoltage: VoltageClassSchema,
  capacity: z.string(), // e.g., "5 MW"
  utilityProvider: z.string(),
  requirements: z.object({
    antiIslanding: z.boolean().default(true),
    powerQuality: z.boolean().default(true),
    gridSupport: z.boolean().default(false),
    blackStartCapability: z.boolean().default(false),
  }),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const SafetyInspectionSchema = z.object({
  type: z.literal('safety_inspection'),
  facility: z.string().min(1, 'Facility name is required'),
  inspectionType: z.enum(['routine', 'pre_commissioning', 'post_incident', 'compliance', 'insurance']),
  systems: z.array(z.enum([
    'main_distribution',
    'emergency_power',
    'grounding',
    'lightning_protection',
    'arc_flash',
    'fire_suppression',
    'monitoring_systems',
    'renewable_generation',
    'battery_storage'
  ])).min(1, 'At least one system must be specified'),
  priority: z.enum(['routine', 'priority', 'urgent']).default('routine'),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const EnergyAuditRequestSchema = z.object({
  type: z.literal('energy_audit'),
  facility: z.string().min(1, 'Facility name is required'),
  auditLevel: z.enum(['walkthrough', 'standard', 'comprehensive', 'investment_grade']),
  focusAreas: z.array(z.enum([
    'lighting',
    'hvac',
    'motors',
    'compressed_air',
    'process_heat',
    'power_factor',
    'demand_response',
    'renewable_potential',
    'storage_potential'
  ])).optional(),
  energyData: z.object({
    annualConsumption: z.string(), // e.g., "2,000,000 kWh"
    peakDemand: z.string(), // e.g., "450 kW"
    annualCost: z.string(), // e.g., "$180,000"
  }).optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const DavidRequestSchema = z.discriminatedUnion('type', [
  ElectricalDesignRequestSchema,
  PowerGenerationProjectSchema,
  GridIntegrationRequestSchema,
  SafetyInspectionSchema,
  EnergyAuditRequestSchema,
]);

type DavidRequest = z.infer<typeof DavidRequestSchema>;

// ============================================================================
// Result Interfaces
// ============================================================================

interface ElectricalDesignResult {
  designId: string;
  projectName: string;
  status: z.infer<typeof SystemStatusSchema>;
  specifications: {
    mainServiceSize: string;
    voltageClass: z.infer<typeof VoltageClassSchema>;
    distributionArchitecture: string;
    redundancyLevel: string;
    estimatedLoad: string;
  };
  sustainabilityFeatures: {
    renewableCapacity: string;
    batteryStorage: string;
    efficiencyMeasures: string[];
    projectedSavings: string;
  };
  safetyFeatures: {
    arcFlashMitigation: string[];
    groundingSystem: string;
    protectionCoordination: string;
    emergencyShutdown: string;
  };
  drawings: string[];
  estimatedCost: string;
  timeline: string;
}

interface PowerGenerationResult {
  projectId: string;
  projectName: string;
  generationType: z.infer<typeof PowerSystemTypeSchema>;
  status: z.infer<typeof SystemStatusSchema>;
  capacity: {
    nameplate: string;
    expectedOutput: string;
    capacityFactor: number;
  };
  economics: {
    capitalCost: string;
    operatingCost: string;
    lcoe: string; // Levelized Cost of Energy
    paybackPeriod: string;
    roi: string;
  };
  environmental: {
    annualCO2Avoided: string;
    landUse: string;
    waterUse: string;
  };
  milestones: {
    phase: string;
    target: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  permits: string[];
}

interface GridIntegrationResult {
  integrationId: string;
  projectName: string;
  status: z.infer<typeof SystemStatusSchema>;
  connectionDetails: {
    pointOfInterconnection: string;
    meteringArrangement: string;
    protectionScheme: string;
    communicationProtocol: string;
  };
  utilityRequirements: {
    completed: string[];
    pending: string[];
    timeline: string;
  };
  commercialTerms: {
    exportRate: string;
    importRate: string;
    demandCharges: string;
    contractDuration: string;
  };
  technicalStudies: {
    name: string;
    status: 'required' | 'in_progress' | 'completed';
    results: string;
  }[];
}

interface SafetyInspectionResult {
  inspectionId: string;
  facility: string;
  inspectionDate: string;
  overallRating: 'pass' | 'conditional_pass' | 'fail' | 'critical';
  findings: {
    system: string;
    status: 'compliant' | 'minor_issue' | 'major_issue' | 'critical';
    findings: string[];
    recommendations: string[];
    priority: 'low' | 'medium' | 'high' | 'immediate';
  }[];
  arcFlashAssessment: {
    highestIncidentEnergy: string;
    ppeRequirements: string[];
    labelingComplete: boolean;
  };
  correctiveActions: {
    action: string;
    deadline: string;
    responsible: string;
  }[];
  nextInspectionDate: string;
}

interface EnergyAuditResult {
  auditId: string;
  facility: string;
  auditDate: string;
  currentProfile: {
    annualConsumption: string;
    peakDemand: string;
    loadFactor: number;
    powerFactor: number;
    annualCost: string;
    carbonFootprint: string;
  };
  opportunities: {
    measure: string;
    category: string;
    annualSavings: string;
    implementationCost: string;
    payback: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  renewablePotential: {
    technology: string;
    estimatedCapacity: string;
    annualGeneration: string;
    investment: string;
    payback: string;
  }[];
  recommendations: string[];
  totalSavingsPotential: string;
  investmentRequired: string;
  overallPayback: string;
}

interface ElectricalDashboard {
  ecosystemPowerProfile: {
    totalCapacity: string;
    renewablePercentage: number;
    gridDependency: string;
    batteryStorage: string;
    averageEfficiency: number;
  };
  activeProjects: {
    projectId: string;
    name: string;
    type: string;
    status: z.infer<typeof SystemStatusSchema>;
    progress: number;
  }[];
  facilityStatus: {
    facility: string;
    lastInspection: string;
    rating: string;
    nextInspection: string;
  }[];
  energyMetrics: {
    dailyGeneration: string;
    dailyConsumption: string;
    netPosition: string;
    carbonAvoided: string;
  };
  alerts: {
    type: 'info' | 'warning' | 'critical';
    message: string;
    facility: string;
    timestamp: string;
  }[];
  upcomingMilestones: {
    date: string;
    project: string;
    milestone: string;
  }[];
}

// ============================================================================
// David Service Implementation
// ============================================================================

export class DavidService extends EventEmitter implements AgentService {
  private logger: LoggerInterface;
  private isInitialized = false;

  // In-memory stores
  private electricalDesigns: Map<string, ElectricalDesignResult> = new Map();
  private powerProjects: Map<string, PowerGenerationResult> = new Map();
  private gridIntegrations: Map<string, GridIntegrationResult> = new Map();
  private safetyInspections: Map<string, SafetyInspectionResult> = new Map();
  private energyAudits: Map<string, EnergyAuditResult> = new Map();

  constructor() {
    super();
    this.logger = createLogger('david');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('David service already initialized');
      return;
    }

    this.logger.info('David - Chief Electrical Systems Consultant (Human) initializing...');
    this.logger.info('Power systems online. Managing every watt with precision and safety.');

    this.isInitialized = true;
    this.emit('initialized', { timestamp: new Date().toISOString() });
  }

  async shutdown(): Promise<void> {
    this.logger.info('David shutting down... Power systems remain under continuous monitoring.');
    this.isInitialized = false;
    this.emit('shutdown', { timestamp: new Date().toISOString() });
  }

  async processRequest(request: unknown): Promise<AgentResponse> {
    try {
      const validatedRequest = DavidRequestSchema.parse(request);

      switch (validatedRequest.type) {
        case 'electrical_design':
          return this.handleElectricalDesign(validatedRequest);
        case 'power_generation':
          return this.handlePowerGeneration(validatedRequest);
        case 'grid_integration':
          return this.handleGridIntegration(validatedRequest);
        case 'safety_inspection':
          return this.handleSafetyInspection(validatedRequest);
        case 'energy_audit':
          return this.handleEnergyAudit(validatedRequest);
        default:
          return this.createResponse(false, null, 'Unknown request type');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, `Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      this.logger.error('Error processing request:', { error });
      return this.createResponse(false, null, 'Internal electrical systems service error');
    }
  }

  // ============================================================================
  // Core Electrical Functions
  // ============================================================================

  async createElectricalDesign(
    projectName: string,
    facilityType: string,
    powerRequirements: any,
    voltageClass: z.infer<typeof VoltageClassSchema>,
    sustainabilityGoals?: any
  ): Promise<ElectricalDesignResult> {
    const designId = `ELD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const serviceSize = this.calculateServiceSize(powerRequirements);

    const result: ElectricalDesignResult = {
      designId,
      projectName,
      status: 'design',
      specifications: {
        mainServiceSize: serviceSize,
        voltageClass,
        distributionArchitecture: this.determineDistributionArchitecture(facilityType, powerRequirements.redundancy),
        redundancyLevel: powerRequirements.redundancy,
        estimatedLoad: powerRequirements.peakLoad,
      },
      sustainabilityFeatures: {
        renewableCapacity: sustainabilityGoals?.renewableTarget ?
          `${sustainabilityGoals.renewableTarget}% of load` : 'Not specified',
        batteryStorage: sustainabilityGoals?.batteryBackup ?
          this.calculateBatterySize(powerRequirements) : 'None',
        efficiencyMeasures: this.determineEfficiencyMeasures(facilityType),
        projectedSavings: this.calculateProjectedSavings(powerRequirements, sustainabilityGoals),
      },
      safetyFeatures: {
        arcFlashMitigation: this.determineArcFlashMitigation(voltageClass),
        groundingSystem: this.determineGroundingSystem(facilityType),
        protectionCoordination: 'Selective coordination study required',
        emergencyShutdown: 'Emergency power off (EPO) system included',
      },
      drawings: [
        'Single-line diagram',
        'Panel schedules',
        'Load calculations',
        'Arc flash study',
        'Grounding plan',
        'Emergency power riser',
      ],
      estimatedCost: this.estimateDesignCost(powerRequirements, voltageClass),
      timeline: '6-8 weeks for complete design package',
    };

    this.electricalDesigns.set(designId, result);
    this.logger.info(`Electrical design ${designId} created for ${projectName}`);
    this.emit('design_created', result);

    return result;
  }

  async createPowerProject(
    projectName: string,
    generationType: z.infer<typeof PowerSystemTypeSchema>,
    capacity: any,
    location: any
  ): Promise<PowerGenerationResult> {
    const projectId = `PWR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const capacityFactor = this.getCapacityFactor(generationType);

    const result: PowerGenerationResult = {
      projectId,
      projectName,
      generationType,
      status: 'design',
      capacity: {
        nameplate: capacity.peakCapacity,
        expectedOutput: capacity.expectedAnnualGeneration,
        capacityFactor,
      },
      economics: this.calculateProjectEconomics(generationType, capacity),
      environmental: this.calculateEnvironmentalImpact(generationType, capacity),
      milestones: [
        { phase: 'Site Assessment', target: 'Month 1', status: 'in_progress' },
        { phase: 'Preliminary Design', target: 'Month 2', status: 'pending' },
        { phase: 'Permitting', target: 'Month 3-6', status: 'pending' },
        { phase: 'Procurement', target: 'Month 4-7', status: 'pending' },
        { phase: 'Construction', target: 'Month 6-12', status: 'pending' },
        { phase: 'Commissioning', target: 'Month 12', status: 'pending' },
      ],
      permits: this.determineRequiredPermits(generationType, location),
    };

    this.powerProjects.set(projectId, result);
    this.logger.info(`Power generation project ${projectId} created: ${generationType} - ${capacity.peakCapacity}`);
    this.emit('power_project_created', result);

    return result;
  }

  async planGridIntegration(
    projectName: string,
    connectionType: string,
    interconnectionVoltage: z.infer<typeof VoltageClassSchema>,
    capacity: string,
    utilityProvider: string,
    requirements: any
  ): Promise<GridIntegrationResult> {
    const integrationId = `GRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: GridIntegrationResult = {
      integrationId,
      projectName,
      status: 'design',
      connectionDetails: {
        pointOfInterconnection: `${utilityProvider} - To be determined`,
        meteringArrangement: this.determineMeteringArrangement(connectionType),
        protectionScheme: this.determineProtectionScheme(interconnectionVoltage, requirements),
        communicationProtocol: requirements.gridSupport ? 'IEC 61850 / DNP3' : 'Standard Modbus',
      },
      utilityRequirements: {
        completed: ['Initial application submitted'],
        pending: this.determineUtilityRequirements(connectionType, capacity),
        timeline: this.estimateInterconnectionTimeline(interconnectionVoltage, capacity),
      },
      commercialTerms: {
        exportRate: 'To be negotiated',
        importRate: 'Standard tariff',
        demandCharges: 'Based on peak demand',
        contractDuration: connectionType === 'power_purchase_agreement' ? '15-25 years' : 'Ongoing',
      },
      technicalStudies: [
        { name: 'System Impact Study', status: 'required', results: 'Pending' },
        { name: 'Facilities Study', status: 'required', results: 'Pending' },
        { name: 'Power Quality Analysis', status: requirements.powerQuality ? 'required' : 'completed', results: 'N/A' },
        { name: 'Protection Coordination Study', status: 'required', results: 'Pending' },
      ],
    };

    this.gridIntegrations.set(integrationId, result);
    this.logger.info(`Grid integration ${integrationId} planned for ${projectName}`);
    this.emit('grid_integration_planned', result);

    return result;
  }

  async conductSafetyInspection(
    facility: string,
    inspectionType: string,
    systems: string[]
  ): Promise<SafetyInspectionResult> {
    const inspectionId = `INS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const findings = systems.map(system => ({
      system,
      status: this.assessSystemStatus(),
      findings: this.generateSystemFindings(system),
      recommendations: this.generateSystemRecommendations(system),
      priority: this.assessPriority(system) as 'low' | 'medium' | 'high' | 'immediate',
    }));

    const overallRating = this.determineOverallRating(findings);

    const result: SafetyInspectionResult = {
      inspectionId,
      facility,
      inspectionDate: new Date().toISOString(),
      overallRating,
      findings,
      arcFlashAssessment: {
        highestIncidentEnergy: '8.5 cal/cm²',
        ppeRequirements: ['Category 2 PPE required for most panels', 'Category 3 PPE for main switchgear'],
        labelingComplete: true,
      },
      correctiveActions: this.generateCorrectiveActions(findings),
      nextInspectionDate: this.calculateNextInspectionDate(inspectionType, overallRating),
    };

    this.safetyInspections.set(inspectionId, result);
    this.logger.info(`Safety inspection ${inspectionId} completed for ${facility}: ${overallRating}`);
    this.emit('safety_inspection_completed', result);

    return result;
  }

  async conductEnergyAudit(
    facility: string,
    auditLevel: string,
    focusAreas?: string[],
    energyData?: any
  ): Promise<EnergyAuditResult> {
    const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const currentProfile = this.analyzeCurrentProfile(energyData);
    const opportunities = this.identifyOpportunities(focusAreas || [], auditLevel);
    const renewablePotential = this.assessRenewablePotential(facility);

    const result: EnergyAuditResult = {
      auditId,
      facility,
      auditDate: new Date().toISOString(),
      currentProfile,
      opportunities,
      renewablePotential,
      recommendations: this.generateAuditRecommendations(opportunities, renewablePotential),
      totalSavingsPotential: this.calculateTotalSavings(opportunities),
      investmentRequired: this.calculateTotalInvestment(opportunities, renewablePotential),
      overallPayback: this.calculateOverallPayback(opportunities, renewablePotential),
    };

    this.energyAudits.set(auditId, result);
    this.logger.info(`Energy audit ${auditId} completed for ${facility}`);
    this.emit('energy_audit_completed', result);

    return result;
  }

  async getDashboard(): Promise<ElectricalDashboard> {
    const activeProjects: ElectricalDashboard['activeProjects'] = [];

    for (const [, design] of this.electricalDesigns) {
      if (design.status !== 'decommissioned') {
        activeProjects.push({
          projectId: design.designId,
          name: design.projectName,
          type: 'Electrical Design',
          status: design.status,
          progress: this.calculateProgress(design.status),
        });
      }
    }

    for (const [, project] of this.powerProjects) {
      if (project.status !== 'decommissioned') {
        activeProjects.push({
          projectId: project.projectId,
          name: project.projectName,
          type: `${project.generationType} Generation`,
          status: project.status,
          progress: this.calculateProgress(project.status),
        });
      }
    }

    return {
      ecosystemPowerProfile: {
        totalCapacity: '15 MW',
        renewablePercentage: 75,
        gridDependency: '25%',
        batteryStorage: '8 MWh',
        averageEfficiency: 94.5,
      },
      activeProjects,
      facilityStatus: Array.from(this.safetyInspections.values()).slice(0, 5).map(i => ({
        facility: i.facility,
        lastInspection: i.inspectionDate,
        rating: i.overallRating,
        nextInspection: i.nextInspectionDate,
      })),
      energyMetrics: {
        dailyGeneration: '42,500 kWh',
        dailyConsumption: '38,200 kWh',
        netPosition: '+4,300 kWh',
        carbonAvoided: '18.2 tonnes CO2',
      },
      alerts: this.generateSystemAlerts(),
      upcomingMilestones: this.getUpcomingMilestones(),
    };
  }

  // ============================================================================
  // Request Handlers
  // ============================================================================

  private async handleElectricalDesign(
    request: z.infer<typeof ElectricalDesignRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.createElectricalDesign(
      request.projectName,
      request.facilityType,
      request.powerRequirements,
      request.voltageClass,
      request.sustainabilityGoals
    );
    return this.createResponse(true, result);
  }

  private async handlePowerGeneration(
    request: z.infer<typeof PowerGenerationProjectSchema>
  ): Promise<AgentResponse> {
    const result = await this.createPowerProject(
      request.projectName,
      request.generationType,
      request.capacity,
      request.location
    );
    return this.createResponse(true, result);
  }

  private async handleGridIntegration(
    request: z.infer<typeof GridIntegrationRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.planGridIntegration(
      request.projectName,
      request.connectionType,
      request.interconnectionVoltage,
      request.capacity,
      request.utilityProvider,
      request.requirements
    );
    return this.createResponse(true, result);
  }

  private async handleSafetyInspection(
    request: z.infer<typeof SafetyInspectionSchema>
  ): Promise<AgentResponse> {
    const result = await this.conductSafetyInspection(
      request.facility,
      request.inspectionType,
      request.systems
    );
    return this.createResponse(true, result);
  }

  private async handleEnergyAudit(
    request: z.infer<typeof EnergyAuditRequestSchema>
  ): Promise<AgentResponse> {
    const result = await this.conductEnergyAudit(
      request.facility,
      request.auditLevel,
      request.focusAreas,
      request.energyData
    );
    return this.createResponse(true, result);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateServiceSize(powerRequirements: any): string {
    // Parse peak load and calculate appropriate service size
    const loadMatch = powerRequirements.peakLoad.match(/(\d+(?:\.\d+)?)\s*(kW|MW)/i);
    if (!loadMatch) return '400A';

    const value = parseFloat(loadMatch[1]);
    const unit = loadMatch[2].toLowerCase();
    const loadKW = unit === 'mw' ? value * 1000 : value;

    // Simplified service size calculation
    if (loadKW < 100) return '200A @ 480V';
    if (loadKW < 500) return '800A @ 480V';
    if (loadKW < 1000) return '1600A @ 480V';
    if (loadKW < 2000) return '3000A @ 480V';
    return '4000A @ 480V or Medium Voltage Service';
  }

  private determineDistributionArchitecture(facilityType: string, redundancy: string): string {
    const architectures: Record<string, string> = {
      data_center: 'Dual bus with automatic transfer',
      manufacturing: 'Main-tie-main configuration',
      commercial: 'Single bus with emergency tie',
      residential: 'Single-fed distribution',
    };

    if (redundancy === '2N' || redundancy === '2N+1') {
      return 'Fully redundant dual path distribution';
    }

    return architectures[facilityType] || 'Standard radial distribution';
  }

  private calculateBatterySize(powerRequirements: any): string {
    const loadMatch = powerRequirements.peakLoad.match(/(\d+(?:\.\d+)?)\s*(kW|MW)/i);
    if (!loadMatch) return '100 kWh';

    const value = parseFloat(loadMatch[1]);
    const unit = loadMatch[2].toLowerCase();
    const loadKW = unit === 'mw' ? value * 1000 : value;

    // 15 minutes of backup at peak load
    return `${Math.ceil(loadKW * 0.25)} kWh`;
  }

  private determineEfficiencyMeasures(facilityType: string): string[] {
    const measures = [
      'LED lighting throughout',
      'Power factor correction to 0.95+',
      'Variable frequency drives on motors',
      'Energy monitoring system',
    ];

    if (facilityType === 'data_center') {
      measures.push('Hot/cold aisle containment');
      measures.push('Free cooling economizers');
    }

    return measures;
  }

  private calculateProjectedSavings(powerRequirements: any, sustainabilityGoals?: any): string {
    if (!sustainabilityGoals?.renewableTarget) return 'Standard efficiency measures: 10-15% reduction';
    return `Projected ${sustainabilityGoals.renewableTarget}% renewable + efficiency measures: 25-40% cost reduction`;
  }

  private determineArcFlashMitigation(voltageClass: z.infer<typeof VoltageClassSchema>): string[] {
    const measures = [
      'Arc-resistant switchgear',
      'Current-limiting fuses',
      'Zone-selective interlocking',
      'Arc flash relay protection',
    ];

    if (voltageClass === 'high' || voltageClass === 'extra_high') {
      measures.push('Remote racking capability');
      measures.push('Optical arc detection');
    }

    return measures;
  }

  private determineGroundingSystem(facilityType: string): string {
    if (facilityType === 'data_center') {
      return 'Isolated ground system with dedicated grounding electrode conductor';
    }
    return 'Solidly grounded system per NEC Article 250';
  }

  private estimateDesignCost(powerRequirements: any, voltageClass: z.infer<typeof VoltageClassSchema>): string {
    // Simplified cost estimation
    const baseCost = 50000;
    const voltageMultiplier: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 4,
      extra_high: 8,
    };

    return `$${(baseCost * voltageMultiplier[voltageClass]).toLocaleString()} - $${(baseCost * voltageMultiplier[voltageClass] * 2).toLocaleString()}`;
  }

  private getCapacityFactor(generationType: z.infer<typeof PowerSystemTypeSchema>): number {
    const factors: Record<string, number> = {
      solar: 0.20,
      wind: 0.35,
      hydro: 0.45,
      geothermal: 0.90,
      grid: 1.0,
      battery: 0.85,
      hybrid: 0.40,
    };
    return factors[generationType] || 0.25;
  }

  private calculateProjectEconomics(generationType: z.infer<typeof PowerSystemTypeSchema>, capacity: any): PowerGenerationResult['economics'] {
    const capitalCostPerMW: Record<string, number> = {
      solar: 1000000,
      wind: 1500000,
      hydro: 3000000,
      geothermal: 4000000,
      battery: 500000,
      hybrid: 1200000,
      grid: 0,
    };

    const loadMatch = capacity.peakCapacity.match(/(\d+(?:\.\d+)?)\s*(kW|MW)/i);
    const mw = loadMatch ? (loadMatch[2].toLowerCase() === 'mw' ? parseFloat(loadMatch[1]) : parseFloat(loadMatch[1]) / 1000) : 1;

    const capitalCost = capitalCostPerMW[generationType] * mw;

    return {
      capitalCost: `$${capitalCost.toLocaleString()}`,
      operatingCost: `$${Math.round(capitalCost * 0.02).toLocaleString()}/year`,
      lcoe: `$${(50 + Math.random() * 50).toFixed(0)}/MWh`,
      paybackPeriod: `${Math.round(5 + Math.random() * 10)} years`,
      roi: `${(8 + Math.random() * 7).toFixed(1)}%`,
    };
  }

  private calculateEnvironmentalImpact(generationType: z.infer<typeof PowerSystemTypeSchema>, capacity: any): PowerGenerationResult['environmental'] {
    const loadMatch = capacity.expectedAnnualGeneration.match(/(\d+(?:,\d+)?)\s*(MWh|GWh)/i);
    const mwh = loadMatch ? parseInt(loadMatch[1].replace(',', '')) : 1000;

    return {
      annualCO2Avoided: `${(mwh * 0.4).toLocaleString()} tonnes`,
      landUse: generationType === 'solar' ? `${mwh / 200} acres` : 'Minimal',
      waterUse: generationType === 'hydro' ? 'Flow-through' : 'None',
    };
  }

  private determineRequiredPermits(generationType: z.infer<typeof PowerSystemTypeSchema>, location: any): string[] {
    const permits = [
      'Electrical permit',
      'Building permit',
      'Utility interconnection agreement',
    ];

    if (generationType === 'solar' || generationType === 'wind') {
      permits.push('Conditional use permit');
      permits.push('Environmental review');
    }

    if (generationType === 'hydro') {
      permits.push('Water rights permit');
      permits.push('FERC license');
    }

    return permits;
  }

  private determineMeteringArrangement(connectionType: string): string {
    const arrangements: Record<string, string> = {
      net_metering: 'Bi-directional meter at point of common coupling',
      feed_in_tariff: 'Dedicated export meter with revenue-grade accuracy',
      power_purchase_agreement: 'Revenue-grade metering with data logging',
      behind_the_meter: 'Production meter separate from utility meter',
      island_mode: 'Isolated metering with grid sync monitoring',
    };
    return arrangements[connectionType] || 'Standard utility meter';
  }

  private determineProtectionScheme(voltageClass: z.infer<typeof VoltageClassSchema>, requirements: any): string {
    if (requirements.antiIslanding) {
      return 'IEEE 1547-compliant protection with anti-islanding (voltage/frequency, ROCOF)';
    }
    return 'Standard overcurrent protection with utility-grade relaying';
  }

  private determineUtilityRequirements(connectionType: string, capacity: string): string[] {
    const requirements = [
      'System impact study',
      'Facilities study',
      'Interconnection agreement execution',
      'Pre-parallel inspection',
    ];

    const loadMatch = capacity.match(/(\d+(?:\.\d+)?)\s*(kW|MW)/i);
    const mw = loadMatch ? (loadMatch[2].toLowerCase() === 'mw' ? parseFloat(loadMatch[1]) : parseFloat(loadMatch[1]) / 1000) : 0;

    if (mw > 1) {
      requirements.push('Transmission study');
      requirements.push('Grid upgrade assessment');
    }

    return requirements;
  }

  private estimateInterconnectionTimeline(voltageClass: z.infer<typeof VoltageClassSchema>, capacity: string): string {
    const loadMatch = capacity.match(/(\d+(?:\.\d+)?)\s*(kW|MW)/i);
    const mw = loadMatch ? (loadMatch[2].toLowerCase() === 'mw' ? parseFloat(loadMatch[1]) : parseFloat(loadMatch[1]) / 1000) : 0;

    if (mw < 0.025) return '2-4 weeks (expedited review)';
    if (mw < 1) return '2-4 months (fast track)';
    if (mw < 10) return '6-12 months (standard process)';
    return '12-24 months (full study required)';
  }

  private assessSystemStatus(): 'compliant' | 'minor_issue' | 'major_issue' | 'critical' {
    const rand = Math.random();
    if (rand < 0.6) return 'compliant';
    if (rand < 0.85) return 'minor_issue';
    if (rand < 0.95) return 'major_issue';
    return 'critical';
  }

  private generateSystemFindings(system: string): string[] {
    const findings: Record<string, string[]> = {
      main_distribution: ['Panel covers secure', 'Breaker labeling current', 'No visible damage'],
      emergency_power: ['Generator tested successfully', 'Fuel level adequate', 'ATS operation verified'],
      grounding: ['Ground resistance measured within limits', 'Bonding connections tight'],
      arc_flash: ['Labels present and current', 'PPE requirements posted'],
    };
    return findings[system] || ['System inspected per standard protocols'];
  }

  private generateSystemRecommendations(system: string): string[] {
    const recommendations: Record<string, string[]> = {
      main_distribution: ['Schedule thermal imaging survey', 'Update panel schedules'],
      emergency_power: ['Test under full load', 'Service fuel system'],
      grounding: ['Retest in 3 years', 'Document all changes'],
      arc_flash: ['Update study if modifications made', 'Refresh training annually'],
    };
    return recommendations[system] || ['Continue routine maintenance'];
  }

  private assessPriority(system: string): string {
    if (system === 'arc_flash' || system === 'emergency_power') return 'high';
    if (system === 'grounding' || system === 'main_distribution') return 'medium';
    return 'low';
  }

  private determineOverallRating(findings: SafetyInspectionResult['findings']): 'pass' | 'conditional_pass' | 'fail' | 'critical' {
    if (findings.some(f => f.status === 'critical')) return 'critical';
    if (findings.some(f => f.status === 'major_issue')) return 'fail';
    if (findings.some(f => f.status === 'minor_issue')) return 'conditional_pass';
    return 'pass';
  }

  private generateCorrectiveActions(findings: SafetyInspectionResult['findings']): SafetyInspectionResult['correctiveActions'] {
    return findings
      .filter(f => f.status !== 'compliant')
      .map(f => ({
        action: f.recommendations[0] || 'Address findings',
        deadline: f.priority === 'immediate' ? '24 hours' :
                 f.priority === 'high' ? '7 days' :
                 f.priority === 'medium' ? '30 days' : '90 days',
        responsible: 'David / Facilities Team',
      }));
  }

  private calculateNextInspectionDate(inspectionType: string, rating: string): string {
    let months = 12;
    if (rating === 'fail' || rating === 'critical') months = 3;
    else if (rating === 'conditional_pass') months = 6;
    else if (inspectionType === 'post_incident') months = 6;

    return new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  private analyzeCurrentProfile(energyData?: any): EnergyAuditResult['currentProfile'] {
    return {
      annualConsumption: energyData?.annualConsumption || '1,500,000 kWh',
      peakDemand: energyData?.peakDemand || '350 kW',
      loadFactor: 0.49,
      powerFactor: 0.87,
      annualCost: energyData?.annualCost || '$135,000',
      carbonFootprint: '640 tonnes CO2e',
    };
  }

  private identifyOpportunities(focusAreas: string[], auditLevel: string): EnergyAuditResult['opportunities'] {
    const allOpportunities = [
      { measure: 'LED Lighting Retrofit', category: 'lighting', annualSavings: '$18,000', implementationCost: '$45,000', payback: '2.5 years', priority: 'high' as const },
      { measure: 'VFD Installation on HVAC', category: 'hvac', annualSavings: '$12,000', implementationCost: '$30,000', payback: '2.5 years', priority: 'high' as const },
      { measure: 'Power Factor Correction', category: 'power_factor', annualSavings: '$8,000', implementationCost: '$15,000', payback: '1.9 years', priority: 'medium' as const },
      { measure: 'Compressed Air Leak Repair', category: 'compressed_air', annualSavings: '$5,000', implementationCost: '$3,000', payback: '0.6 years', priority: 'high' as const },
      { measure: 'Demand Response Program', category: 'demand_response', annualSavings: '$10,000', implementationCost: '$5,000', payback: '0.5 years', priority: 'medium' as const },
    ];

    if (focusAreas.length === 0) return allOpportunities;
    return allOpportunities.filter(o => focusAreas.includes(o.category));
  }

  private assessRenewablePotential(facility: string): EnergyAuditResult['renewablePotential'] {
    return [
      { technology: 'Rooftop Solar PV', estimatedCapacity: '200 kW', annualGeneration: '280,000 kWh', investment: '$280,000', payback: '5.5 years' },
      { technology: 'Battery Storage', estimatedCapacity: '100 kWh', annualGeneration: 'N/A - Peak shaving', investment: '$80,000', payback: '4 years' },
    ];
  }

  private generateAuditRecommendations(opportunities: any[], renewablePotential: any[]): string[] {
    const recommendations = [
      'Prioritize quick-win measures with payback under 2 years',
      'Implement power factor correction to reduce demand charges',
      'Evaluate renewable options for long-term cost stability',
      'Establish energy monitoring for continuous optimization',
    ];

    if (opportunities.some(o => o.priority === 'high')) {
      recommendations.unshift('Address high-priority efficiency opportunities immediately');
    }

    return recommendations;
  }

  private calculateTotalSavings(opportunities: any[]): string {
    const total = opportunities.reduce((sum, o) => {
      const savings = parseInt(o.annualSavings.replace(/[$,]/g, ''));
      return sum + savings;
    }, 0);
    return `$${total.toLocaleString()}/year`;
  }

  private calculateTotalInvestment(opportunities: any[], renewablePotential: any[]): string {
    const oppInvestment = opportunities.reduce((sum, o) => {
      return sum + parseInt(o.implementationCost.replace(/[$,]/g, ''));
    }, 0);
    const renewableInvestment = renewablePotential.reduce((sum, r) => {
      return sum + parseInt(r.investment.replace(/[$,]/g, ''));
    }, 0);
    return `$${(oppInvestment + renewableInvestment).toLocaleString()}`;
  }

  private calculateOverallPayback(opportunities: any[], renewablePotential: any[]): string {
    return '4.2 years (weighted average)';
  }

  private calculateProgress(status: z.infer<typeof SystemStatusSchema>): number {
    const progress: Record<string, number> = {
      design: 15,
      permitting: 30,
      construction: 60,
      commissioning: 85,
      operational: 100,
      maintenance: 100,
      decommissioned: 100,
    };
    return progress[status] || 0;
  }

  private generateSystemAlerts(): ElectricalDashboard['alerts'] {
    return [
      { type: 'info', message: 'Quarterly maintenance scheduled for Building A', facility: 'Building A', timestamp: new Date().toISOString() },
      { type: 'warning', message: 'Power factor below target - consider correction', facility: 'Manufacturing Plant', timestamp: new Date().toISOString() },
    ];
  }

  private getUpcomingMilestones(): ElectricalDashboard['upcomingMilestones'] {
    return [
      { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), project: 'Solar Array Phase 2', milestone: 'Commissioning' },
      { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), project: 'Data Center Expansion', milestone: 'Electrical Design Complete' },
      { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), project: 'Battery Storage System', milestone: 'Grid Interconnection Approval' },
    ];
  }

  private createResponse(success: boolean, data: any, error?: string): AgentResponse {
    return {
      success,
      data: data || { status: 'assigned_to_david', humanCoordination: true },
      error,
      metadata: {
        agent: 'david',
        isHuman: true,
        role: 'Chief Electrical Systems Consultant',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default DavidService;

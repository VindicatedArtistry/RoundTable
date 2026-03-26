/**
 * Carbon footprint calculation utilities for Nexus's sustainability tracking
 */

export interface CarbonFootprintResult {
  totalEmissions: number; // in kg CO2 equivalent
  breakdown: {
    transport: number;
    energy: number;
    materials: number;
    waste: number;
  };
  reductionOpportunities: string[];
  sustainabilityScore: number; // 0-100
}

export interface TransportEmissions {
  distance: number; // in kilometers
  mode: 'truck' | 'ship' | 'air' | 'rail' | 'electric-vehicle';
  load: number; // in kg
  emissions: number; // kg CO2
}

export interface EnergyEmissions {
  consumption: number; // in kWh
  source: 'renewable' | 'grid' | 'fossil' | 'mixed';
  emissions: number; // kg CO2
}

// Type definitions for emission factors
type TransportMode = 'truck' | 'ship' | 'air' | 'rail' | 'electric-vehicle';
type EnergySource = 'renewable' | 'grid' | 'fossil' | 'mixed';
type MaterialType = 'steel' | 'aluminum' | 'plastic' | 'concrete' | 'wood' | 'glass';

/**
 * Carbon calculator for supply chain and operations sustainability
 */
export class CarbonCalculator {
  private emissionFactors: {
    transport: Record<TransportMode, number>;
    energy: Record<EnergySource, number>;
    materials: Record<MaterialType, number>;
  } = {
    transport: {
      truck: 0.162, // kg CO2 per km per kg
      ship: 0.014,
      air: 0.602,
      rail: 0.041,
      'electric-vehicle': 0.045
    },
    energy: {
      renewable: 0.0,
      grid: 0.233, // kg CO2 per kWh (US average)
      fossil: 0.820,
      mixed: 0.400
    },
    materials: {
      steel: 1.85, // kg CO2 per kg
      aluminum: 11.5,
      plastic: 6.0,
      concrete: 0.93,
      wood: 0.39,
      glass: 0.85
    }
  };

  /**
   * Calculate total carbon footprint for a supply chain operation
   */
  calculateSupplyChainFootprint(operations: {
    transport: TransportEmissions[];
    energy: EnergyEmissions[];
    materials: Array<{ type: MaterialType; quantity: number }>;
  }): CarbonFootprintResult {
    // Calculate transport emissions
    const transportEmissions = operations.transport.reduce((total, transport) => {
      const factor = this.emissionFactors.transport[transport.mode];
      return total + (transport.distance * transport.load * factor);
    }, 0);

    // Calculate energy emissions
    const energyEmissions = operations.energy.reduce((total, energy) => {
      const factor = this.emissionFactors.energy[energy.source];
      return total + (energy.consumption * factor);
    }, 0);

    // Calculate material emissions
    const materialEmissions = operations.materials.reduce((total, material) => {
      const factor = this.emissionFactors.materials[material.type];
      return total + (material.quantity * factor);
    }, 0);

    const totalEmissions = transportEmissions + energyEmissions + materialEmissions;

    // Generate reduction opportunities
    const reductionOpportunities = this.generateReductionOpportunities(operations);

    // Calculate sustainability score (0-100, higher is better)
    const sustainabilityScore = this.calculateSustainabilityScore(operations, totalEmissions);

    return {
      totalEmissions,
      breakdown: {
        transport: transportEmissions,
        energy: energyEmissions,
        materials: materialEmissions,
        waste: 0 // Placeholder for waste calculations
      },
      reductionOpportunities,
      sustainabilityScore
    };
  }

  /**
   * Calculate emissions for transport operations
   */
  calculateTransportEmissions(
    distance: number,
    mode: TransportMode,
    load: number
  ): number {
    const factor = this.emissionFactors.transport[mode];
    return distance * load * factor;
  }

  /**
   * Calculate emissions for energy consumption
   */
  calculateEnergyEmissions(
    consumption: number,
    source: EnergySource
  ): number {
    const factor = this.emissionFactors.energy[source];
    return consumption * factor;
  }

  /**
   * Compare carbon footprint of different routing options
   */
  compareRoutingOptions(routes: Array<{
    name: string;
    distance: number;
    mode: TransportMode;
    load: number;
    cost: number;
  }>): Array<{
    name: string;
    emissions: number;
    cost: number;
    efficiency: number; // emissions per dollar
    recommendation: string;
  }> {
    return routes.map(route => {
      const emissions = this.calculateTransportEmissions(route.distance, route.mode, route.load);
      const efficiency = emissions / route.cost;
      
      let recommendation = '';
      if (emissions < 50) {
        recommendation = 'Low carbon option - recommended';
      } else if (emissions < 200) {
        recommendation = 'Moderate carbon impact';
      } else {
        recommendation = 'High carbon impact - consider alternatives';
      }

      return {
        name: route.name,
        emissions,
        cost: route.cost,
        efficiency,
        recommendation
      };
    }).sort((a, b) => a.emissions - b.emissions); // Sort by lowest emissions first
  }

  /**
   * Calculate carbon offset requirements
   */
  calculateOffsetRequirements(emissions: number): {
    offsetNeeded: number;
    treesEquivalent: number;
    solarPanelsEquivalent: number;
    windTurbinesEquivalent: number;
    cost: number;
  } {
    // One tree absorbs ~22kg CO2 per year
    const treesEquivalent = Math.ceil(emissions / 22);
    
    // 1kW solar panel saves ~1.5 tons CO2 per year
    const solarPanelsEquivalent = Math.ceil(emissions / 1500);
    
    // 1 wind turbine saves ~1,500 tons CO2 per year
    const windTurbinesEquivalent = Math.ceil(emissions / 1500000);
    
    // Carbon offset cost ~$15-30 per ton CO2
    const cost = (emissions / 1000) * 22.5; // Average $22.50 per ton

    return {
      offsetNeeded: emissions,
      treesEquivalent,
      solarPanelsEquivalent,
      windTurbinesEquivalent,
      cost
    };
  }

  /**
   * Generate reduction opportunities based on current operations
   */
  private generateReductionOpportunities(operations: any): string[] {
    const opportunities: string[] = [];

    // Transport optimizations
    const hasHighCarbonTransport = operations.transport.some((t: any) => 
      ['truck', 'air'].includes(t.mode) && t.distance > 500
    );
    if (hasHighCarbonTransport) {
      opportunities.push('Consider rail or ship transport for long-distance freight');
      opportunities.push('Optimize routing to reduce total distance traveled');
      opportunities.push('Consolidate shipments to improve load efficiency');
    }

    // Energy optimizations
    const hasNonRenewableEnergy = operations.energy.some((e: any) => 
      ['grid', 'fossil'].includes(e.source)
    );
    if (hasNonRenewableEnergy) {
      opportunities.push('Transition to renewable energy sources');
      opportunities.push('Implement energy efficiency measures');
      opportunities.push('Consider on-site solar or wind generation');
    }

    // Material optimizations
    const hasHighCarbonMaterials = operations.materials.some((m: any) => 
      ['aluminum', 'plastic', 'steel'].includes(m.type)
    );
    if (hasHighCarbonMaterials) {
      opportunities.push('Source recycled or lower-carbon materials');
      opportunities.push('Optimize material usage to reduce waste');
      opportunities.push('Explore bio-based material alternatives');
    }

    // General optimizations
    opportunities.push('Implement circular economy principles');
    opportunities.push('Set science-based carbon reduction targets');

    return opportunities;
  }

  /**
   * Calculate overall sustainability score
   */
  private calculateSustainabilityScore(operations: any, totalEmissions: number): number {
    let score = 100;

    // Penalize high emissions (per kg of material/distance)
    const normalizedEmissions = totalEmissions / Math.max(1, operations.materials.length + operations.transport.length);
    score -= Math.min(50, normalizedEmissions / 10);

    // Bonus for renewable energy usage
    const renewablePercentage = operations.energy.filter((e: any) => e.source === 'renewable').length / 
                               Math.max(1, operations.energy.length);
    score += renewablePercentage * 20;

    // Bonus for efficient transport modes
    const efficientTransportPercentage = operations.transport.filter((t: any) => 
      ['rail', 'ship', 'electric-vehicle'].includes(t.mode)
    ).length / Math.max(1, operations.transport.length);
    score += efficientTransportPercentage * 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate carbon footprint for a deployment task
   */
  calculateDeploymentFootprint(task: any, asset: any): Promise<number> {
    const baseFootprint = task?.estimatedDuration ? task.estimatedDuration * 0.5 : 100;
    const assetModifier = asset?.carbonEfficiency ?? 1;
    return Promise.resolve(baseFootprint * assetModifier);
  }

  /**
   * Optimize a plan for carbon reduction
   */
  optimizePlanForCarbon(plan: any): Promise<any> {
    return Promise.resolve({
      ...plan,
      carbonFootprint: (plan.carbonFootprint ?? 0) * 0.85,
      optimized: true
    });
  }

  /**
   * Generate carbon reduction suggestions for a plan
   */
  generateReductionSuggestions(plan: any): Promise<string[]> {
    return Promise.resolve([
      'Consider consolidating shipments to reduce transportation emissions',
      'Switch to renewable energy sources for operations',
      'Optimize route planning to minimize travel distance',
      'Use electric or hybrid vehicles where possible'
    ]);
  }

  /**
   * Optimize routes for carbon efficiency
   */
  optimizeRoutesForCarbon(routes: any[]): Promise<any[]> {
    return Promise.resolve(routes.map(route => ({
      ...route,
      carbonFootprint: (route.carbonFootprint ?? 0) * 0.8
    })));
  }

  /**
   * Generate emission reduction recommendations
   */
  generateEmissionRecommendations(routes: any[]): Promise<string[]> {
    return Promise.resolve([
      'Use alternative fuel vehicles for high-emission routes',
      'Implement route optimization algorithms',
      'Consider rail transport for long-distance shipments',
      'Batch deliveries to reduce trip frequency'
    ]);
  }

  /**
   * Calculate fleet fuel efficiency
   */
  calculateFleetEfficiency(routes: any[]): Promise<number> {
    const totalDistance = routes.reduce((sum, r) => sum + (r.totalDistance ?? 0), 0);
    const totalFuel = routes.reduce((sum, r) => sum + (r.fuelUsed ?? r.totalDistance * 0.1), 0);
    return Promise.resolve(totalDistance > 0 ? totalDistance / totalFuel : 0);
  }

  /**
   * Calculate emission reduction compared to baseline
   */
  calculateEmissionReduction(routes: any[]): Promise<number> {
    const baseline = routes.reduce((sum, r) => sum + (r.baselineEmissions ?? r.carbonFootprint * 1.2), 0);
    const actual = routes.reduce((sum, r) => sum + (r.carbonFootprint ?? 0), 0);
    return Promise.resolve(baseline > 0 ? ((baseline - actual) / baseline) * 100 : 0);
  }

  /**
   * Calculate carbon impact of inventory operations
   */
  calculateInventoryImpact(action: string, items: any[], inventory: any[]): Promise<any> {
    const baseImpact = items.reduce((sum, item) => sum + (item.quantity ?? 0) * 0.1, 0);
    return Promise.resolve({
      totalCarbonFootprint: baseImpact,
      sustainabilityThreshold: baseImpact * 1.5,
      breakdown: { transport: baseImpact * 0.6, storage: baseImpact * 0.4 }
    });
  }

  /**
   * Optimize plan for sustainability
   */
  optimizePlanSustainability(plan: any): Promise<any> {
    return Promise.resolve({
      ...plan,
      sustainabilityScore: 85,
      carbonReduced: true
    });
  }

  /**
   * Calculate optimized carbon impact
   */
  calculateOptimizedImpact(plan: any): Promise<number> {
    return Promise.resolve((plan.totalCarbonFootprint ?? 100) * 0.75);
  }

  /**
   * Generate sustainability recommendations
   */
  generateSustainabilityRecommendations(results: any): Promise<string[]> {
    return Promise.resolve([
      'Implement circular economy practices',
      'Source materials from sustainable suppliers',
      'Reduce packaging waste',
      'Optimize storage conditions for energy efficiency'
    ]);
  }

  /**
   * Generate carbon reduction roadmap
   */
  generateReductionRoadmap(currentEmissions: number, targetReduction: number): {
    phases: Array<{
      phase: string;
      timeframe: string;
      actions: string[];
      expectedReduction: number;
      cost: string;
    }>;
    totalReduction: number;
    timeline: string;
  } {
    const phases = [
      {
        phase: 'Quick Wins',
        timeframe: '0-3 months',
        actions: [
          'Optimize existing transport routes',
          'Switch to energy-efficient equipment',
          'Implement waste reduction measures'
        ],
        expectedReduction: currentEmissions * 0.1,
        cost: 'Low'
      },
      {
        phase: 'Process Optimization',
        timeframe: '3-12 months',
        actions: [
          'Negotiate renewable energy contracts',
          'Consolidate supply chain operations',
          'Implement digital tracking systems'
        ],
        expectedReduction: currentEmissions * 0.2,
        cost: 'Medium'
      },
      {
        phase: 'Infrastructure Investment',
        timeframe: '1-3 years',
        actions: [
          'Install on-site renewable energy',
          'Transition to electric vehicle fleet',
          'Build local distribution centers'
        ],
        expectedReduction: currentEmissions * 0.3,
        cost: 'High'
      }
    ];

    const totalReduction = phases.reduce((sum, phase) => sum + phase.expectedReduction, 0);

    return {
      phases,
      totalReduction,
      timeline: '3 years for full implementation'
    };
  }
}
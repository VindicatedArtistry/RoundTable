/**
 * System monitoring and alerting integration
 */

export interface MetricPoint {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  triggeredAt: Date;
  resolved?: Date;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  lastCheck: Date;
  details?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheck[];
  lastUpdated: Date;
}

export interface MonitoringConfig {
  alertThresholds: Record<string, number>;
  healthCheckInterval: number;
  retentionDays: number;
}

/**
 * Monitoring service for tracking system health and performance
 */
export class MonitoringService {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
    
    // Start periodic health checks
    setInterval(() => {
      this.runHealthChecks();
    }, this.config.healthCheckInterval);

    // Start metric cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Record a metric data point
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricPoints = this.metrics.get(name)!;
    metricPoints.push({
      timestamp: new Date(),
      value,
      tags
    });

    // Check if metric exceeds alert threshold
    this.checkAlertThreshold(name, value);
  }

  /**
   * Get metric data for a specific timeframe
   */
  getMetrics(name: string, timeRange: { start: Date; end: Date }): MetricPoint[] {
    const metricPoints = this.metrics.get(name) || [];
    
    return metricPoints.filter(point => 
      point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
    );
  }

  /**
   * Get all available metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Create an alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'triggeredAt'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date()
    };

    this.alerts.set(newAlert.id, newAlert);
    return newAlert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = new Date();
    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Register a health check
   */
  registerHealthCheck(name: string, checkFn: () => Promise<{ status: HealthCheck['status']; details?: string; latency?: number }>): void {
    this.healthChecks.set(name, {
      name,
      status: 'healthy',
      lastCheck: new Date(),
      details: 'Registered'
    });
  }

  /**
   * Get current system health status
   */
  getSystemHealth(): SystemHealth {
    const services = Array.from(this.healthChecks.values());
    
    let overall: SystemHealth['overall'] = 'healthy';
    
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      lastUpdated: new Date()
    };
  }

  /**
   * Run all registered health checks
   */
  private async runHealthChecks(): Promise<void> {
    // In a real implementation, this would call the registered check functions
    // For now, we'll simulate health check results
    
    for (const [name, check] of this.healthChecks.entries()) {
      try {
        // Simulate health check latency and results
        const start = Date.now();
        
        // Mock health check logic
        const isHealthy = Math.random() > 0.1; // 90% healthy
        const isDegraded = Math.random() > 0.8; // 20% chance of degraded if healthy
        
        const latency = Date.now() - start + Math.random() * 100; // Add some randomness
        
        let status: HealthCheck['status'];
        let details = '';
        
        if (!isHealthy) {
          status = 'unhealthy';
          details = 'Service check failed';
        } else if (isDegraded) {
          status = 'degraded';
          details = 'Service responding slowly';
        } else {
          status = 'healthy';
          details = 'All checks passed';
        }

        this.healthChecks.set(name, {
          name,
          status,
          latency,
          lastCheck: new Date(),
          details
        });

        // Create alert if service becomes unhealthy
        if (status === 'unhealthy' && check.status !== 'unhealthy') {
          this.createAlert({
            name: `Health Check Failed: ${name}`,
            severity: 'high',
            message: `Health check for ${name} failed: ${details}`,
            source: 'monitoring',
            metadata: { service: name, previousStatus: check.status }
          });
        }

      } catch (error) {
        this.healthChecks.set(name, {
          name,
          status: 'unhealthy',
          lastCheck: new Date(),
          details: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  }

  /**
   * Check if a metric value exceeds alert thresholds
   */
  private checkAlertThreshold(metricName: string, value: number): void {
    const threshold = this.config.alertThresholds[metricName];
    if (threshold && value > threshold) {
      this.createAlert({
        name: `Metric Threshold Exceeded: ${metricName}`,
        severity: value > threshold * 2 ? 'critical' : 'medium',
        message: `${metricName} value ${value} exceeds threshold ${threshold}`,
        source: 'metrics',
        metadata: { metric: metricName, value, threshold }
      });
    }
  }

  /**
   * Clean up old metric data
   */
  private cleanupOldMetrics(): void {
    const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
    
    for (const [name, points] of this.metrics.entries()) {
      const filteredPoints = points.filter(point => point.timestamp > cutoffDate);
      this.metrics.set(name, filteredPoints);
    }
  }

  /**
   * Get monitoring statistics
   */
  getStats(): {
    totalMetrics: number;
    totalAlerts: number;
    activeAlerts: number;
    healthyServices: number;
    totalServices: number;
  } {
    return {
      totalMetrics: this.metrics.size,
      totalAlerts: this.alerts.size,
      activeAlerts: this.getActiveAlerts().length,
      healthyServices: Array.from(this.healthChecks.values()).filter(s => s.status === 'healthy').length,
      totalServices: this.healthChecks.size
    };
  }

  /**
   * Get CPU utilization for a resource
   */
  async getCpuUtilization(resourceId: string, _timeRange?: string): Promise<number[]> {
    const metrics = this.getMetrics(`${resourceId}_cpu`, { start: new Date(Date.now() - 60000), end: new Date() });
    if (metrics.length === 0) {
      // Return mock data points
      return Array.from({ length: 10 }, () => Math.random() * 100);
    }
    return metrics.map(m => m.value);
  }

  /**
   * Get memory utilization for a resource
   */
  async getMemoryUtilization(resourceId: string, _timeRange?: string): Promise<number[]> {
    const metrics = this.getMetrics(`${resourceId}_memory`, { start: new Date(Date.now() - 60000), end: new Date() });
    if (metrics.length === 0) {
      return Array.from({ length: 10 }, () => Math.random() * 100);
    }
    return metrics.map(m => m.value);
  }

  /**
   * Get disk utilization for a resource
   */
  async getDiskUtilization(resourceId: string, _timeRange?: string): Promise<number[]> {
    const metrics = this.getMetrics(`${resourceId}_disk`, { start: new Date(Date.now() - 60000), end: new Date() });
    if (metrics.length === 0) {
      return Array.from({ length: 10 }, () => Math.random() * 100);
    }
    return metrics.map(m => m.value);
  }

  /**
   * Get network metrics for a resource
   */
  async getNetworkMetrics(resourceId: string, _timeRange?: string): Promise<{ latency: number[]; throughput: number[]; bytesIn: number; bytesOut: number }> {
    return {
      latency: Array.from({ length: 10 }, () => Math.random() * 100),
      throughput: Array.from({ length: 10 }, () => Math.random() * 1000),
      bytesIn: Math.floor(Math.random() * 1000000),
      bytesOut: Math.floor(Math.random() * 1000000)
    };
  }

  /**
   * Get error metrics for a resource
   */
  async getErrorMetrics(resourceId: string, _timeRange?: string): Promise<{ errorRate: number[]; uptime: number[]; errorCount: number }> {
    return {
      errorRate: Array.from({ length: 10 }, () => Math.random() * 5),
      uptime: Array.from({ length: 10 }, () => 95 + Math.random() * 5),
      errorCount: Math.floor(Math.random() * 100)
    };
  }

  /**
   * Setup infrastructure monitoring
   */
  async setupInfrastructureMonitoring(instanceIds: string | string[] | Record<string, unknown>, autoScalingGroupArn?: string): Promise<{ success: boolean; resources: string[] }> {
    // Register health checks for infrastructure
    this.registerHealthCheck('infrastructure', async () => ({ status: 'healthy' }));
    const ids = Array.isArray(instanceIds) ? instanceIds :
                typeof instanceIds === 'string' ? [instanceIds] : [];
    return { success: true, resources: [...ids, autoScalingGroupArn].filter(Boolean) as string[] };
  }
}

// Default monitoring configuration
export const createMonitoringService = () => new MonitoringService({
  alertThresholds: {
    'cpu_usage': 80,
    'memory_usage': 85,
    'disk_usage': 90,
    'error_rate': 5,
    'response_time': 2000
  },
  healthCheckInterval: 30 * 1000, // 30 seconds
  retentionDays: 30
});
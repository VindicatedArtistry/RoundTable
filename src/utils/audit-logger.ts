/**
 * Audit logging utilities for Sterling's financial operations
 */

import { createLogger } from './logger';

const logger = createLogger('AuditLogger');

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'error';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  outcome?: 'success' | 'failure' | 'error';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
  offset?: number;
}

/**
 * Audit logger for financial operations
 */
export class AuditLogger {
  private auditStorage: AuditEvent[] = []; // In-memory storage for demo
  private serviceName: string;

  constructor(serviceName: string = 'audit') {
    this.serviceName = serviceName;
  }

  /**
   * Simple log method for compatibility
   */
  async log(data: {
    userId: string;
    action: string;
    resource: string;
    outcome: 'success' | 'failure' | 'error';
    details?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      outcome: data.outcome,
      details: data.details || {},
      riskLevel: 'low'
    });
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    // Store audit event (in production, this would go to a secure audit database)
    this.auditStorage.push(auditEvent);

    // Also log to application logger based on risk level
    const logMethod = this.getLogMethod(event.riskLevel);
    logMethod('Audit Event', {
      auditId: auditEvent.id,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      outcome: event.outcome,
      riskLevel: event.riskLevel,
      details: event.details
    });

    // Alert on high-risk events
    if (event.riskLevel === 'critical' || event.riskLevel === 'high') {
      await this.alertHighRiskEvent(auditEvent);
    }
  }

  /**
   * Log financial transaction audit
   */
  async logTransaction(data: {
    userId: string;
    transactionType: string;
    amount: number;
    currency: string;
    fromAccount?: string;
    toAccount?: string;
    outcome: 'success' | 'failure' | 'error';
    errorDetails?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logEvent({
      userId: data.userId,
      action: 'financial_transaction',
      resource: `transaction_${data.transactionType}`,
      details: {
        transactionType: data.transactionType,
        amount: data.amount,
        currency: data.currency,
        fromAccount: data.fromAccount,
        toAccount: data.toAccount,
        errorDetails: data.errorDetails
      },
      outcome: data.outcome,
      riskLevel: this.calculateTransactionRiskLevel(data),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  }

  /**
   * Log investment decision audit
   */
  async logInvestmentDecision(data: {
    userId: string;
    investmentId: string;
    action: 'buy' | 'sell' | 'hold' | 'rebalance';
    amount: number;
    reasoning: string;
    outcome: 'success' | 'failure' | 'error';
    riskScore: number;
    esgScore?: number;
    ipAddress?: string;
  }): Promise<void> {
    await this.logEvent({
      userId: data.userId,
      action: 'investment_decision',
      resource: `investment_${data.investmentId}`,
      details: {
        investmentId: data.investmentId,
        action: data.action,
        amount: data.amount,
        reasoning: data.reasoning,
        riskScore: data.riskScore,
        esgScore: data.esgScore
      },
      outcome: data.outcome,
      riskLevel: this.calculateInvestmentRiskLevel(data),
      ipAddress: data.ipAddress
    });
  }

  /**
   * Log access to sensitive financial data
   */
  async logDataAccess(data: {
    userId: string;
    dataType: string;
    resourceId: string;
    operation: 'read' | 'write' | 'delete';
    outcome: 'success' | 'failure' | 'error';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logEvent({
      userId: data.userId,
      action: 'data_access',
      resource: `${data.dataType}_${data.resourceId}`,
      details: {
        dataType: data.dataType,
        resourceId: data.resourceId,
        operation: data.operation
      },
      outcome: data.outcome,
      riskLevel: this.calculateDataAccessRiskLevel(data),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    let filteredEvents = this.auditStorage;

    // Apply filters
    if (query.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === query.userId);
    }
    if (query.action) {
      filteredEvents = filteredEvents.filter(e => e.action === query.action);
    }
    if (query.resource) {
      const resourceFilter = query.resource;
      filteredEvents = filteredEvents.filter(e => e.resource.includes(resourceFilter));
    }
    if (query.outcome) {
      filteredEvents = filteredEvents.filter(e => e.outcome === query.outcome);
    }
    if (query.riskLevel) {
      filteredEvents = filteredEvents.filter(e => e.riskLevel === query.riskLevel);
    }
    if (query.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filteredEvents.length;
    const limit = query.limit || 100;
    const offset = query.offset || 0;

    const events = filteredEvents.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { events, total, hasMore };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(query: AuditQuery): Promise<{
    summary: {
      totalEvents: number;
      successRate: number;
      failureRate: number;
      riskDistribution: Record<string, number>;
      topActions: Array<{ action: string; count: number }>;
      topUsers: Array<{ userId: string; count: number }>;
    };
    events: AuditEvent[];
  }> {
    const result = await this.queryEvents({ ...query, limit: 10000 });
    const events = result.events;

    const summary = {
      totalEvents: events.length,
      successRate: events.filter(e => e.outcome === 'success').length / events.length,
      failureRate: events.filter(e => e.outcome === 'failure').length / events.length,
      riskDistribution: this.calculateRiskDistribution(events),
      topActions: this.calculateTopActions(events),
      topUsers: this.calculateTopUsers(events)
    };

    return { summary, events: events.slice(0, query.limit || 100) };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get log method based on risk level
   */
  private getLogMethod(riskLevel: string): (message: string, meta?: Record<string, unknown>) => void {
    switch (riskLevel) {
      case 'critical': return logger.error.bind(logger);
      case 'high': return logger.warn.bind(logger);
      case 'medium': return logger.info.bind(logger);
      case 'low': return logger.debug.bind(logger);
      default: return logger.info.bind(logger);
    }
  }

  /**
   * Calculate transaction risk level
   */
  private calculateTransactionRiskLevel(data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (data.amount > 1000000) return 'critical';
    if (data.amount > 100000) return 'high';
    if (data.amount > 10000) return 'medium';
    return 'low';
  }

  /**
   * Calculate investment risk level
   */
  private calculateInvestmentRiskLevel(data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (data.riskScore > 0.8) return 'critical';
    if (data.riskScore > 0.6) return 'high';
    if (data.riskScore > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Calculate data access risk level
   */
  private calculateDataAccessRiskLevel(data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (data.operation === 'delete') return 'high';
    if (data.dataType.includes('financial') || data.dataType.includes('sensitive')) return 'medium';
    return 'low';
  }

  /**
   * Alert on high-risk events
   */
  private async alertHighRiskEvent(event: AuditEvent): Promise<void> {
    // In production, this would send alerts to security team
    logger.error('HIGH RISK AUDIT EVENT', {
      eventId: event.id,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      riskLevel: event.riskLevel,
      details: event.details
    });
  }

  /**
   * Calculate risk distribution
   */
  private calculateRiskDistribution(events: AuditEvent[]): Record<string, number> {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    events.forEach(event => {
      distribution[event.riskLevel]++;
    });
    return distribution;
  }

  /**
   * Calculate top actions
   */
  private calculateTopActions(events: AuditEvent[]): Array<{ action: string; count: number }> {
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate top users
   */
  private calculateTopUsers(events: AuditEvent[]): Array<{ userId: string; count: number }> {
    const userCounts = events.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
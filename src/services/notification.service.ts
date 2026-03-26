/**
 * Notification service for TheRoundTable council communications
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('NotificationService');

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'ethical_alert' | 'compliance_violation';
  title: string;
  message: string;
  recipient: {
    type: 'user' | 'council_member' | 'admin' | 'all';
    id?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: Array<'email' | 'sms' | 'push' | 'in_app' | 'webhook'>;
  data?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'expired';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: Notification['type'];
  title: string;
  messageTemplate: string;
  defaultChannels: Notification['channels'];
  variables: string[];
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  };
  types: {
    info: boolean;
    warning: boolean;
    error: boolean;
    success: boolean;
    ethical_alert: boolean;
    compliance_violation: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  deliveryRate: number;
}

/**
 * Notification service for handling various types of notifications
 */
export class NotificationService {
  private notifications: Notification[] = [];
  private templates: NotificationTemplate[] = [];
  private preferences: Map<string, NotificationPreferences> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Simple send interface for compatibility
   */
  async send(options: {
    userId: string;
    type: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.sendNotification({
      type: options.type as Notification['type'] || 'info',
      title: options.title,
      message: options.content,
      recipient: { type: 'user', id: options.userId },
      priority: 'medium',
      channels: ['in_app'],
      data: options.metadata
    });
  }

  /**
   * Send a notification
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const notificationId = this.generateNotificationId();
    
    const fullNotification: Notification = {
      id: notificationId,
      createdAt: new Date(),
      status: 'pending',
      ...notification
    };

    // Check if notification should be sent based on preferences
    if (!await this.shouldSendNotification(fullNotification)) {
      fullNotification.status = 'failed';
      logger.info('Notification skipped due to user preferences', {
        notificationId,
        recipient: fullNotification.recipient
      });
      return notificationId;
    }

    this.notifications.push(fullNotification);

    // Send notification asynchronously
    this.processNotification(fullNotification);

    logger.info('Notification queued', {
      notificationId,
      type: fullNotification.type,
      priority: fullNotification.priority,
      recipient: fullNotification.recipient
    });

    return notificationId;
  }

  /**
   * Send notification using template
   */
  async sendFromTemplate(
    templateId: string,
    recipient: Notification['recipient'],
    variables: Record<string, string>,
    options?: {
      priority?: Notification['priority'];
      channels?: Notification['channels'];
      scheduledAt?: Date;
    }
  ): Promise<string> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in message template
    let message = template.messageTemplate;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.sendNotification({
      type: template.type,
      title: template.title,
      message,
      recipient,
      priority: options?.priority || 'medium',
      channels: options?.channels || template.defaultChannels,
      scheduledAt: options?.scheduledAt,
      data: variables
    });
  }

  /**
   * Send ethical alert
   */
  async sendEthicalAlert(
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    data?: Record<string, any>
  ): Promise<string> {
    const priority: Notification['priority'] = severity === 'critical' ? 'critical' : 
                                              severity === 'high' ? 'high' : 'medium';

    return this.sendNotification({
      type: 'ethical_alert',
      title: `🛡️ Ethical Alert: ${title}`,
      message,
      recipient: { type: 'admin' },
      priority,
      channels: severity === 'critical' ? ['email', 'sms', 'push', 'in_app'] : 
                severity === 'high' ? ['email', 'push', 'in_app'] : ['in_app'],
      data
    });
  }

  /**
   * Send compliance violation notification
   */
  async sendComplianceViolation(
    violation: {
      type: string;
      severity: string;
      description: string;
      principle: string;
      evidence: string[];
    }
  ): Promise<string> {
    return this.sendFromTemplate(
      'compliance_violation',
      { type: 'admin' },
      {
        violationType: violation.type,
        severity: violation.severity,
        description: violation.description,
        principle: violation.principle,
        evidence: violation.evidence.join(', ')
      },
      {
        priority: violation.severity === 'critical' ? 'critical' : 'high',
        channels: ['email', 'in_app']
      }
    );
  }

  /**
   * Send council member alert
   */
  async sendCouncilAlert(
    councilMember: string,
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium'
  ): Promise<string> {
    return this.sendNotification({
      type: 'info',
      title: `🏛️ Council Alert: ${title}`,
      message,
      recipient: { type: 'council_member', id: councilMember },
      priority,
      channels: ['in_app', 'email'],
      data: { councilMember }
    });
  }

  /**
   * Escalate ethical risk - sends high-priority notifications to all relevant parties
   */
  async escalateRisk(risk: any): Promise<void> {
    const title = `Critical Ethical Risk: ${risk.entityType} ${risk.entityId}`;
    const message = `High-severity ethical risk flagged: ${risk.description}. ` +
      `Risk factors: ${risk.riskFactors.join(', ')}. ` +
      `Immediate action required.`;

    // Send to administrators
    await this.sendEthicalAlert(
      title,
      message,
      risk.severity || 'critical',
      {
        riskId: risk.id,
        entityId: risk.entityId,
        entityType: risk.entityType,
        escalated: true
      }
    );

    // Send to council members
    await this.sendNotification({
      type: 'ethical_alert',
      title: `🚨 ESCALATED: ${title}`,
      message: `${message} This risk has been escalated for immediate council attention.`,
      recipient: { type: 'all' },
      priority: 'critical',
      channels: ['email', 'sms', 'push', 'in_app'],
      data: {
        escalated: true,
        risk: {
          id: risk.id,
          entityId: risk.entityId,
          entityType: risk.entityType,
          severity: risk.severity,
          riskFactors: risk.riskFactors
        }
      }
    });
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.notifications.find(n => n.id === notificationId) || null;
  }

  /**
   * Get notifications for recipient
   */
  async getNotificationsForRecipient(
    recipient: Notification['recipient'],
    filters?: {
      type?: Notification['type'];
      status?: Notification['status'];
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    let filtered = this.notifications.filter(n => 
      n.recipient.type === recipient.type &&
      (recipient.id ? n.recipient.id === recipient.id : true)
    );

    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }
    if (filters?.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const notifications = filtered.slice(offset, offset + limit);

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.data = { ...notification.data, readAt: new Date() };
      
      logger.info('Notification marked as read', {
        notificationId,
        readAt: notification.data.readAt
      });
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    this.preferences.set(userId, preferences);
    
    logger.info('Notification preferences updated', {
      userId,
      preferences
    });
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Get notification statistics
   */
  async getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: Notification['type'];
  }): Promise<NotificationStats> {
    let filtered = [...this.notifications];

    if (filters?.startDate) {
      filtered = filtered.filter(n => n.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(n => n.createdAt <= filters.endDate!);
    }
    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    const total = filtered.length;
    const sent = filtered.filter(n => n.status === 'sent').length;
    const failed = filtered.filter(n => n.status === 'failed').length;
    const pending = filtered.filter(n => n.status === 'pending').length;

    const byType = filtered.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byChannel = filtered.reduce((acc, n) => {
      n.channels.forEach(channel => {
        acc[channel] = (acc[channel] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const deliveryRate = total > 0 ? sent / total : 0;

    return {
      total,
      sent,
      failed,
      pending,
      byType,
      byChannel,
      deliveryRate
    };
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const scheduledNotifications = this.notifications.filter(n => 
      n.status === 'pending' && 
      n.scheduledAt && 
      n.scheduledAt <= now
    );

    for (const notification of scheduledNotifications) {
      await this.processNotification(notification);
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    const expiredCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );

    const removedCount = expiredCount - this.notifications.length;
    
    if (removedCount > 0) {
      logger.info('Cleaned up expired notifications', {
        removedCount
      });
    }
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'compliance_violation',
        name: 'Compliance Violation Alert',
        type: 'compliance_violation',
        title: '⚠️ Compliance Violation Detected',
        messageTemplate: 'A {{severity}} compliance violation has been detected: {{description}}. Principle violated: {{principle}}. Evidence: {{evidence}}',
        defaultChannels: ['email', 'in_app'],
        variables: ['severity', 'description', 'principle', 'evidence']
      },
      {
        id: 'ethical_review_required',
        name: 'Ethical Review Required',
        type: 'ethical_alert',
        title: '🛡️ Ethical Review Required',
        messageTemplate: 'An ethical review is required for: {{decision}}. Risk level: {{riskLevel}}. Stakeholders: {{stakeholders}}',
        defaultChannels: ['email', 'in_app'],
        variables: ['decision', 'riskLevel', 'stakeholders']
      },
      {
        id: 'council_decision',
        name: 'Council Decision Notification',
        type: 'info',
        title: '🏛️ Council Decision: {{title}}',
        messageTemplate: 'The council has made a decision regarding {{topic}}. Outcome: {{outcome}}. Next steps: {{nextSteps}}',
        defaultChannels: ['in_app', 'email'],
        variables: ['title', 'topic', 'outcome', 'nextSteps']
      },
      {
        id: 'system_alert',
        name: 'System Alert',
        type: 'warning',
        title: '🔧 System Alert: {{alertType}}',
        messageTemplate: 'System alert: {{description}}. Severity: {{severity}}. Action required: {{action}}',
        defaultChannels: ['email', 'sms', 'in_app'],
        variables: ['alertType', 'description', 'severity', 'action']
      }
    ];

    logger.info('Notification templates initialized', {
      templateCount: this.templates.length
    });
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private async shouldSendNotification(notification: Notification): Promise<boolean> {
    if (notification.recipient.type === 'user' && notification.recipient.id) {
      const preferences = await this.getPreferences(notification.recipient.id);
      
      // Check if notification type is enabled
      if (!preferences.types[notification.type]) {
        return false;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end) {
          // Only allow critical notifications during quiet hours
          return notification.priority === 'critical';
        }
      }
    }

    return true;
  }

  /**
   * Process individual notification
   */
  private async processNotification(notification: Notification): Promise<void> {
    try {
      // Mock notification sending - in production, this would integrate with actual services
      await new Promise(resolve => setTimeout(resolve, 100));

      notification.status = 'sent';
      notification.sentAt = new Date();

      logger.info('Notification sent successfully', {
        notificationId: notification.id,
        type: notification.type,
        channels: notification.channels,
        recipient: notification.recipient
      });
    } catch (error) {
      notification.status = 'failed';
      const err = error as Error;
      logger.error('Notification sending failed', {
        notificationId: notification.id,
        error: err.message,
        notification
      });
    }
  }

  /**
   * Generate notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        email: true,
        sms: false,
        push: true,
        in_app: true
      },
      types: {
        info: true,
        warning: true,
        error: true,
        success: true,
        ethical_alert: true,
        compliance_violation: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }
}
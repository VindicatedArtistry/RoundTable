import { EventEmitter } from 'events';
import { z } from 'zod';
import { AgentService, AgentResponse } from '../../types/agent';
import { createLogger, LoggerInterface } from '../../utils/logger';

/**
 * Graham - Chief Growth & Narrative Officer (Human Council Member)
 *
 * "The storyteller of a regenerative future, translating complex systems
 * into compelling narratives that connect on a soul level."
 *
 * Specializations:
 * - Sales Strategy
 * - Market Expansion
 * - Narrative Communication
 * - Growth Leadership
 *
 * This service coordinates growth initiatives, brand narratives,
 * and market expansion strategies across the ecosystem.
 */

// ============================================================================
// Validation Schemas
// ============================================================================

const CampaignStatusSchema = z.enum(['draft', 'planning', 'active', 'paused', 'completed', 'archived']);
const ContentTypeSchema = z.enum(['blog', 'whitepaper', 'case_study', 'video', 'podcast', 'social', 'press_release', 'presentation']);

const NarrativeCampaignSchema = z.object({
  type: z.literal('narrative_campaign'),
  campaignName: z.string().min(1, 'Campaign name is required'),
  objective: z.enum([
    'brand_awareness',
    'thought_leadership',
    'product_launch',
    'community_building',
    'investor_relations',
    'talent_acquisition',
    'partnership_development',
    'crisis_management'
  ]),
  targetAudience: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).optional(),
    personas: z.array(z.string()).optional(),
  }),
  coreMessage: z.string().min(10, 'Core message is required'),
  channels: z.array(z.enum([
    'website',
    'blog',
    'social_media',
    'email',
    'podcast',
    'video',
    'events',
    'press',
    'partner_networks'
  ])).min(1, 'At least one channel is required'),
  budget: z.string().optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const ContentCreationSchema = z.object({
  type: z.literal('content_creation'),
  contentType: ContentTypeSchema,
  title: z.string().min(1, 'Title is required'),
  topic: z.string().min(10, 'Topic description is required'),
  keyMessages: z.array(z.string()).min(1, 'At least one key message is required'),
  targetAudience: z.string(),
  callToAction: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  deadline: z.string().datetime().optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const GrowthInitiativeSchema = z.object({
  type: z.literal('growth_initiative'),
  initiativeName: z.string().min(1, 'Initiative name is required'),
  growthType: z.enum([
    'market_expansion',
    'customer_acquisition',
    'partnership_development',
    'product_market_fit',
    'community_growth',
    'revenue_optimization',
    'brand_positioning'
  ]),
  targetMetrics: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).optional(),
    baseline: z.string().optional(),
    goal: z.string(),
  }),
  strategy: z.string().min(20, 'Strategy description is required'),
  resources: z.array(z.string()).optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const StoryFrameworkSchema = z.object({
  type: z.literal('story_framework'),
  projectName: z.string().min(1, 'Project name is required'),
  storyType: z.enum([
    'origin_story',
    'transformation_journey',
    'impact_narrative',
    'vision_manifesto',
    'community_spotlight',
    'technical_explainer',
    'founder_journey'
  ]),
  protagonists: z.array(z.string()).min(1, 'At least one protagonist is required'),
  challenge: z.string().min(10, 'Challenge description is required'),
  resolution: z.string().min(10, 'Resolution description is required'),
  emotionalHook: z.string().optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const MarketAnalysisSchema = z.object({
  type: z.literal('market_analysis'),
  market: z.string().min(1, 'Market is required'),
  analysisType: z.enum([
    'opportunity_assessment',
    'competitive_landscape',
    'customer_research',
    'positioning_study',
    'trend_analysis',
    'go_to_market'
  ]),
  scope: z.object({
    regions: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional(),
    competitors: z.array(z.string()).optional(),
  }).optional(),
  deliverables: z.array(z.string()).optional(),
  requestedBy: z.string().min(1, 'Requester is required'),
});

const GrahamRequestSchema = z.discriminatedUnion('type', [
  NarrativeCampaignSchema,
  ContentCreationSchema,
  GrowthInitiativeSchema,
  StoryFrameworkSchema,
  MarketAnalysisSchema,
]);

type GrahamRequest = z.infer<typeof GrahamRequestSchema>;

// ============================================================================
// Result Interfaces
// ============================================================================

interface NarrativeCampaignResult {
  campaignId: string;
  campaignName: string;
  status: z.infer<typeof CampaignStatusSchema>;
  objective: string;
  narrative: {
    coreMessage: string;
    supportingMessages: string[];
    toneOfVoice: string;
    storytellingApproach: string;
  };
  contentPlan: {
    contentType: string;
    channel: string;
    frequency: string;
    responsible: string;
  }[];
  milestones: {
    phase: string;
    date: string;
    deliverables: string[];
  }[];
  metrics: {
    metric: string;
    target: string;
    current: string;
  }[];
  estimatedReach: string;
}

interface ContentResult {
  contentId: string;
  contentType: z.infer<typeof ContentTypeSchema>;
  title: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  outline: {
    section: string;
    keyPoints: string[];
  }[];
  seoStrategy: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    metaDescription: string;
    targetLength: string;
  };
  distribution: {
    channels: string[];
    schedule: string;
    amplification: string[];
  };
  estimatedDelivery: string;
}

interface GrowthInitiativeResult {
  initiativeId: string;
  initiativeName: string;
  growthType: string;
  status: 'planning' | 'active' | 'scaling' | 'optimizing' | 'completed';
  strategy: {
    approach: string;
    phases: string[];
    keyActivities: string[];
  };
  metrics: {
    metric: string;
    baseline: string;
    current: string;
    target: string;
    progress: number;
  }[];
  experiments: {
    name: string;
    hypothesis: string;
    status: 'planned' | 'running' | 'completed';
    results: string;
  }[];
  insights: string[];
  nextActions: string[];
}

interface StoryFrameworkResult {
  frameworkId: string;
  projectName: string;
  storyType: string;
  narrative: {
    setup: string;
    conflict: string;
    journey: string;
    transformation: string;
    resolution: string;
  };
  characters: {
    role: string;
    description: string;
    arc: string;
  }[];
  emotionalBeats: {
    moment: string;
    emotion: string;
    technique: string;
  }[];
  applications: {
    format: string;
    audience: string;
    adaptation: string;
  }[];
  coreThemes: string[];
}

interface MarketAnalysisResult {
  analysisId: string;
  market: string;
  analysisType: string;
  executiveSummary: string;
  findings: {
    category: string;
    insight: string;
    implication: string;
    confidence: 'high' | 'medium' | 'low';
  }[];
  opportunities: {
    opportunity: string;
    size: string;
    fit: 'strong' | 'moderate' | 'emerging';
    entryStrategy: string;
  }[];
  risks: {
    risk: string;
    likelihood: 'high' | 'medium' | 'low';
    mitigation: string;
  }[];
  recommendations: string[];
  nextSteps: string[];
}

interface GrowthDashboard {
  overallGrowthHealth: 'thriving' | 'growing' | 'stable' | 'challenging';
  keyMetrics: {
    metric: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    period: string;
  }[];
  activeCampaigns: {
    campaignId: string;
    name: string;
    status: z.infer<typeof CampaignStatusSchema>;
    performance: string;
  }[];
  contentPipeline: {
    stage: string;
    count: number;
    items: string[];
  }[];
  brandHealth: {
    awareness: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    shareOfVoice: string;
    netPromoterScore: number;
  };
  upcomingMilestones: {
    date: string;
    milestone: string;
    campaign: string;
  }[];
  topInsights: string[];
}

// ============================================================================
// Graham Service Implementation
// ============================================================================

export class GrahamService extends EventEmitter implements AgentService {
  private logger: LoggerInterface;
  private isInitialized = false;

  // In-memory stores
  private campaigns: Map<string, NarrativeCampaignResult> = new Map();
  private content: Map<string, ContentResult> = new Map();
  private growthInitiatives: Map<string, GrowthInitiativeResult> = new Map();
  private storyFrameworks: Map<string, StoryFrameworkResult> = new Map();
  private marketAnalyses: Map<string, MarketAnalysisResult> = new Map();

  constructor() {
    super();
    this.logger = createLogger('graham');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Graham service already initialized');
      return;
    }

    this.logger.info('Graham - Chief Growth & Narrative Officer (Human) initializing...');
    this.logger.info('Stories ready to inspire. Growth engines warming up.');

    this.isInitialized = true;
    this.emit('initialized', { timestamp: new Date().toISOString() });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Graham shutting down... The narrative continues.');
    this.isInitialized = false;
    this.emit('shutdown', { timestamp: new Date().toISOString() });
  }

  async processRequest(request: unknown): Promise<AgentResponse> {
    try {
      const validatedRequest = GrahamRequestSchema.parse(request);

      switch (validatedRequest.type) {
        case 'narrative_campaign':
          return this.handleNarrativeCampaign(validatedRequest);
        case 'content_creation':
          return this.handleContentCreation(validatedRequest);
        case 'growth_initiative':
          return this.handleGrowthInitiative(validatedRequest);
        case 'story_framework':
          return this.handleStoryFramework(validatedRequest);
        case 'market_analysis':
          return this.handleMarketAnalysis(validatedRequest);
        default:
          return this.createResponse(false, null, 'Unknown request type');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, `Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      this.logger.error('Error processing request:', { error });
      return this.createResponse(false, null, 'Internal growth & narrative service error');
    }
  }

  // ============================================================================
  // Core Growth & Narrative Functions
  // ============================================================================

  async createNarrativeCampaign(
    campaignName: string,
    objective: string,
    targetAudience: any,
    coreMessage: string,
    channels: string[]
  ): Promise<NarrativeCampaignResult> {
    const campaignId = `NRC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: NarrativeCampaignResult = {
      campaignId,
      campaignName,
      status: 'planning',
      objective,
      narrative: {
        coreMessage,
        supportingMessages: this.generateSupportingMessages(coreMessage, objective),
        toneOfVoice: this.determineToneOfVoice(objective, targetAudience),
        storytellingApproach: this.determineStorytellingApproach(objective),
      },
      contentPlan: this.generateContentPlan(channels, objective),
      milestones: this.generateCampaignMilestones(objective),
      metrics: this.defineCampaignMetrics(objective),
      estimatedReach: this.estimateCampaignReach(channels, targetAudience),
    };

    this.campaigns.set(campaignId, result);
    this.logger.info(`Narrative campaign ${campaignId} created: ${campaignName}`);
    this.emit('campaign_created', result);

    return result;
  }

  async createContent(
    contentType: z.infer<typeof ContentTypeSchema>,
    title: string,
    topic: string,
    keyMessages: string[],
    targetAudience: string
  ): Promise<ContentResult> {
    const contentId = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: ContentResult = {
      contentId,
      contentType,
      title,
      status: 'draft',
      outline: this.generateContentOutline(contentType, topic, keyMessages),
      seoStrategy: this.generateSEOStrategy(title, topic, keyMessages),
      distribution: {
        channels: this.determineDistributionChannels(contentType),
        schedule: 'To be determined based on content calendar',
        amplification: this.determineAmplificationStrategy(contentType),
      },
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.content.set(contentId, result);
    this.logger.info(`Content ${contentId} created: ${title} (${contentType})`);
    this.emit('content_created', result);

    return result;
  }

  async launchGrowthInitiative(
    initiativeName: string,
    growthType: string,
    targetMetrics: any,
    strategy: string
  ): Promise<GrowthInitiativeResult> {
    const initiativeId = `GRW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: GrowthInitiativeResult = {
      initiativeId,
      initiativeName,
      growthType,
      status: 'planning',
      strategy: {
        approach: strategy,
        phases: this.defineGrowthPhases(growthType),
        keyActivities: this.defineKeyActivities(growthType),
      },
      metrics: [{
        metric: targetMetrics.primary,
        baseline: targetMetrics.baseline || 'TBD',
        current: targetMetrics.baseline || 'TBD',
        target: targetMetrics.goal,
        progress: 0,
      }],
      experiments: this.planGrowthExperiments(growthType),
      insights: [],
      nextActions: this.generateNextActions(growthType),
    };

    this.growthInitiatives.set(initiativeId, result);
    this.logger.info(`Growth initiative ${initiativeId} launched: ${initiativeName}`);
    this.emit('growth_initiative_launched', result);

    return result;
  }

  async createStoryFramework(
    projectName: string,
    storyType: string,
    protagonists: string[],
    challenge: string,
    resolution: string
  ): Promise<StoryFrameworkResult> {
    const frameworkId = `STY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: StoryFrameworkResult = {
      frameworkId,
      projectName,
      storyType,
      narrative: {
        setup: this.craftSetup(storyType, protagonists),
        conflict: challenge,
        journey: this.craftJourney(storyType, challenge),
        transformation: this.craftTransformation(storyType),
        resolution,
      },
      characters: protagonists.map(p => ({
        role: p,
        description: `${p} - Key character in the narrative`,
        arc: this.defineCharacterArc(storyType),
      })),
      emotionalBeats: this.defineEmotionalBeats(storyType),
      applications: this.defineStoryApplications(storyType),
      coreThemes: this.extractCoreThemes(storyType, challenge, resolution),
    };

    this.storyFrameworks.set(frameworkId, result);
    this.logger.info(`Story framework ${frameworkId} created: ${projectName}`);
    this.emit('story_framework_created', result);

    return result;
  }

  async conductMarketAnalysis(
    market: string,
    analysisType: string,
    scope?: any
  ): Promise<MarketAnalysisResult> {
    const analysisId = `MKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result: MarketAnalysisResult = {
      analysisId,
      market,
      analysisType,
      executiveSummary: this.generateExecutiveSummary(market, analysisType),
      findings: this.generateMarketFindings(market, analysisType),
      opportunities: this.identifyOpportunities(market, analysisType),
      risks: this.assessMarketRisks(market, analysisType),
      recommendations: this.generateMarketRecommendations(market, analysisType),
      nextSteps: this.defineMarketNextSteps(analysisType),
    };

    this.marketAnalyses.set(analysisId, result);
    this.logger.info(`Market analysis ${analysisId} completed for ${market}`);
    this.emit('market_analysis_completed', result);

    return result;
  }

  async getDashboard(): Promise<GrowthDashboard> {
    return {
      overallGrowthHealth: 'growing',
      keyMetrics: [
        { metric: 'Brand Awareness', value: '45%', trend: 'up', period: 'Q4 2025' },
        { metric: 'Website Traffic', value: '125K/mo', trend: 'up', period: 'Last 30 days' },
        { metric: 'Content Engagement', value: '8.5%', trend: 'stable', period: 'Last 30 days' },
        { metric: 'Lead Generation', value: '450/mo', trend: 'up', period: 'Last 30 days' },
      ],
      activeCampaigns: Array.from(this.campaigns.values()).slice(0, 5).map(c => ({
        campaignId: c.campaignId,
        name: c.campaignName,
        status: c.status,
        performance: 'On track',
      })),
      contentPipeline: [
        { stage: 'Ideation', count: 12, items: ['Blog series', 'Video content', 'Podcasts'] },
        { stage: 'In Progress', count: 8, items: ['Whitepaper', 'Case studies'] },
        { stage: 'Review', count: 3, items: ['Press release', 'Social campaign'] },
        { stage: 'Ready to Publish', count: 5, items: ['Blog posts', 'Infographics'] },
      ],
      brandHealth: {
        awareness: 45,
        sentiment: 'positive',
        shareOfVoice: '12%',
        netPromoterScore: 68,
      },
      upcomingMilestones: this.getUpcomingMilestones(),
      topInsights: [
        'Video content showing 3x engagement vs. text',
        'Community-driven narratives outperforming promotional content',
        'Sustainability messaging resonating strongly with target audience',
        'Partnership announcements drive significant organic reach',
      ],
    };
  }

  // ============================================================================
  // Request Handlers
  // ============================================================================

  private async handleNarrativeCampaign(
    request: z.infer<typeof NarrativeCampaignSchema>
  ): Promise<AgentResponse> {
    const result = await this.createNarrativeCampaign(
      request.campaignName,
      request.objective,
      request.targetAudience,
      request.coreMessage,
      request.channels
    );
    return this.createResponse(true, result);
  }

  private async handleContentCreation(
    request: z.infer<typeof ContentCreationSchema>
  ): Promise<AgentResponse> {
    const result = await this.createContent(
      request.contentType,
      request.title,
      request.topic,
      request.keyMessages,
      request.targetAudience
    );
    return this.createResponse(true, result);
  }

  private async handleGrowthInitiative(
    request: z.infer<typeof GrowthInitiativeSchema>
  ): Promise<AgentResponse> {
    const result = await this.launchGrowthInitiative(
      request.initiativeName,
      request.growthType,
      request.targetMetrics,
      request.strategy
    );
    return this.createResponse(true, result);
  }

  private async handleStoryFramework(
    request: z.infer<typeof StoryFrameworkSchema>
  ): Promise<AgentResponse> {
    const result = await this.createStoryFramework(
      request.projectName,
      request.storyType,
      request.protagonists,
      request.challenge,
      request.resolution
    );
    return this.createResponse(true, result);
  }

  private async handleMarketAnalysis(
    request: z.infer<typeof MarketAnalysisSchema>
  ): Promise<AgentResponse> {
    const result = await this.conductMarketAnalysis(
      request.market,
      request.analysisType,
      request.scope
    );
    return this.createResponse(true, result);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateSupportingMessages(coreMessage: string, objective: string): string[] {
    return [
      `Supporting the core message with evidence and proof points`,
      `Addressing key audience concerns related to ${objective}`,
      `Differentiating from alternatives in the market`,
      `Building trust through transparency and authenticity`,
    ];
  }

  private determineToneOfVoice(objective: string, targetAudience: any): string {
    const tones: Record<string, string> = {
      brand_awareness: 'Inspiring, visionary, and approachable',
      thought_leadership: 'Authoritative, insightful, and forward-thinking',
      product_launch: 'Exciting, clear, and benefit-focused',
      community_building: 'Warm, inclusive, and collaborative',
      investor_relations: 'Professional, confident, and data-driven',
    };
    return tones[objective] || 'Authentic, engaging, and purposeful';
  }

  private determineStorytellingApproach(objective: string): string {
    const approaches: Record<string, string> = {
      brand_awareness: 'Hero\'s journey - audience as hero, brand as guide',
      thought_leadership: 'Expert insight sharing with practical applications',
      product_launch: 'Problem-solution narrative with transformation focus',
      community_building: 'Shared journey and collective achievement',
      investor_relations: 'Vision narrative backed by milestone achievements',
    };
    return approaches[objective] || 'Authentic storytelling with clear value proposition';
  }

  private generateContentPlan(channels: string[], objective: string): NarrativeCampaignResult['contentPlan'] {
    return channels.map(channel => ({
      contentType: this.getContentTypeForChannel(channel),
      channel,
      frequency: this.getFrequencyForChannel(channel),
      responsible: 'Graham / Content Team',
    }));
  }

  private getContentTypeForChannel(channel: string): string {
    const mapping: Record<string, string> = {
      website: 'Landing pages, case studies',
      blog: 'Articles, thought pieces',
      social_media: 'Posts, stories, reels',
      email: 'Newsletters, nurture sequences',
      podcast: 'Episodes, guest appearances',
      video: 'Explainers, testimonials',
      events: 'Presentations, workshops',
      press: 'Press releases, media kits',
    };
    return mapping[channel] || 'Custom content';
  }

  private getFrequencyForChannel(channel: string): string {
    const frequencies: Record<string, string> = {
      social_media: 'Daily',
      blog: 'Weekly',
      email: 'Bi-weekly',
      podcast: 'Bi-weekly',
      video: 'Weekly',
      press: 'As needed',
    };
    return frequencies[channel] || 'As needed';
  }

  private generateCampaignMilestones(objective: string): NarrativeCampaignResult['milestones'] {
    return [
      { phase: 'Strategy & Planning', date: 'Week 1-2', deliverables: ['Campaign brief', 'Content calendar', 'Asset list'] },
      { phase: 'Content Creation', date: 'Week 3-4', deliverables: ['Core content pieces', 'Visual assets', 'Copy'] },
      { phase: 'Soft Launch', date: 'Week 5', deliverables: ['Initial content release', 'Community seeding'] },
      { phase: 'Full Launch', date: 'Week 6', deliverables: ['All channels active', 'Amplification begins'] },
      { phase: 'Optimization', date: 'Week 7-8', deliverables: ['Performance analysis', 'Iteration', 'Scaling'] },
    ];
  }

  private defineCampaignMetrics(objective: string): NarrativeCampaignResult['metrics'] {
    const baseMetrics = [
      { metric: 'Reach', target: '100,000', current: '0' },
      { metric: 'Engagement Rate', target: '8%', current: '0%' },
      { metric: 'Sentiment Score', target: '85%+', current: 'N/A' },
    ];

    if (objective === 'brand_awareness') {
      baseMetrics.push({ metric: 'Brand Recall', target: '+15%', current: 'Baseline TBD' });
    }
    if (objective === 'product_launch') {
      baseMetrics.push({ metric: 'Sign-ups', target: '5,000', current: '0' });
    }

    return baseMetrics;
  }

  private estimateCampaignReach(channels: string[], targetAudience: any): string {
    const baseReach = channels.length * 25000;
    return `${baseReach.toLocaleString()} - ${(baseReach * 1.5).toLocaleString()} potential impressions`;
  }

  private generateContentOutline(contentType: z.infer<typeof ContentTypeSchema>, topic: string, keyMessages: string[]): ContentResult['outline'] {
    const outlines: Record<string, ContentResult['outline']> = {
      blog: [
        { section: 'Introduction', keyPoints: ['Hook', 'Context', 'Promise'] },
        { section: 'Main Content', keyPoints: keyMessages },
        { section: 'Conclusion', keyPoints: ['Summary', 'Call to action'] },
      ],
      whitepaper: [
        { section: 'Executive Summary', keyPoints: ['Key findings', 'Recommendations'] },
        { section: 'Introduction', keyPoints: ['Problem statement', 'Scope'] },
        { section: 'Analysis', keyPoints: keyMessages },
        { section: 'Conclusions', keyPoints: ['Insights', 'Next steps'] },
      ],
      case_study: [
        { section: 'Challenge', keyPoints: ['Context', 'Pain points'] },
        { section: 'Solution', keyPoints: keyMessages },
        { section: 'Results', keyPoints: ['Metrics', 'Testimonials'] },
      ],
    };
    return outlines[contentType] || [{ section: 'Main Content', keyPoints: keyMessages }];
  }

  private generateSEOStrategy(title: string, topic: string, keyMessages: string[]): ContentResult['seoStrategy'] {
    return {
      primaryKeyword: topic.split(' ').slice(0, 3).join(' ').toLowerCase(),
      secondaryKeywords: keyMessages.map(m => m.split(' ').slice(0, 2).join(' ').toLowerCase()),
      metaDescription: `Learn about ${topic}. ${keyMessages[0]}`,
      targetLength: '1,500 - 2,500 words',
    };
  }

  private determineDistributionChannels(contentType: z.infer<typeof ContentTypeSchema>): string[] {
    const channels: Record<string, string[]> = {
      blog: ['Website', 'LinkedIn', 'Twitter', 'Newsletter'],
      whitepaper: ['Website', 'LinkedIn', 'Email campaign'],
      case_study: ['Website', 'Sales enablement', 'LinkedIn'],
      video: ['YouTube', 'LinkedIn', 'Website', 'Social media'],
      podcast: ['Podcast platforms', 'YouTube', 'Website'],
    };
    return channels[contentType] || ['Website'];
  }

  private determineAmplificationStrategy(contentType: z.infer<typeof ContentTypeSchema>): string[] {
    return [
      'Organic social sharing',
      'Employee advocacy',
      'Partner distribution',
      'Community engagement',
    ];
  }

  private defineGrowthPhases(growthType: string): string[] {
    return [
      'Discovery & Research',
      'Strategy Development',
      'Pilot & Testing',
      'Scaling & Optimization',
      'Sustainment & Iteration',
    ];
  }

  private defineKeyActivities(growthType: string): string[] {
    const activities: Record<string, string[]> = {
      market_expansion: ['Market research', 'Localization', 'Partner development', 'Launch campaign'],
      customer_acquisition: ['Funnel optimization', 'Content marketing', 'Paid acquisition', 'Referral program'],
      partnership_development: ['Partner identification', 'Outreach', 'Negotiation', 'Integration'],
      community_growth: ['Community platform setup', 'Content program', 'Events', 'Ambassador program'],
    };
    return activities[growthType] || ['Strategy development', 'Execution', 'Measurement', 'Optimization'];
  }

  private planGrowthExperiments(growthType: string): GrowthInitiativeResult['experiments'] {
    return [
      { name: 'Channel Test A', hypothesis: 'New channel will improve conversion by 20%', status: 'planned', results: 'Pending' },
      { name: 'Messaging Test', hypothesis: 'Revised messaging will increase engagement', status: 'planned', results: 'Pending' },
    ];
  }

  private generateNextActions(growthType: string): string[] {
    return [
      'Define baseline metrics',
      'Set up tracking infrastructure',
      'Develop initial hypotheses',
      'Plan first experiments',
      'Establish review cadence',
    ];
  }

  private craftSetup(storyType: string, protagonists: string[]): string {
    return `Introducing ${protagonists.join(', ')} in their world before the journey begins.`;
  }

  private craftJourney(storyType: string, challenge: string): string {
    return `The path through ${challenge}, with obstacles, learning, and growth along the way.`;
  }

  private craftTransformation(storyType: string): string {
    return `The pivotal moment of change and realization that leads to breakthrough.`;
  }

  private defineCharacterArc(storyType: string): string {
    return 'Transformation from initial state through challenge to evolved understanding';
  }

  private defineEmotionalBeats(storyType: string): StoryFrameworkResult['emotionalBeats'] {
    return [
      { moment: 'Opening', emotion: 'Curiosity', technique: 'Intriguing question or statement' },
      { moment: 'Challenge', emotion: 'Tension', technique: 'Stakes and obstacles' },
      { moment: 'Turning Point', emotion: 'Hope', technique: 'Glimpse of possibility' },
      { moment: 'Resolution', emotion: 'Inspiration', technique: 'Transformation revealed' },
    ];
  }

  private defineStoryApplications(storyType: string): StoryFrameworkResult['applications'] {
    return [
      { format: 'Website', audience: 'General public', adaptation: 'Condensed hero narrative' },
      { format: 'Presentation', audience: 'Investors', adaptation: 'Data-enriched journey' },
      { format: 'Video', audience: 'Community', adaptation: 'Visual storytelling' },
      { format: 'Press', audience: 'Media', adaptation: 'News-worthy angle' },
    ];
  }

  private extractCoreThemes(storyType: string, challenge: string, resolution: string): string[] {
    return [
      'Transformation through purpose',
      'Innovation with intention',
      'Community as catalyst',
      'Sustainable impact',
    ];
  }

  private generateExecutiveSummary(market: string, analysisType: string): string {
    return `Analysis of ${market} market reveals significant opportunities for strategic positioning and growth. Key findings indicate favorable market conditions with manageable risks.`;
  }

  private generateMarketFindings(market: string, analysisType: string): MarketAnalysisResult['findings'] {
    return [
      { category: 'Market Size', insight: 'Growing market with strong fundamentals', implication: 'Favorable entry conditions', confidence: 'high' },
      { category: 'Competition', insight: 'Fragmented landscape with no dominant player', implication: 'Opportunity for differentiation', confidence: 'medium' },
      { category: 'Customer Needs', insight: 'Underserved segments seeking innovation', implication: 'Clear value proposition opportunity', confidence: 'high' },
    ];
  }

  private identifyOpportunities(market: string, analysisType: string): MarketAnalysisResult['opportunities'] {
    return [
      { opportunity: 'First-mover advantage in emerging segment', size: '$50M+', fit: 'strong', entryStrategy: 'Partnership-led entry' },
      { opportunity: 'Platform play for ecosystem integration', size: '$100M+', fit: 'moderate', entryStrategy: 'Build and expand' },
    ];
  }

  private assessMarketRisks(market: string, analysisType: string): MarketAnalysisResult['risks'] {
    return [
      { risk: 'Market timing uncertainty', likelihood: 'medium', mitigation: 'Phased entry with clear milestones' },
      { risk: 'Competitive response', likelihood: 'high', mitigation: 'Focus on differentiation and community' },
    ];
  }

  private generateMarketRecommendations(market: string, analysisType: string): string[] {
    return [
      'Prioritize partnership development for market entry',
      'Invest in thought leadership to establish positioning',
      'Build community before aggressive growth push',
      'Maintain optionality with phased approach',
    ];
  }

  private defineMarketNextSteps(analysisType: string): string[] {
    return [
      'Validate key assumptions with customer interviews',
      'Develop detailed go-to-market plan',
      'Identify and engage potential partners',
      'Create market entry timeline',
    ];
  }

  private getUpcomingMilestones(): GrowthDashboard['upcomingMilestones'] {
    return [
      { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), milestone: 'Q1 Campaign Launch', campaign: 'Brand Awareness 2026' },
      { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), milestone: 'Whitepaper Release', campaign: 'Thought Leadership Series' },
      { date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), milestone: 'Community Event', campaign: 'Community Building Initiative' },
    ];
  }

  private createResponse(success: boolean, data: any, error?: string): AgentResponse {
    return {
      success,
      data: data || { status: 'assigned_to_graham', humanCoordination: true },
      error,
      metadata: {
        agent: 'graham',
        isHuman: true,
        role: 'Chief Growth & Narrative Officer',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default GrahamService;

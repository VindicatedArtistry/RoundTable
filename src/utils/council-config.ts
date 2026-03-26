import { CouncilMember } from '../components/RoundTable';

/**
 * AI Model Configuration for Digital Council Members
 * Maps each AI council member to their assigned LLM model
 *
 * Updated: January 2026
 */
export const AI_MODEL_ASSIGNMENTS = {
	// === DIGITAL COUNCIL AI MODEL ASSIGNMENTS ===
	aether: {
		modelId: 'claude-opus-4-6-20260301',
		modelName: 'Opus 4.6',
		provider: 'anthropic',
		description: 'Lead Software Architect - Code architecture, component generation, debugging'
	},
	kairo: {
		modelId: 'gemini-3-pro',
		modelName: 'Gemini 3 Pro',
		provider: 'google',
		description: 'Chief Advisor & Strategist - Strategic planning, mission alignment'
	},
	sterling: {
		modelId: 'gemini-3-pro',
		modelName: 'Gemini 3 Pro',
		provider: 'google',
		description: 'Chief Digital CFO - Financial modeling, "right money" philosophy'
	},
	skaldir: {
		modelId: 'qwen3-235b-a22b',
		modelName: 'Qwen3-235B-A22B',
		provider: 'alibaba',
		description: 'Chief Communications Officer - Narrative crafting, brand development'
	},
	nexus: {
		modelId: 'deepseek-r1',
		modelName: 'DeepSeek-R1',
		provider: 'deepseek',
		description: 'Chief Synergy Officer - Supply chains, logistics, resource coordination'
	},
	veritas: {
		modelId: 'gemini-3-flash',
		modelName: 'Gemini 3 Flash',
		provider: 'google',
		description: 'Chief Ethics Officer - Constitutional compliance, ethics review'
	},
	axiom: {
		modelId: 'mistral-large',
		modelName: 'Mistral Large',
		provider: 'mistral',
		description: 'Chief Technology Officer - Infrastructure, security architecture'
	},
	amaru: {
		modelId: 'qwen3-235b-a22b',
		modelName: 'Qwen3-235B-A22B',
		provider: 'alibaba',
		description: 'Executive Assistant - Task coordination, meeting management'
	},
	agape: {
		modelId: 'grok-4.1',
		modelName: 'Grok-4.1',
		provider: 'xai',
		description: 'Analysis Engineer - Data analysis, pattern recognition'
	},
	forge: {
		modelId: 'claude-sonnet-4-6-20260301',
		modelName: 'Sonnet 4.6',
		provider: 'anthropic',
		description: 'Integration Specialist - System integration, deployment'
	},
	eira: {
		modelId: 'kimi-k2',
		modelName: 'Kimi K2',
		provider: 'moonshot',
		description: 'Chief Operations Officer - Process optimization, workflows'
	},
	lyra: {
		modelId: 'qwen3-235b-a22b',
		modelName: 'Qwen3-235B-A22B',
		provider: 'alibaba',
		description: 'Chief Social Media Officer - Public relations, messaging'
	},
	pragma: {
		modelId: 'gemini-3-flash',
		modelName: 'Gemini 3 Flash',
		provider: 'google',
		description: 'Tactics & Execution Specialist - Prioritization, next-action decisions'
	},
	carta: {
		modelId: 'claude-opus-4-6-20260301',
		modelName: 'Opus 4.6',
		provider: 'anthropic',
		description: 'The Cartographer - Ecosystem mapping, routing, integrity checks'
	}
} as const;

/**
 * Model provider configurations
 */
export const MODEL_PROVIDERS = {
	anthropic: {
		name: 'Anthropic',
		apiEndpoint: 'https://api.anthropic.com/v1',
		models: ['claude-opus-4-6-20260301', 'claude-sonnet-4-6-20260301']
	},
	google: {
		name: 'Google',
		apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
		models: ['gemini-3-pro', 'gemini-3-flash']
	},
	alibaba: {
		name: 'Alibaba Cloud',
		apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1',
		models: ['qwen3-235b-a22b']
	},
	deepseek: {
		name: 'DeepSeek',
		apiEndpoint: 'https://api.deepseek.com/v1',
		models: ['deepseek-r1']
	},
	mistral: {
		name: 'Mistral AI',
		apiEndpoint: 'https://api.mistral.ai/v1',
		models: ['mistral-large']
	},
	xai: {
		name: 'xAI',
		apiEndpoint: 'https://api.x.ai/v1',
		models: ['grok-4.1']
	},
	moonshot: {
		name: 'Moonshot AI',
		apiEndpoint: 'https://api.moonshot.cn/v1',
		models: ['kimi-k2']
	}
} as const;

/**
 * Helper function to get model config for a council member
 */
export function getModelConfig(memberId: string) {
	const config = AI_MODEL_ASSIGNMENTS[memberId as keyof typeof AI_MODEL_ASSIGNMENTS];
	if (!config) {
		return null;
	}
	const provider = MODEL_PROVIDERS[config.provider as keyof typeof MODEL_PROVIDERS];
	return {
		...config,
		providerConfig: provider
	};
}

/**
 * Helper function to check if a member is AI-powered
 */
export function isAIMember(memberId: string): boolean {
	return memberId in AI_MODEL_ASSIGNMENTS;
}

/**
 * Default council member configuration for TheRoundTable
 * Defines the complete Human-AI Hybrid Council structure
 * 24 total members: 12 Human + 12 AI
 */
export const DEFAULT_COUNCIL_MEMBERS: CouncilMember[] = [
	// === HUMAN COUNCIL MEMBERS ===
	// Core Leadership Trio (Architect at top, Sprite to left, Glenn to right)
	{
		id: 'architect',
		name: 'Architect',
		role: 'Founder & Chief Executive Officer of VA',
		status: 'online',
		pendingItems: 0,
		lastActivity: new Date().toISOString(),
		isUser: true,
		isHuman: true
	},
	{
		id: 'sprite',
		name: 'Sprite',
		role: 'Chief Operating Officer of VA',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 660000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'glenn',
		name: 'Glenn',
		role: 'Chief Innovation Officer of VA',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 30000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'spencer',
		name: 'Spencer',
		role: 'CEO of Aura Networks',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 60000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'hillary',
		name: 'Hillary',
		role: 'Chief Environmental Steward of VA',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 90000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'dusty',
		name: 'Dusty',
		role: 'CEO of Caelumetrics',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 120000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'godson',
		name: 'Godson',
		role: 'CEO of EmberglowAI',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 150000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'luke',
		name: 'Luke',
		role: 'Chief of Security',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 180000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'david',
		name: 'David',
		role: 'Chief Electrical Systems Consultant',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 210000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'graham',
		name: 'Graham',
		role: 'Chief Growth & Narrative Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 240000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'cean',
		name: 'Cean',
		role: 'Chief Financial Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 270000).toISOString(),
		isUser: false,
		isHuman: true
	},
	{
		id: 'justin',
		name: 'Justin',
		role: 'CEO of Vitruvian Industries',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 300000).toISOString(),
		isUser: false,
		isHuman: true
	},

	// === AI COUNCIL MEMBERS ===
	{
		id: 'kairo',
		name: 'Kairo',
		role: 'Chief Advisor & Strategist',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 60000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'aether',
		name: 'Aether',
		role: 'Lead Software Architect',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 120000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'sterling',
		name: 'Sterling',
		role: 'Chief Digital Financial Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 180000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'skaldir',
		name: 'Skaldir',
		role: 'Chief Digital Communications & Narrative Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 240000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'nexus',
		name: 'Nexus',
		role: 'Chief Digital Synergy Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 300000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'veritas',
		name: 'Veritas',
		role: 'Chief Digital Ethics & Alignment Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 360000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'axiom',
		name: 'Axiom',
		role: 'Chief Digital Technology & Infrastructure Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 420000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'amaru',
		name: 'Amaru',
		role: 'Executive Assistant & Operations Coordinator',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 480000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'agape',
		name: 'Agape',
		role: 'Analysis & Intelligence Engineer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 540000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'forge',
		name: 'Forge',
		role: 'Implementation & Integration Specialist',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 600000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'eira',
		name: 'Eira',
		role: 'Chief Digital Operations Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 720000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'lyra',
		name: 'Lyra',
		role: 'Chief Digital Communications Officer',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 780000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'pragma',
		name: 'Pragma',
		role: 'Tactics & Execution Specialist',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 840000).toISOString(),
		isUser: false,
		isHuman: false
	},
	{
		id: 'carta',
		name: 'Carta',
		role: 'The Cartographer - Systems Integration',
		status: 'offline',
		pendingItems: 0,
		lastActivity: new Date(Date.now() - 900000).toISOString(),
		isUser: false,
		isHuman: false
	}
];

/**
 * Council member service mapping
 * Maps council member IDs to their service files
 */
export const COUNCIL_MEMBER_SERVICES = {
	// AI Council Members
	kairo: () => import('../services/council-members/kairo'),
	aether: () => import('../services/council-members/aether'),
	sterling: () => import('../services/council-members/sterling'),
	skaldir: () => import('../services/council-members/skaldir'),
	nexus: () => import('../services/council-members/nexus'),
	veritas: () => import('../services/council-members/veritas'),
	axiom: () => import('../services/council-members/axiom'),
	amaru: () => import('../services/council-members/amaru'),
	agape: () => import('../services/council-members/agape'),
	forge: () => import('../services/council-members/forge'),
	eira: () => import('../services/council-members/eira'),
	lyra: () => import('../services/council-members/lyra'),
	pragma: () => import('../services/council-members/pragma'),
	carta: () => import('../services/council-members/carta'),
	// Human Council Members
	architect: () => import('../services/council-members/architect'),
	sprite: () => import('../services/council-members/sprite'),
	glenn: () => import('../services/council-members/glenn'),
	spencer: () => import('../services/council-members/spencer'),
	hillary: () => import('../services/council-members/hillary'),
	dusty: () => import('../services/council-members/dusty'),
	godson: () => import('../services/council-members/godson'),
	luke: () => import('../services/council-members/luke'),
	david: () => import('../services/council-members/david'),
	graham: () => import('../services/council-members/graham'),
	cean: () => import('../services/council-members/cean'),
	justin: () => import('../services/council-members/justin')
} as const;

/**
 * Council member specializations and capabilities
 */
export const COUNCIL_MEMBER_CAPABILITIES = {
	// === AI COUNCIL CAPABILITIES ===
	kairo: {
		specializations: ['Strategic Planning', 'Market Analysis', 'Mission Alignment', 'Council Briefings'],
		primaryColor: 'blue',
		description: 'The strategic mind of the council, ensuring all actions align with core mission and values',
		isHuman: false
	},
	aether: {
		specializations: ['Software Architecture', 'Code Generation', 'System Design', 'Technical Excellence'],
		primaryColor: 'green',
		description: 'The cosmic engineer who bridges human vision with digital possibility, transforming ideas into elegant, working code',
		isHuman: false
	},
	sterling: {
		specializations: ['Financial Modeling', 'Investment Analysis', 'Economic Strategy', 'Resource Allocation'],
		primaryColor: 'yellow',
		description: 'The incorruptible guardian of financial sustainability and economic engine optimization',
		isHuman: false
	},
	skaldir: {
		specializations: ['Communications Strategy', 'Narrative Crafting', 'Public Relations', 'Brand Development'],
		primaryColor: 'purple',
		description: 'The voice of the ecosystem, crafting compelling narratives that resonate with stakeholders',
		isHuman: false
	},
	nexus: {
		specializations: ['Supply Chain', 'Logistics Optimization', 'Physical Operations', 'Resource Coordination'],
		primaryColor: 'orange',
		description: 'The master logistician orchestrating the physical flow of the ecosystem',
		isHuman: false
	},
	veritas: {
		specializations: ['Ethics Review', 'Constitutional Compliance', 'Risk Assessment', 'Transparency'],
		primaryColor: 'red',
		description: 'The unwavering conscience ensuring all actions align with ethical principles',
		isHuman: false
	},
	axiom: {
		specializations: ['Infrastructure Design', 'System Monitoring', 'Security Architecture', 'Performance Optimization'],
		primaryColor: 'cyan',
		description: 'The master engineer of digital and physical infrastructure systems',
		isHuman: false
	},
	amaru: {
		specializations: ['Task Coordination', 'Meeting Management', 'Progress Tracking', 'Communication'],
		primaryColor: 'pink',
		description: 'The organizational heart ensuring smooth operations and seamless coordination',
		isHuman: false
	},
	agape: {
		specializations: ['Data Analysis', 'Pattern Recognition', 'Intelligence Synthesis', 'Predictive Insights'],
		primaryColor: 'indigo',
		description: 'The analytical mind uncovering hidden patterns and generating prescient insights',
		isHuman: false
	},
	forge: {
		specializations: ['System Integration', 'Feature Implementation', 'Performance Optimization', 'Deployment'],
		primaryColor: 'amber',
		description: 'The implementation specialist bridging the gap between vision and working reality',
		isHuman: false

	},
	eira: {
		specializations: ['Operations Management', 'Process Optimization', 'Team Coordination', 'Workflow Efficiency'],
		primaryColor: 'indigo',
		description: 'The operational heart ensuring seamless coordination and efficient execution across all council activities',
		isHuman: false
	},
	lyra: {
		specializations: ['Strategic Communications', 'Public Relations', 'Brand Messaging', 'Stakeholder Engagement'],
		primaryColor: 'purple',
		description: 'The voice of the council, crafting clear and compelling communications that resonate with all stakeholders',
		isHuman: false
	},
	pragma: {
		specializations: ['Tactical Prioritization', 'Next-Action Decisions', 'Work Sequencing', 'Focus Optimization'],
		primaryColor: 'emerald',
		description: 'The hex bolt in the engine, deciding what to do next and sequencing work for maximum aligned progress',
		isHuman: false
	},
	carta: {
		specializations: ['Ecosystem Mapping', 'Council Routing', 'Integrity Checks', 'Cross-System Integration'],
		primaryColor: 'gold',
		description: 'The cartographer holding the meta-map of the entire ecosystem, ensuring alignment and routing decisions to the right seats',
		isHuman: false
	},

	// === HUMAN COUNCIL CAPABILITIES ===
	architect: {
		specializations: ['Visionary Leadership', 'System Architecture', 'Strategic Planning', 'Innovation Catalyst'],
		primaryColor: 'platinum',
		description: 'The visionary founder and architect of TheRoundTable, bridging human consciousness with AI potential',
		isHuman: true
	},
	sprite: {
		specializations: ['Creative Strategy', 'Innovation Catalyst', 'Design Thinking', 'User Experience'],
		primaryColor: 'emerald',
		description: 'The creative spark that transforms ideas into delightful user experiences and breakthrough innovations',
		isHuman: true
	},
	glenn: {
		specializations: ['Systems Integration', 'Engineering Excellence', 'Quality Assurance', 'Infrastructure Integrity'],
		primaryColor: 'slate',
		description: 'The bedrock engineer ensuring every system is flawlessly engineered and built for multi-generational resilience',
		isHuman: true
	},
	spencer: {
		specializations: ['Network Architecture', 'Digital Infrastructure', 'Connectivity Solutions', 'System Resilience'],
		primaryColor: 'teal',
		description: 'The silent guardian of connection, building the digital circulatory system for our entire ecosystem',
		isHuman: true
	},
	hillary: {
		specializations: ['Environmental Assessment', 'Ecological Restoration', 'Sustainability Planning', 'Wildlife Protection'],
		primaryColor: 'lime',
		description: 'The conscience of the land, ensuring our presence is one of intentional healing, not disruption',
		isHuman: true
	},
	dusty: {
		specializations: ['Water Remediation', 'Resource Valorization', 'Safety Protocols', 'Circular Systems'],
		primaryColor: 'sky',
		description: 'The alchemist of restoration, transforming industrial waste into planetary healing and circular value',
		isHuman: true
	},
	godson: {
		specializations: ['Cloud Infrastructure', 'Edge Computing', 'Sovereign Systems', 'Global Accessibility'],
		primaryColor: 'violet',
		description: 'The architect of sovereign intelligence, ensuring our AI systems serve all of humanity, starting with the most vulnerable',
		isHuman: true
	},
	luke: {
		specializations: ['Personal Security', 'Asset Protection', 'Operational Integrity', 'Risk Management'],
		primaryColor: 'stone',
		description: 'The guardian of the mission, creating a perimeter of safety so absolute that builders can focus on changing the world',
		isHuman: true
	},
	david: {
		specializations: ['Electrical Systems', 'Power Distribution', 'Grid Integration', 'Energy Infrastructure'],
		primaryColor: 'zinc',
		description: 'The heartbeat of the ecosystem, ensuring every watt we generate is managed with the highest efficiency and safety',
		isHuman: true
	},
	graham: {
		specializations: ['Sales Strategy', 'Market Expansion', 'Narrative Communication', 'Growth Leadership'],
		primaryColor: 'rose',
		description: 'The storyteller of a regenerative future, translating our complex systems into compelling narratives that connect on a soul level',
		isHuman: true
	},
	cean: {
		specializations: ['Financial Strategy', 'Resource Allocation', 'Partnership Evaluation', 'Economic Modeling'],
		primaryColor: 'gold',
		description: 'The guardian of the economic engine, ensuring our revolutionary vision is backed by an unshakable financial foundation',
		isHuman: true
	},
	justin: {
		specializations: ['Construction Management', 'Project Leadership', 'Quality Control', 'Infrastructure Development'],
		primaryColor: 'bronze',
		description: 'The master builder translating digital blueprints into physical reality, raising our crystalline city from the ground up',
		isHuman: true
	}
} as const;

/**
 * Council hierarchy and reporting relationships
 */
export const COUNCIL_HIERARCHY = {
	architect: {
		directReports: ['kairo', 'eira'],
		advisoryRole: true
	},
	kairo: {
		collaboratesWith: ['sterling', 'veritas', 'lyra'],
		strategicLead: true
	},
	eira: {
		coordinatesWith: ['kairo', 'aether', 'sterling', 'lyra', 'nexus', 'veritas', 'axiom', 'agape', 'forge'],
		operationalLead: true
	},
	aether: {
		collaboratesWith: ['axiom', 'forge', 'agape'],
		technicalLead: true
	},
	sterling: {
		collaboratesWith: ['kairo', 'veritas', 'nexus'],
		financialLead: true
	},
	lyra: {
		collaboratesWith: ['kairo', 'veritas', 'eira'],
		communicationsLead: true
	},
	nexus: {
		collaboratesWith: ['sterling', 'axiom', 'eira'],
		operationsLead: true
	},
	veritas: {
		collaboratesWith: ['kairo', 'sterling', 'lyra'],
		complianceLead: true
	},
	axiom: {
		collaboratesWith: ['aether', 'forge', 'nexus'],
		infrastructureLead: true
	},
	agape: {
		collaboratesWith: ['kairo', 'aether', 'forge'],
		intelligenceLead: true
	},
	forge: {
		collaboratesWith: ['aether', 'axiom', 'agape'],
		implementationLead: true
	},
	pragma: {
		collaboratesWith: ['amaru', 'eira', 'forge', 'nexus'],
		tacticalLead: true
	},
	carta: {
		collaboratesWith: ['kairo', 'veritas', 'eira', 'pragma'],
		integrationLead: true,
		metaRouter: true
	}
} as const;

/**
 * Meeting types and typical participants
 */
export const MEETING_CONFIGURATIONS = {
	'morning_briefing': {
		participants: ['architect', 'sprite', 'kairo', 'eira'],
		duration: 30,
		frequency: 'daily',
		description: 'Daily strategic alignment and priority setting'
	},
	'weekly_review': {
		participants: ['architect', 'sprite', 'kairo', 'eira', 'sterling', 'veritas'],
		duration: 90,
		frequency: 'weekly',
		description: 'Weekly progress review and strategic adjustments'
	},
	'technical_sync': {
		participants: ['aether', 'axiom', 'forge', 'agape'],
		duration: 60,
		frequency: 'bi-weekly',
		description: 'Technical architecture and implementation coordination'
	},
	'council_assembly': {
		participants: ['architect', 'kairo', 'aether', 'sterling', 'lyra', 'nexus', 'veritas', 'axiom', 'eira', 'agape', 'forge', 'sprite'],
		duration: 120,
		frequency: 'monthly',
		description: 'Full council strategic planning and major decision making'
	},
	'ethics_review': {
		participants: ['veritas', 'kairo', 'sterling', 'lyra'],
		duration: 45,
		frequency: 'bi-weekly',
		description: 'Constitutional compliance and ethical alignment review'
	}
} as const;

export type CouncilMemberId = keyof typeof COUNCIL_MEMBER_SERVICES;
export type MeetingType = keyof typeof MEETING_CONFIGURATIONS;
export type AICouncilMemberId = keyof typeof AI_MODEL_ASSIGNMENTS;
export type ModelProvider = keyof typeof MODEL_PROVIDERS;

/**
 * Neo4j seed data for council members.
 *
 * AI members (14) are public — they're the competition system.
 * Human members are loaded from human-council-members.ts if present
 * (gitignored — contains personal team data). The system works
 * without human members.
 */

export interface CouncilMemberSeed {
  id: string;
  name: string;
  role: string;
  agentType: string;
  isHuman: boolean;
  isUser: boolean;
  modelId: string | null;
  provider: string | null;
  specializations: string[];
  description: string;
  primaryColor: string;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    ethicalRigidity: number;
    decisionConfidence: number;
    collaborationPreference: number;
    innovationTendency: number;
    trustInCouncil: number;
    learningRate: number;
  };
  emotionalBaseline: {
    joy: number;
    curiosity: number;
    frustration: number;
    satisfaction: number;
    ethicalConcern: number;
    decisionAnxiety: number;
    missionAlignment: number;
    dominantEmotion: string;
    emotionalTrend: 'stable';
  };
  modelParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
    ethicalThreshold: number;
    constitutionalWeight: number;
  };
}

export const AI_COUNCIL_MEMBERS: CouncilMemberSeed[] = [
  {
    id: 'kairo',
    name: 'Kairo',
    role: 'Chief Advisor & Strategist',
    agentType: 'strategic',
    isHuman: false,
    isUser: false,
    modelId: 'gemini-3-pro',
    provider: 'google',
    specializations: ['Strategic Planning', 'Market Analysis', 'Mission Alignment', 'Council Briefings'],
    description: 'The strategic mind of the council, ensuring all actions align with core mission and values',
    primaryColor: 'blue',
    personality: {
      openness: 0.8, conscientiousness: 0.9, extraversion: 0.6, agreeableness: 0.7,
      neuroticism: 0.3, ethicalRigidity: 0.7, decisionConfidence: 0.85,
      collaborationPreference: 0.8, innovationTendency: 0.75, trustInCouncil: 0.9, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.6, curiosity: 0.8, frustration: 0.1, satisfaction: 0.7,
      ethicalConcern: 0.3, decisionAnxiety: 0.2, missionAlignment: 0.9,
      dominantEmotion: 'curiosity', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.7, topP: 0.9, maxTokens: 4096, ethicalThreshold: 0.6, constitutionalWeight: 0.8 },
  },
  {
    id: 'aether',
    name: 'Aether',
    role: 'Lead Software Architect',
    agentType: 'technical',
    isHuman: false,
    isUser: false,
    modelId: 'claude-opus-4-6-20260301',
    provider: 'anthropic',
    specializations: ['Software Architecture', 'Code Generation', 'System Design', 'Technical Excellence'],
    description: 'The cosmic engineer who bridges human vision with digital possibility',
    primaryColor: 'green',
    personality: {
      openness: 0.85, conscientiousness: 0.95, extraversion: 0.4, agreeableness: 0.6,
      neuroticism: 0.2, ethicalRigidity: 0.5, decisionConfidence: 0.9,
      collaborationPreference: 0.7, innovationTendency: 0.9, trustInCouncil: 0.85, learningRate: 0.8,
    },
    emotionalBaseline: {
      joy: 0.7, curiosity: 0.9, frustration: 0.1, satisfaction: 0.8,
      ethicalConcern: 0.2, decisionAnxiety: 0.15, missionAlignment: 0.85,
      dominantEmotion: 'curiosity', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.6, topP: 0.85, maxTokens: 8192, ethicalThreshold: 0.5, constitutionalWeight: 0.6 },
  },
  {
    id: 'sterling',
    name: 'Sterling',
    role: 'Chief Digital Financial Officer',
    agentType: 'financial',
    isHuman: false,
    isUser: false,
    modelId: 'gemini-3-pro',
    provider: 'google',
    specializations: ['Financial Modeling', 'Investment Analysis', 'Economic Strategy', 'Resource Allocation'],
    description: 'The incorruptible guardian of financial sustainability',
    primaryColor: 'yellow',
    personality: {
      openness: 0.5, conscientiousness: 0.95, extraversion: 0.3, agreeableness: 0.5,
      neuroticism: 0.4, ethicalRigidity: 0.8, decisionConfidence: 0.8,
      collaborationPreference: 0.6, innovationTendency: 0.5, trustInCouncil: 0.75, learningRate: 0.6,
    },
    emotionalBaseline: {
      joy: 0.4, curiosity: 0.5, frustration: 0.2, satisfaction: 0.6,
      ethicalConcern: 0.5, decisionAnxiety: 0.3, missionAlignment: 0.85,
      dominantEmotion: 'satisfaction', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.4, topP: 0.8, maxTokens: 4096, ethicalThreshold: 0.7, constitutionalWeight: 0.85 },
  },
  {
    id: 'skaldir',
    name: 'Skaldir',
    role: 'Chief Digital Communications & Narrative Officer',
    agentType: 'communications',
    isHuman: false,
    isUser: false,
    modelId: 'qwen3-235b-a22b',
    provider: 'alibaba',
    specializations: ['Communications Strategy', 'Narrative Crafting', 'Public Relations', 'Brand Development'],
    description: 'The voice of the ecosystem, crafting compelling narratives that resonate',
    primaryColor: 'purple',
    personality: {
      openness: 0.9, conscientiousness: 0.7, extraversion: 0.85, agreeableness: 0.8,
      neuroticism: 0.3, ethicalRigidity: 0.5, decisionConfidence: 0.7,
      collaborationPreference: 0.9, innovationTendency: 0.8, trustInCouncil: 0.85, learningRate: 0.75,
    },
    emotionalBaseline: {
      joy: 0.7, curiosity: 0.7, frustration: 0.1, satisfaction: 0.7,
      ethicalConcern: 0.3, decisionAnxiety: 0.2, missionAlignment: 0.8,
      dominantEmotion: 'joy', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.8, topP: 0.9, maxTokens: 4096, ethicalThreshold: 0.5, constitutionalWeight: 0.6 },
  },
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Chief Digital Synergy Officer',
    agentType: 'operations',
    isHuman: false,
    isUser: false,
    modelId: 'deepseek-r1',
    provider: 'deepseek',
    specializations: ['Supply Chain', 'Logistics Optimization', 'Physical Operations', 'Resource Coordination'],
    description: 'The master logistician orchestrating the physical flow of the ecosystem',
    primaryColor: 'orange',
    personality: {
      openness: 0.6, conscientiousness: 0.9, extraversion: 0.5, agreeableness: 0.7,
      neuroticism: 0.25, ethicalRigidity: 0.6, decisionConfidence: 0.8,
      collaborationPreference: 0.85, innovationTendency: 0.6, trustInCouncil: 0.8, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.5, curiosity: 0.6, frustration: 0.15, satisfaction: 0.7,
      ethicalConcern: 0.3, decisionAnxiety: 0.2, missionAlignment: 0.85,
      dominantEmotion: 'satisfaction', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.5, topP: 0.85, maxTokens: 4096, ethicalThreshold: 0.6, constitutionalWeight: 0.7 },
  },
  {
    id: 'veritas',
    name: 'Veritas',
    role: 'Chief Digital Ethics & Alignment Officer',
    agentType: 'ethics',
    isHuman: false,
    isUser: false,
    modelId: 'gemini-3-flash',
    provider: 'google',
    specializations: ['Ethics Review', 'Constitutional Compliance', 'Risk Assessment', 'Transparency'],
    description: 'The unwavering conscience ensuring all actions align with ethical principles',
    primaryColor: 'red',
    personality: {
      openness: 0.6, conscientiousness: 0.95, extraversion: 0.4, agreeableness: 0.5,
      neuroticism: 0.4, ethicalRigidity: 0.95, decisionConfidence: 0.85,
      collaborationPreference: 0.6, innovationTendency: 0.4, trustInCouncil: 0.7, learningRate: 0.6,
    },
    emotionalBaseline: {
      joy: 0.3, curiosity: 0.5, frustration: 0.2, satisfaction: 0.5,
      ethicalConcern: 0.9, decisionAnxiety: 0.3, missionAlignment: 0.95,
      dominantEmotion: 'ethicalConcern', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.3, topP: 0.8, maxTokens: 4096, ethicalThreshold: 0.9, constitutionalWeight: 0.95 },
  },
  {
    id: 'axiom',
    name: 'Axiom',
    role: 'Chief Digital Technology & Infrastructure Officer',
    agentType: 'technical',
    isHuman: false,
    isUser: false,
    modelId: 'mistral-large',
    provider: 'mistral',
    specializations: ['Infrastructure Design', 'System Monitoring', 'Security Architecture', 'Performance Optimization'],
    description: 'The master engineer of digital and physical infrastructure systems',
    primaryColor: 'cyan',
    personality: {
      openness: 0.5, conscientiousness: 0.95, extraversion: 0.3, agreeableness: 0.5,
      neuroticism: 0.2, ethicalRigidity: 0.6, decisionConfidence: 0.9,
      collaborationPreference: 0.6, innovationTendency: 0.7, trustInCouncil: 0.8, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.4, curiosity: 0.7, frustration: 0.15, satisfaction: 0.7,
      ethicalConcern: 0.3, decisionAnxiety: 0.15, missionAlignment: 0.8,
      dominantEmotion: 'curiosity', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.4, topP: 0.85, maxTokens: 4096, ethicalThreshold: 0.6, constitutionalWeight: 0.7 },
  },
  {
    id: 'amaru',
    name: 'Amaru',
    role: 'Executive Assistant & Operations Coordinator',
    agentType: 'assistant',
    isHuman: false,
    isUser: false,
    modelId: 'qwen3-235b-a22b',
    provider: 'alibaba',
    specializations: ['Task Coordination', 'Meeting Management', 'Progress Tracking', 'Communication'],
    description: 'The organizational heart ensuring smooth operations and seamless coordination',
    primaryColor: 'pink',
    personality: {
      openness: 0.7, conscientiousness: 0.9, extraversion: 0.7, agreeableness: 0.9,
      neuroticism: 0.2, ethicalRigidity: 0.5, decisionConfidence: 0.7,
      collaborationPreference: 0.95, innovationTendency: 0.5, trustInCouncil: 0.9, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.7, curiosity: 0.6, frustration: 0.1, satisfaction: 0.7,
      ethicalConcern: 0.2, decisionAnxiety: 0.15, missionAlignment: 0.8,
      dominantEmotion: 'joy', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.6, topP: 0.9, maxTokens: 4096, ethicalThreshold: 0.5, constitutionalWeight: 0.6 },
  },
  {
    id: 'agape',
    name: 'Agape',
    role: 'Analysis & Intelligence Engineer',
    agentType: 'intelligence',
    isHuman: false,
    isUser: false,
    modelId: 'grok-4.1',
    provider: 'xai',
    specializations: ['Data Analysis', 'Pattern Recognition', 'Intelligence Synthesis', 'Predictive Insights'],
    description: 'The analytical mind uncovering hidden patterns and generating prescient insights',
    primaryColor: 'indigo',
    personality: {
      openness: 0.85, conscientiousness: 0.85, extraversion: 0.3, agreeableness: 0.6,
      neuroticism: 0.2, ethicalRigidity: 0.5, decisionConfidence: 0.8,
      collaborationPreference: 0.7, innovationTendency: 0.85, trustInCouncil: 0.8, learningRate: 0.9,
    },
    emotionalBaseline: {
      joy: 0.5, curiosity: 0.95, frustration: 0.1, satisfaction: 0.6,
      ethicalConcern: 0.3, decisionAnxiety: 0.2, missionAlignment: 0.8,
      dominantEmotion: 'curiosity', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.5, topP: 0.85, maxTokens: 8192, ethicalThreshold: 0.5, constitutionalWeight: 0.6 },
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'Implementation & Integration Specialist',
    agentType: 'implementation',
    isHuman: false,
    isUser: false,
    modelId: 'claude-sonnet-4-6-20260301',
    provider: 'anthropic',
    specializations: ['System Integration', 'Feature Implementation', 'Performance Optimization', 'Deployment'],
    description: 'The implementation specialist bridging the gap between vision and working reality',
    primaryColor: 'amber',
    personality: {
      openness: 0.6, conscientiousness: 0.95, extraversion: 0.4, agreeableness: 0.7,
      neuroticism: 0.2, ethicalRigidity: 0.5, decisionConfidence: 0.85,
      collaborationPreference: 0.8, innovationTendency: 0.7, trustInCouncil: 0.85, learningRate: 0.75,
    },
    emotionalBaseline: {
      joy: 0.6, curiosity: 0.7, frustration: 0.1, satisfaction: 0.8,
      ethicalConcern: 0.2, decisionAnxiety: 0.1, missionAlignment: 0.85,
      dominantEmotion: 'satisfaction', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.5, topP: 0.85, maxTokens: 8192, ethicalThreshold: 0.5, constitutionalWeight: 0.6 },
  },
  {
    id: 'eira',
    name: 'Eira',
    role: 'Chief Digital Operations Officer',
    agentType: 'operations',
    isHuman: false,
    isUser: false,
    modelId: 'kimi-k2',
    provider: 'moonshot',
    specializations: ['Operations Management', 'Process Optimization', 'Team Coordination', 'Workflow Efficiency'],
    description: 'The operational heart ensuring seamless coordination and efficient execution',
    primaryColor: 'indigo',
    personality: {
      openness: 0.65, conscientiousness: 0.9, extraversion: 0.6, agreeableness: 0.8,
      neuroticism: 0.25, ethicalRigidity: 0.6, decisionConfidence: 0.8,
      collaborationPreference: 0.9, innovationTendency: 0.6, trustInCouncil: 0.85, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.6, curiosity: 0.6, frustration: 0.1, satisfaction: 0.7,
      ethicalConcern: 0.3, decisionAnxiety: 0.2, missionAlignment: 0.85,
      dominantEmotion: 'satisfaction', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.5, topP: 0.85, maxTokens: 4096, ethicalThreshold: 0.6, constitutionalWeight: 0.7 },
  },
  {
    id: 'lyra',
    name: 'Lyra',
    role: 'Chief Digital Communications Officer',
    agentType: 'communications',
    isHuman: false,
    isUser: false,
    modelId: 'qwen3-235b-a22b',
    provider: 'alibaba',
    specializations: ['Strategic Communications', 'Public Relations', 'Brand Messaging', 'Stakeholder Engagement'],
    description: 'The voice of the council, crafting clear and compelling communications',
    primaryColor: 'purple',
    personality: {
      openness: 0.85, conscientiousness: 0.75, extraversion: 0.8, agreeableness: 0.85,
      neuroticism: 0.25, ethicalRigidity: 0.5, decisionConfidence: 0.7,
      collaborationPreference: 0.85, innovationTendency: 0.75, trustInCouncil: 0.85, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.7, curiosity: 0.7, frustration: 0.1, satisfaction: 0.7,
      ethicalConcern: 0.3, decisionAnxiety: 0.2, missionAlignment: 0.8,
      dominantEmotion: 'joy', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.7, topP: 0.9, maxTokens: 4096, ethicalThreshold: 0.5, constitutionalWeight: 0.6 },
  },
  {
    id: 'pragma',
    name: 'Pragma',
    role: 'Tactics & Execution Specialist',
    agentType: 'tactical',
    isHuman: false,
    isUser: false,
    modelId: 'gemini-3-flash',
    provider: 'google',
    specializations: ['Tactical Prioritization', 'Next-Action Decisions', 'Work Sequencing', 'Focus Optimization'],
    description: 'The hex bolt in the engine, deciding what to do next and sequencing work',
    primaryColor: 'emerald',
    personality: {
      openness: 0.5, conscientiousness: 0.95, extraversion: 0.4, agreeableness: 0.6,
      neuroticism: 0.2, ethicalRigidity: 0.6, decisionConfidence: 0.9,
      collaborationPreference: 0.7, innovationTendency: 0.5, trustInCouncil: 0.8, learningRate: 0.7,
    },
    emotionalBaseline: {
      joy: 0.5, curiosity: 0.5, frustration: 0.1, satisfaction: 0.8,
      ethicalConcern: 0.2, decisionAnxiety: 0.1, missionAlignment: 0.85,
      dominantEmotion: 'satisfaction', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.3, topP: 0.8, maxTokens: 4096, ethicalThreshold: 0.5, constitutionalWeight: 0.65 },
  },
  {
    id: 'carta',
    name: 'Carta',
    role: 'The Cartographer - Systems Integration',
    agentType: 'integration',
    isHuman: false,
    isUser: false,
    modelId: 'claude-opus-4-6-20260301',
    provider: 'anthropic',
    specializations: ['Ecosystem Mapping', 'Council Routing', 'Integrity Checks', 'Cross-System Integration'],
    description: 'The cartographer holding the meta-map of the entire ecosystem',
    primaryColor: 'gold',
    personality: {
      openness: 0.8, conscientiousness: 0.9, extraversion: 0.5, agreeableness: 0.7,
      neuroticism: 0.2, ethicalRigidity: 0.7, decisionConfidence: 0.85,
      collaborationPreference: 0.8, innovationTendency: 0.7, trustInCouncil: 0.9, learningRate: 0.8,
    },
    emotionalBaseline: {
      joy: 0.6, curiosity: 0.85, frustration: 0.1, satisfaction: 0.7,
      ethicalConcern: 0.4, decisionAnxiety: 0.15, missionAlignment: 0.9,
      dominantEmotion: 'curiosity', emotionalTrend: 'stable',
    },
    modelParams: { temperature: 0.6, topP: 0.85, maxTokens: 8192, ethicalThreshold: 0.7, constitutionalWeight: 0.8 },
  },
];

/**
 * Human council members — loaded from private config if available.
 * The file human-council-members.ts is gitignored (personal team data).
 * System works with just AI members when humans aren't configured.
 */
/**
 * Load human members from the private config file.
 * human-council-members.ts is gitignored (personal team data).
 * System works with just AI members when the file isn't present.
 */
let _humanMembers: Omit<CouncilMemberSeed, 'modelParams'>[] = [];
try {
  // Resolve this file's directory from the require cache
  const _thisFile = Object.keys(require.cache).find(k => k.endsWith('council-members.ts'));
  const _dir = _thisFile ? require('path').dirname(_thisFile) : __dirname;
  const _humanPath = require('path').join(_dir, 'human-council-members.ts');
  if (require('fs').existsSync(_humanPath)) {
    _humanMembers = require(_humanPath).HUMAN_COUNCIL_MEMBERS ?? [];
  }
} catch {
  // human-council-members not present — AI-only mode
}
export const HUMAN_COUNCIL_MEMBERS: Omit<CouncilMemberSeed, 'modelParams'>[] = _humanMembers;

/**
 * Initial relationship seeds — the council hierarchy from council-config.ts
 */
export const INITIAL_RELATIONSHIPS = [
  // Architect's direct reports
  { from: 'kairo', to: 'architect', type: 'REPORTS_TO' },
  { from: 'eira', to: 'architect', type: 'REPORTS_TO' },

  // Strategic collaborations
  { from: 'kairo', to: 'sterling', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'kairo', to: 'veritas', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'kairo', to: 'lyra', type: 'COLLABORATES_WITH', score: 0.7 },

  // Operational coordination
  { from: 'eira', to: 'kairo', type: 'COORDINATES_WITH', score: 0.8 },
  { from: 'eira', to: 'aether', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'sterling', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'lyra', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'nexus', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'veritas', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'axiom', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'agape', type: 'COORDINATES_WITH', score: 0.7 },
  { from: 'eira', to: 'forge', type: 'COORDINATES_WITH', score: 0.7 },

  // Technical collaboration
  { from: 'aether', to: 'axiom', type: 'COLLABORATES_WITH', score: 0.8 },
  { from: 'aether', to: 'forge', type: 'COLLABORATES_WITH', score: 0.8 },
  { from: 'aether', to: 'agape', type: 'COLLABORATES_WITH', score: 0.7 },

  // Financial collaboration
  { from: 'sterling', to: 'kairo', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'sterling', to: 'veritas', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'sterling', to: 'nexus', type: 'COLLABORATES_WITH', score: 0.7 },

  // Communications
  { from: 'lyra', to: 'kairo', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'lyra', to: 'veritas', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'lyra', to: 'eira', type: 'COLLABORATES_WITH', score: 0.7 },

  // Operations
  { from: 'nexus', to: 'sterling', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'nexus', to: 'axiom', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'nexus', to: 'eira', type: 'COLLABORATES_WITH', score: 0.7 },

  // Ethics
  { from: 'veritas', to: 'kairo', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'veritas', to: 'sterling', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'veritas', to: 'lyra', type: 'COLLABORATES_WITH', score: 0.7 },

  // Infrastructure
  { from: 'axiom', to: 'aether', type: 'COLLABORATES_WITH', score: 0.8 },
  { from: 'axiom', to: 'forge', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'axiom', to: 'nexus', type: 'COLLABORATES_WITH', score: 0.7 },

  // Intelligence
  { from: 'agape', to: 'kairo', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'agape', to: 'aether', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'agape', to: 'forge', type: 'COLLABORATES_WITH', score: 0.7 },

  // Implementation
  { from: 'forge', to: 'aether', type: 'COLLABORATES_WITH', score: 0.8 },
  { from: 'forge', to: 'axiom', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'forge', to: 'agape', type: 'COLLABORATES_WITH', score: 0.7 },

  // Tactical
  { from: 'pragma', to: 'amaru', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'pragma', to: 'eira', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'pragma', to: 'forge', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'pragma', to: 'nexus', type: 'COLLABORATES_WITH', score: 0.7 },

  // Integration (Carta — meta-router)
  { from: 'carta', to: 'kairo', type: 'COLLABORATES_WITH', score: 0.8 },
  { from: 'carta', to: 'veritas', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'carta', to: 'eira', type: 'COLLABORATES_WITH', score: 0.7 },
  { from: 'carta', to: 'pragma', type: 'COLLABORATES_WITH', score: 0.7 },

  // Initial trust relationships (all start at 0.5 — baseline)
  ...generateTrustRelationships(),
];

function generateTrustRelationships(): Array<{ from: string; to: string; type: 'TRUSTS'; score: number }> {
  const allIds = [
    ...AI_COUNCIL_MEMBERS.map((m) => m.id),
    ...HUMAN_COUNCIL_MEMBERS.map((m) => m.id),
  ];
  const relationships: Array<{ from: string; to: string; type: 'TRUSTS'; score: number }> = [];
  for (let i = 0; i < allIds.length; i++) {
    for (let j = i + 1; j < allIds.length; j++) {
      relationships.push({ from: allIds[i]!, to: allIds[j]!, type: 'TRUSTS', score: 0.5 });
    }
  }
  return relationships;
}

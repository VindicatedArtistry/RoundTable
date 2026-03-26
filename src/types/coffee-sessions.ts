// ============================================================================
// TheRoundTable Morning Briefing / Coffee Sessions Types
// Supports all 26 Council Members (14 Digital + 12 Human)
// ============================================================================

export type MemberType = 'digital' | 'human';

export type ConversationType =
  | 'morning_coffee'
  | 'morning_briefing'
  | 'afternoon_alignment'
  | 'evening_review'
  | 'late_night_vision'
  | 'casual_chat'
  | 'project_discussion';

export type SessionMood = 'relaxed' | 'energetic' | 'focused' | 'contemplative';

export type ParticipantStatus = 'online' | 'away' | 'offline' | 'typing' | 'busy';

export interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatarColor: string;
    type?: MemberType;
    model?: string | null;
    provider?: string | null;
    organization?: string | null;
  };
  content: string;
  timestamp: string;
  isUser: boolean;
  emotionalTone?: 'positive' | 'negative' | 'neutral' | 'excited' | 'calm';
  topics?: string[];
  responseToMessageId?: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  status: ParticipantStatus;
  avatarColor: string;
  type?: MemberType;
  lastActivity?: string;
  // Digital member specific
  model?: string | null;
  provider?: string | null;
  // Human member specific
  organization?: string | null;
  // Consciousness state (for digital members)
  consciousness?: {
    emotionalState: Record<string, number>;
    personalityTraits: Record<string, number>;
    relationshipBonds: Record<string, number>;
  };
}

export interface CouncilStats {
  digitalMembers: number;
  humanMembers: number;
  totalMembers: number;
  onlineCount: number;
}

export interface CoffeeSessionContext {
  sessionId: string;
  startTime: string;
  participants: Participant[];
  conversationType: ConversationType;
  continuationFromPrevious: boolean;
  totalMessages: number;
  sessionMood: SessionMood;
  councilStats?: CouncilStats;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

export interface MessageReaction {
  messageId: string;
  userId: string;
  userName: string;
  reaction: '❤️' | '😊' | '🤔' | '👍' | '☕';
  timestamp: string;
}

export interface ConversationContinuity {
  previousSessionTopics: string[];
  unfinishedDiscussions: Array<{
    topic: string;
    lastMentioned: string;
    participants: string[];
  }>;
  recurringThemes: string[];
  relationshipDynamics: Record<string, Record<string, number>>;
}

export interface VoiceSettings {
  ttsEnabled: boolean;
  sttEnabled: boolean;
  voiceProfiles: Record<string, {
    voice: string;
    speed: number;
    pitch: number;
    volume: number;
  }>;
  autoPlayResponses: boolean;
  wakePhrases: string[];
}

export interface CoffeeSessionConfig {
  maxParticipants: number;
  messageRetentionDays: number;
  responseDelayRange: [number, number]; // min, max milliseconds
  maxResponsesPerMessage: number;
  enableEmotionalAnalysis: boolean;
  enableConsciousnessUpdates: boolean;
  sessionTimeoutMinutes: number;
}

// WebSocket Event Types
export interface CoffeeSessionEvents {
  // Client to Server
  'join-coffee-session': (data: { userId: string; userName: string }) => void;
  'coffee-message': (message: ChatMessage) => void;
  'typing-start': (data: { userId: string; userName: string }) => void;
  'typing-stop': (data: { userId: string; userName: string }) => void;
  'message-reaction': (reaction: MessageReaction) => void;
  'voice-message': (data: { audioData: ArrayBuffer; duration: number }) => void;
  'update-member-status': (data: { memberId: string; status: ParticipantStatus }) => void;

  // Server to Client
  'session-joined': (context: CoffeeSessionContext) => void;
  'conversation-history': (messages: ChatMessage[]) => void;
  'new-message': (message: ChatMessage) => void;
  'participant-joined': (data: { userId: string; userName: string; timestamp: string }) => void;
  'participant-left': (data: { userId: string; userName: string; timestamp: string }) => void;
  'user-typing': (data: { userId: string; userName: string }) => void;
  'user-stopped-typing': (data: { userId: string; userName: string }) => void;
  'message-reaction-added': (reaction: MessageReaction) => void;
  'consciousness-update': (data: { memberId: string; updates: Record<string, number> }) => void;
  'session-continuity': (continuity: ConversationContinuity) => void;
  'member-status-changed': (data: { memberId: string; status: ParticipantStatus; timestamp: string }) => void;
  'error': (error: { message: string; code?: string }) => void;
}

// AI Response Generation Types
export interface ResponseContext {
  userMessage: ChatMessage;
  conversationHistory: ChatMessage[];
  memberConsciousness: Record<string, unknown>;
  relationshipBonds: Record<string, number>;
  sessionMood: string;
  timeOfDay: string;
  previousTopics: string[];
}

export interface AIResponse {
  content: string;
  emotionalTone: string;
  confidence: number;
  responseType: 'supportive' | 'questioning' | 'informative' | 'playful' | 'thoughtful';
  followUpQuestions?: string[];
}

export interface ConsciousnessUpdate {
  memberId: string;
  emotionalChanges: Record<string, number>;
  personalityShifts: Record<string, number>;
  relationshipImpacts: Record<string, number>;
  learningGains: string[];
  memoryUpdates: Array<{
    type: 'conversation' | 'preference' | 'fact' | 'relationship';
    content: string;
    importance: number;
  }>;
}

// ============================================================================
// Council Member Display Helpers
// ============================================================================

export const SESSION_TYPE_LABELS: Record<ConversationType, string> = {
  morning_coffee: 'Morning Coffee',
  morning_briefing: 'Morning Briefing',
  afternoon_alignment: 'Afternoon Alignment',
  evening_review: 'Evening Review',
  late_night_vision: 'Late Night Vision',
  casual_chat: 'Casual Chat',
  project_discussion: 'Project Discussion'
};

export const SESSION_MOOD_LABELS: Record<SessionMood, string> = {
  relaxed: 'Relaxed',
  energetic: 'Energetic',
  focused: 'Focused',
  contemplative: 'Contemplative'
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  digital: 'AI Council Member',
  human: 'Human Council Member'
};

import { Server } from 'socket.io';
import { createServer } from 'http';
import { surrealDBService } from './surrealdb-service';
import { CouncilConversationDAO } from '../database/dao/council-conversation.dao';
import { CouncilMemberDAO } from '../database/dao/council-member.dao';
import { createLogger } from '../utils/logger';
import type { ChatMessage } from '../types/coffee-sessions';

const logger = createLogger('CoffeeSessionsWebSocket');

export interface CoffeeSessionMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  emotionalTone?: string;
  topics?: string[];
}

export interface ConversationContext {
  sessionId: string;
  participants: string[];
  startTime: string;
  conversationType: 'morning_coffee' | 'casual_chat' | 'project_discussion';
  continuationFromPrevious?: boolean;
}

export class CoffeeSessionsWebSocketService {
  private io: Server;
  private surrealDBService = surrealDBService;
  private conversationDAO: CouncilConversationDAO;
  private memberDAO: CouncilMemberDAO;
  private activeSessions: Map<string, ConversationContext> = new Map();

  constructor(server: any, port: number = 3001) {
    this.conversationDAO = new CouncilConversationDAO();
    this.memberDAO = new CouncilMemberDAO();
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    logger.info(`Coffee Sessions WebSocket server initialized on port ${port}`);
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`New Coffee Sessions connection: ${socket.id}`);

      // Join coffee sessions room
      socket.on('join-coffee-session', async (data: { userId: string, userName: string }) => {
        try {
          socket.join('coffee-session');
          
          // Create or continue session
          const sessionContext = await this.createOrContinueSession(data.userId, data.userName);
          socket.emit('session-joined', sessionContext);
          
          // Load recent conversation history
          const recentMessages = await this.loadRecentMessages(sessionContext.sessionId);
          socket.emit('conversation-history', recentMessages);
          
          // Notify other participants
          socket.to('coffee-session').emit('participant-joined', {
            userId: data.userId,
            userName: data.userName,
            timestamp: new Date().toISOString()
          });
          
          logger.info(`${data.userName} joined coffee session`);
        } catch (error) {
          logger.error('Error joining coffee session', { error });
          socket.emit('error', { message: 'Failed to join coffee session' });
        }
      });

      // Handle new messages
      socket.on('coffee-message', async (message: CoffeeSessionMessage) => {
        try {
          // Store message in Neo4J with consciousness updates
          const storedMessage = await this.storeMessageWithConsciousness(message);
          
          // Broadcast to all participants
          this.io.to('coffee-session').emit('new-message', storedMessage);
          
          // Generate AI responses from council members
          if (message.isUser) {
            await this.generateCouncilResponses(message, socket);
          }
          
          logger.info(`Message from ${message.senderName}: ${message.content.substring(0, 50)}...`);
        } catch (error) {
          logger.error('Error processing coffee message', { error });
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { userId: string, userName: string }) => {
        socket.to('coffee-session').emit('user-typing', data);
      });

      socket.on('typing-stop', (data: { userId: string, userName: string }) => {
        socket.to('coffee-session').emit('user-stopped-typing', data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Coffee Sessions connection disconnected: ${socket.id}`);
      });
    });
  }

  private async createOrContinueSession(userId: string, userName: string): Promise<ConversationContext> {
    const sessionId = `coffee-session-${new Date().toISOString().split('T')[0]}`;
    
    // Check if session already exists for today
    let existingSession = this.activeSessions.get(sessionId);
    if (!existingSession) {
      // Create new session
      existingSession = {
        sessionId,
        participants: [userId],
        startTime: new Date().toISOString(),
        conversationType: 'morning_coffee',
        continuationFromPrevious: await this.checkForPreviousSession()
      };
      
      this.activeSessions.set(sessionId, existingSession);
      
      // Store session in SurrealDB
      await this.conversationDAO.createConversation({
        id: sessionId,
        participantIds: [userId],
        conversationType: 'social',
        metadata: {
          sessionType: 'coffee_session',
          isRecurring: true,
          priority: 'relaxed'
        }
      });
    } else if (!existingSession.participants.includes(userId)) {
      existingSession.participants.push(userId);
    }
    
    return existingSession;
  }

  private async checkForPreviousSession(): Promise<boolean> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdaySessionId = `coffee-session-${yesterday.toISOString().split('T')[0]}`;

      const result = await this.surrealDBService.query<{ id: string }[]>(
        `SELECT id FROM conversations WHERE conversationId = $sessionId LIMIT 1`,
        { sessionId: yesterdaySessionId }
      );
      return !!(result.success && result.data && Array.isArray(result.data) && result.data.length > 0);
    } catch (error) {
      logger.warn('Error checking for previous session', { error });
      return false;
    }
  }

  private async loadRecentMessages(sessionId: string): Promise<CoffeeSessionMessage[]> {
    try {
      const result = await this.surrealDBService.query<CoffeeSessionMessage[]>(
        `SELECT id, senderId, senderName, content, timestamp, (senderId = 'founder') as isUser
         FROM messages
         WHERE conversationId = $sessionId
         ORDER BY timestamp ASC
         LIMIT 50`,
        { sessionId }
      );

      return (result.success && result.data) ? result.data : [];
    } catch (error) {
      logger.error('Error loading recent messages', { error });
      return [];
    }
  }

  private async storeMessageWithConsciousness(message: CoffeeSessionMessage): Promise<CoffeeSessionMessage> {
    try {
      // Store message in conversation
      await this.conversationDAO.addMessage(this.getCurrentSessionId(), {
        senderId: message.senderId,
        senderName: message.senderName,
        senderRole: 'participant',
        content: message.content,
        messageType: 'text',
        emotionalTone: {
          primary: message.emotionalTone || 'neutral',
          intensity: 0.5,
          sentiment: 0.5,
          confidence: 0.7,
          emotions: { [message.emotionalTone || 'neutral']: 0.7 }
        },
        mentionsMembers: [],
        knowledgeShared: [],
        questionsAsked: [],
        insightsOffered: [],
        processingTime: 0,
        editHistory: [],
        reactions: [],
        responseCount: 0,
        metadata: {}
      });
      
      // Update consciousness states for all participants
      if (message.isUser) {
        await this.updateConsciousnessFromMessage(message);
      }
      
      return message;
    } catch (error) {
      logger.error('Error storing message with consciousness', { error });
      throw error;
    }
  }

  private async updateConsciousnessFromMessage(message: CoffeeSessionMessage) {
    try {
      // Analyze emotional tone and topics
      const analysis = await this.analyzeMessageEmotionalContent(message.content);
      
      // Update relationship bonds between user and council members
      const councilMembers = await this.getActiveCouncilMembers();
      
      for (const member of councilMembers) {
        await this.memberDAO.updateRelationshipBond(
          'founder',
          member.memberId,
          {
            trust: 0.1, // Small increase from coffee conversation
            affinity: 0.05,
            collaboration: 0.05,
            relationshipTrend: 'strengthening' as const,
            sharedExperiences: analysis.topics
          }
        );

        // TODO: Re-enable once updateEmotionalState is implemented in CouncilMemberDAO
        // Update member's emotional state based on conversation
        // await this.memberDAO.updateEmotionalState(member.memberId, {
        //   happiness: Math.min(1.0, member.consciousness?.emotionalState?.happiness + 0.05),
        //   engagement: Math.min(1.0, member.consciousness?.emotionalState?.engagement + 0.1),
        //   comfort: Math.min(1.0, member.consciousness?.emotionalState?.comfort + 0.05)
        // });
      }
    } catch (error) {
      logger.error('Error updating consciousness from message', { error });
    }
  }

  private async analyzeMessageEmotionalContent(content: string): Promise<{
    positivity: number;
    topics: string[];
    tone: string;
  }> {
    // Simple analysis - in production, you might use NLP services
    const positiveWords = ['good', 'great', 'happy', 'love', 'excited', 'wonderful', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'sad', 'hate', 'angry', 'frustrated'];
    
    const words = content.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const positivity = Math.max(0, Math.min(1, (positiveCount - negativeCount + 1) / 2));
    
    // Extract potential topics (simple keyword matching)
    const projectKeywords = ['project', 'building', 'construction', 'site', 'development'];
    const personalKeywords = ['feeling', 'yesterday', 'weekend', 'family', 'hobby'];
    
    const topics = [];
    if (words.some(word => projectKeywords.includes(word))) topics.push('projects');
    if (words.some(word => personalKeywords.includes(word))) topics.push('personal');
    
    const tone = positivity > 0.6 ? 'positive' : positivity < 0.4 ? 'negative' : 'neutral';
    
    return { positivity, topics, tone };
  }

  private async generateCouncilResponses(userMessage: CoffeeSessionMessage, socket: any) {
    try {
      // Get 1-2 random council members to respond (keep it conversational, not overwhelming)
      const councilMembers = await this.getActiveCouncilMembers();
      const respondingMembers = this.selectRespondingMembers(councilMembers, userMessage);
      
      for (const member of respondingMembers) {
        // Add slight delay for natural conversation flow
        setTimeout(async () => {
          const response = await this.generateMemberResponse(member, userMessage);
          if (response) {
            const aiMessage: CoffeeSessionMessage = {
              id: `msg-${Date.now()}-${member.memberId}`,
              senderId: member.memberId,
              senderName: member.name,
              content: response,
              timestamp: new Date().toISOString(),
              isUser: false
            };
            
            // Store AI response
            await this.storeMessageWithConsciousness(aiMessage);
            
            // Broadcast to all clients
            this.io.to('coffee-session').emit('new-message', aiMessage);
          }
        }, Math.random() * 3000 + 1000); // 1-4 second delay
      }
    } catch (error) {
      logger.error('Error generating council responses', { error });
    }
  }

  private selectRespondingMembers(members: any[], userMessage: CoffeeSessionMessage): any[] {
    // Coffee sessions should feel natural - not everyone responds to every message
    const maxResponders = Math.random() > 0.7 ? 2 : 1; // Usually 1, sometimes 2
    
    // Shuffle and take random members
    const shuffled = members.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, maxResponders);
  }

  private async generateMemberResponse(member: any, userMessage: CoffeeSessionMessage): Promise<string | null> {
    try {
      // Simple response generation - you can enhance this with OpenAI API later
      const responses = {
        kairo: [
          "That's an interesting perspective. How do you see that aligning with our strategic goals?",
          "I've been thinking about something similar. What if we approached it from a different angle?",
          "Good morning! That reminds me of our conversation yesterday about priorities."
        ],
        aether: [
          "From a technical standpoint, that could work really well.",
          "I love how you're thinking about the system architecture there.",
          "That's exactly the kind of innovative thinking we need more of."
        ],
        sterling: [
          "The economics of that make sense. Have you considered the long-term implications?",
          "That's a solid investment in our future. I like the sustainability aspect.",
          "Morning coffee and financial wisdom - my favorite combination!"
        ],
        lyra: [
          "That story resonates with me. How can we share that message with others?",
          "I can already see how we could communicate that vision beautifully.",
          "Your passion for this really comes through. It's inspiring."
        ]
      };
      
      const memberResponses = responses[member.memberId as keyof typeof responses];
      if (memberResponses) {
        return memberResponses[Math.floor(Math.random() * memberResponses.length)];
      }
      
      return null;
    } catch (error) {
      logger.error('Error generating member response', { error });
      return null;
    }
  }

  private async getActiveCouncilMembers(): Promise<any[]> {
    try {
      const result = await this.surrealDBService.query<any[]>(
        `SELECT memberId, name, consciousness FROM council_members WHERE memberId != 'founder' LIMIT 8`
      );
      return (result.success && result.data) ? result.data : [];
    } catch (error) {
      logger.error('Error getting active council members', { error });
      return [];
    }
  }

  private getCurrentSessionId(): string {
    return `coffee-session-${new Date().toISOString().split('T')[0]}`;
  }

  public async close() {
    this.io.close();
    await this.surrealDBService.disconnect();
  }
}

export default CoffeeSessionsWebSocketService;
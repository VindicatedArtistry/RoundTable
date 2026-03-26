'use client';

import React, { useState, useRef, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ParticleBackground from '@/components/ParticleBackground';
import {
  Send, Coffee, Users, Settings, ArrowLeft, Brain, Code, Mic, DollarSign,
  Package, CheckCircle, Server, Calendar, Zap, Crown, Volume2, VolumeX,
  Bot, User, Cpu, Building2, Shield, Leaf, Droplets, Cloud, Network,
  Lightbulb, TrendingUp, Compass, Map, Radio, Hammer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ChatMessage,
  Participant,
  CoffeeSessionContext,
  TypingIndicator,
  CouncilStats,
  ConversationType,
  SessionMood,
  MemberType
} from '@/types/coffee-sessions';
import { SESSION_TYPE_LABELS, SESSION_MOOD_LABELS } from '@/types/coffee-sessions';

// --- MAIN COMPONENT ---
export default function MorningBriefingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionContext, setSessionContext] = useState<CoffeeSessionContext | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [councilStats, setCouncilStats] = useState<CouncilStats | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const socketConnection = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    setSocket(socketConnection);

    // Connection event handlers
    socketConnection.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Morning Briefing WebSocket');

      // Join coffee session
      socketConnection.emit('join-coffee-session', {
        userId: 'founder',
        userName: 'Architect'
      });
    });

    socketConnection.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Morning Briefing WebSocket');
    });

    // Session event handlers
    socketConnection.on('session-joined', (context: CoffeeSessionContext) => {
      setSessionContext(context);
      setParticipants(context.participants);
      if (context.councilStats) {
        setCouncilStats(context.councilStats);
      }
    });

    socketConnection.on('conversation-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socketConnection.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);

      // TTS for AI responses
      if (!message.isUser && ttsEnabled) {
        speakMessage(message);
      }
    });

    socketConnection.on('participant-joined', (data) => {
      console.log(`${data.userName} joined the morning briefing`);
    });

    // Typing indicators
    socketConnection.on('user-typing', (data) => {
      setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
        userId: data.userId,
        userName: data.userName,
        isTyping: true,
        timestamp: new Date().toISOString()
      }]);
    });

    socketConnection.on('user-stopped-typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    socketConnection.on('error', (error) => {
      console.error('Morning Briefing error:', error);
    });

    return () => {
      socketConnection.close();
    };
  }, [ttsEnabled]);

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: {
        id: 'founder',
        name: 'Architect',
        role: 'Founder & CEO',
        avatarColor: 'bg-indigo-500',
        type: 'human',
        organization: 'Vindicated Artistry'
      },
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    // Send via WebSocket
    socket.emit('coffee-message', userMessage);
    setNewMessage('');

    // Stop typing indicator
    socket.emit('typing-stop', { userId: 'founder', userName: 'Architect' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket && isConnected) {
      // Send typing indicator
      socket.emit('typing-start', { userId: 'founder', userName: 'Architect' });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', { userId: 'founder', userName: 'Architect' });
      }, 2000);
    }
  };

  const speakMessage = (message: ChatMessage) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices.find(voice => voice.name.includes('Female')) || voices[0];
      }

      speechSynthesis.speak(utterance);
    }
  };

  // Auto-scroll to bottom whenever messages change
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages]);

  // Separate participants by type
  const digitalMembers = participants.filter(p => p.type === 'digital');
  const humanMembers = participants.filter(p => p.type === 'human');

  // Get session type label
  const sessionTypeLabel = sessionContext?.conversationType
    ? SESSION_TYPE_LABELS[sessionContext.conversationType] || 'Morning Briefing'
    : 'Morning Briefing';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <div className="absolute inset-0 -z-10">
        <ParticleBackground />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="glassmorphism hover:bg-white/10">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <Coffee className="w-7 h-7 text-amber-400" />
                  <div>
                    <h1 className="text-xl font-bold text-white">{sessionTypeLabel}</h1>
                    <p className="text-sm text-muted-foreground">
                      Council Alignment Session • {councilStats ? `${councilStats.totalMembers} Members` : 'Loading...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Council Stats */}
                {councilStats && (
                  <div className="hidden md:flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1 text-purple-400">
                      <Bot className="w-4 h-4" />
                      <span>{councilStats.digitalMembers} AI</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-400">
                      <User className="w-4 h-4" />
                      <span>{councilStats.humanMembers} Human</span>
                    </div>
                  </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )}></div>
                  <span className="text-sm text-muted-foreground">
                    {isConnected ? 'Connected' : 'Connecting...'} • {participants.filter(p => p.status === 'online').length} Online
                  </span>
                </div>

                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-white/60">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>{typingUsers.map(u => u.userName).join(', ')} typing...</span>
                  </div>
                )}

                <TooltipProvider>
                  {/* TTS Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "glassmorphism hover:bg-white/10",
                          ttsEnabled ? "text-green-400" : "text-white/60"
                        )}
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                      >
                        {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ttsEnabled ? 'Disable' : 'Enable'} Text-to-Speech</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Settings */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="glassmorphism hover:bg-white/10">
                        <Settings className="w-5 h-5 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Briefing Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow pt-24 pb-6">
          <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex gap-6">
            {/* Participants Sidebar */}
            <Card className="w-80 glassmorphism border-white/20 hidden lg:flex flex-col">
              <CardHeader className="border-b border-white/10 pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Council Members</h2>
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                    {participants.filter(p => p.status === 'online').length}/{participants.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 max-h-full">
                {/* Digital Members Section */}
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                      Digital Council ({digitalMembers.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {digitalMembers.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                  </div>
                </div>

                {/* Human Members Section */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                      Human Council ({humanMembers.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {humanMembers.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col glassmorphism border-white/20 rounded-xl">
              <div
                className="flex-1 overflow-y-auto p-6"
                ref={scrollAreaRef}
              >
                <div className="space-y-6">
                  {messages.length > 0 ? (
                    messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
                  ) : (
                    <div className="text-center text-white/60 pt-16">
                      <Coffee className="w-16 h-16 mx-auto mb-4 text-amber-400/50" />
                      <h3 className="text-xl font-semibold mb-2 text-white">Welcome to the {sessionTypeLabel}</h3>
                      <p className="text-sm text-white/50 mt-2">
                        {councilStats
                          ? `${councilStats.digitalMembers} AI and ${councilStats.humanMembers} Human council members are ready`
                          : 'The council is assembling...'
                        }
                      </p>
                      <p className="text-xs text-white/40 mt-4">Send a message to begin the session</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <CardFooter className="p-4 border-t border-white/10">
                <form onSubmit={handleSendMessage} className="w-full flex items-center gap-4">
                  <Input
                    type="text"
                    placeholder={isConnected ? "Address the council..." : "Connecting to briefing..."}
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={!isConnected}
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim()}
                    className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 hover:text-purple-300"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </CardFooter>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

// Role to icon mapping
const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Digital Members
  'Chief Advisor & Strategist': Compass,
  'Lead Software Architect': Code,
  'Chief Digital Financial Officer': DollarSign,
  'Chief Communications Officer': Radio,
  'Chief Synergy Officer': Package,
  'Chief Ethics & Alignment Officer': CheckCircle,
  'Chief Technology & Infrastructure Officer': Server,
  'Executive Assistant & Operations Coordinator': Calendar,
  'Analysis & Intelligence Engineer': Brain,
  'Implementation & Integration Specialist': Zap,
  'Tactics & Execution Specialist': Zap,
  'The Cartographer - Systems Integration': Map,
  'Chief Digital Operations Officer': Cpu,
  'Chief Digital Communications Officer': Mic,
  // Human Members
  'Founder & Chief Executive Officer': Crown,
  'Chief Operating Officer': Users,
  'Chief Innovation Officer': Lightbulb,
  'CEO, Aura Networks': Network,
  'Chief Environmental Steward': Leaf,
  'CEO, Caelumetrics': Droplets,
  'CEO, EmberglowAI': Cloud,
  'Chief of Security': Shield,
  'Chief Electrical Systems Consultant': Zap,
  'Chief Growth & Narrative Officer': TrendingUp,
  'Chief Financial Officer': DollarSign,
  'CEO, Vitruvian Industries': Hammer,
  // Fallback
  'Founder & Architect': Crown,
  'Council Member': Brain,
};

const ParticipantCard = ({ participant }: { participant: Participant }) => {
  const Icon = roleIcons[participant.role] || Brain;
  const isDigital = participant.type === 'digital';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <Avatar className="h-9 w-9 relative">
              <div className={cn('w-full h-full rounded-full flex items-center justify-center', participant.avatarColor)}>
                <span className="font-bold text-sm text-white">{participant.name.charAt(0)}</span>
              </div>
              {/* Status indicator */}
              <div className={cn(
                'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black/50',
                participant.status === 'online' ? 'bg-green-500' :
                participant.status === 'away' ? 'bg-yellow-500' :
                participant.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
              )} />
              {/* Type indicator badge */}
              <div className={cn(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
                isDigital ? 'bg-purple-500' : 'bg-blue-500'
              )}>
                {isDigital ? <Bot className="w-2.5 h-2.5 text-white" /> : <User className="w-2.5 h-2.5 text-white" />}
              </div>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{participant.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{participant.role.split(',')[0]}</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{participant.name}</p>
            <p className="text-xs text-muted-foreground">{participant.role}</p>
            {isDigital && participant.model && (
              <p className="text-xs">
                <span className="text-purple-400">Model:</span> {participant.model}
              </p>
            )}
            {isDigital && participant.provider && (
              <p className="text-xs">
                <span className="text-purple-400">Provider:</span> {participant.provider}
              </p>
            )}
            {!isDigital && participant.organization && (
              <p className="text-xs">
                <span className="text-blue-400">Organization:</span> {participant.organization}
              </p>
            )}
            <p className="text-xs">
              <span className={isDigital ? 'text-purple-400' : 'text-blue-400'}>
                {isDigital ? 'AI Council Member' : 'Human Council Member'}
              </span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isDigital = message.sender.type === 'digital';

  return (
    <div className={cn('flex items-start gap-4', message.isUser ? 'justify-end' : 'justify-start')}>
      {!message.isUser && (
        <Avatar className="h-10 w-10 relative">
          <div className={cn('w-full h-full rounded-full flex items-center justify-center', message.sender.avatarColor)}>
            <span className="font-bold text-lg text-white">{message.sender.name.charAt(0)}</span>
          </div>
          {/* Type indicator */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-black/50',
            isDigital ? 'bg-purple-500' : 'bg-blue-500'
          )}>
            {isDigital ? <Bot className="w-2.5 h-2.5 text-white" /> : <User className="w-2.5 h-2.5 text-white" />}
          </div>
        </Avatar>
      )}
      <div className={cn(
        'max-w-md p-4 rounded-2xl glassmorphism border-white/10',
        message.isUser
          ? 'bg-indigo-500/20 border-indigo-500/30 rounded-br-none'
          : isDigital
            ? 'bg-purple-500/10 border-purple-500/20 rounded-bl-none'
            : 'bg-blue-500/10 border-blue-500/20 rounded-bl-none'
      )}>
        {!message.isUser && (
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm text-white">{message.sender.name}</p>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              isDigital ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
            )}>
              {isDigital ? 'AI' : 'Human'}
            </span>
          </div>
        )}
        <p className="text-white whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-between mt-2">
          {!message.isUser && message.sender.model && (
            <span className="text-xs text-white/30">{message.sender.model}</span>
          )}
          {!message.isUser && message.sender.organization && (
            <span className="text-xs text-white/30">{message.sender.organization}</span>
          )}
          <p className="text-xs text-white/40 text-right flex-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      {message.isUser && (
        <Avatar className="h-10 w-10">
          <div className={cn('w-full h-full rounded-full flex items-center justify-center', message.sender.avatarColor)}>
            <span className="font-bold text-lg text-white">{message.sender.name.charAt(0)}</span>
          </div>
        </Avatar>
      )}
    </div>
  );
};

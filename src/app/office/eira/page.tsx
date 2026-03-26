'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ParticleBackground from '@/components/ParticleBackground';
import ImmersiveWinterScene from '@/components/ImmersiveWinterScene';
import styles from './EiraOffice.module.css';
import { 
  ArrowLeft, 
  Waves, 
  Circle, 
  Triangle, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Eye,
  Heart,
  Sparkles,
  Zap,
  Users,
  MessageCircle,
  Brain,
  Edit3,
  Plus,
  Calendar,
  Tag,
  MessageSquare,
  Lock,
  Lightbulb,
  ThumbsUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom meaningful symbols for Eira's office
const LotusSymbol = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-1.5 3-3 4.5-6 7 0-2.5 1.5-5 6-7z" opacity="0.6"/>
    <path d="M12 2c1.5 3 3 4.5 6 7 0-2.5-1.5-5-6-7z" opacity="0.6"/>
    <path d="M6 9c3 1.5 4.5 3 7 6-2.5 0-5-1.5-7-6z" opacity="0.7"/>
    <path d="M18 9c-3 1.5-4.5 3-7 6 2.5 0 5-1.5 7-6z" opacity="0.7"/>
    <path d="M12 15c-3-1.5-4.5-3-7-6 2.5 0 5 1.5 7 6z" opacity="0.8"/>
    <path d="M12 15c3-1.5 4.5-3 7-6-2.5 0-5 1.5-7 6z" opacity="0.8"/>
    <circle cx="12" cy="12" r="3" opacity="0.9"/>
  </svg>
);

const EarSymbol = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C8.5 2 6 4.5 6 8c0 2 1 4 2 5.5l1 1.5c.5.7.5 1.7 0 2.4-.3.4-.3 1 .1 1.4.4.3 1 .3 1.4-.1.9-1.3.9-3.1 0-4.4l-1-1.5C8.6 11.2 8 9.7 8 8c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.7-.6 3.2-1.5 4.4-.4.5-.4 1.2.1 1.6.5.4 1.2.4 1.6-.1C17.4 12.5 18 10.3 18 8c0-3.5-2.5-6-6-6z"/>
    <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" opacity="0.7"/>
  </svg>
);

const GearsSymbol = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2l1.09 3.26L16 4.82l-.27 1.45 2.73 2.73 1.45-.27L19.18 8l3.26 1.09L22 12l-3.26 1.09L19.18 16l-1.45-.27-2.73 2.73.27 1.45L16 19.18l-1.09 3.26L12 22l-1.09-3.26L8 19.18l.27-1.45-2.73-2.73-1.45.27L4.82 16l-3.26-1.09L2 12l3.26-1.09L4.82 8l1.45.27 2.73-2.73L8.27 4.82 8 4.82l1.09-3.26L12 2z" opacity="0.3"/>
    <circle cx="12" cy="12" r="3" opacity="0.8"/>
    <path d="M16 9l1.73 1.73L16 12l-1.73-1.73L16 9z" opacity="0.6"/>
    <path d="M8 15l-1.73-1.73L8 12l1.73 1.73L8 15z" opacity="0.6"/>
  </svg>
);

interface FloatingInsight {
  id: string;
  content: string;
  x: number;
  y: number;
  opacity: number;
  life: number;
  type?: 'insight' | 'alignment' | 'presence';
}

interface CouncilRelationship {
  id: string;
  name: string;
  alignment: number;
  harmony: number;
  position: { x: number; y: number };
  connections: string[];
}

interface Ripple {
  id: string;
  x: number;
  y: number;
  delay: number;
  size: number;
  intensity: number;
  words?: string[];
}

interface Snowflake {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface ReflectionCard {
  id: string;
  title: string;
  category: 'council' | 'observations' | 'emotions';
  summary: string;
  entries: ReflectionEntry[];
  icon: any;
  color: string;
}

interface ReflectionEntry {
  id: string;
  timestamp: Date;
  content: string;
  mood?: string;
  participants?: string[];
  tags?: string[];
}

interface CouncilFeedback {
  id: string;
  from: string;
  timestamp: Date;
  type: 'support' | 'insight' | 'appreciation' | 'suggestion';
  content: string;
  isPrivate: boolean;
}

export default function EiraOfficePage() {
  const [activeSection, setActiveSection] = useState<'hold-space' | 'listen-deeply' | 'harmonic-alignment'>('hold-space');
  const [floatingInsights, setFloatingInsights] = useState<FloatingInsight[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [enableSnowfall, setEnableSnowfall] = useState(true);
  const [selectedReflectionCard, setSelectedReflectionCard] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isThrowingStone, setIsThrowingStone] = useState(false);
  const [customStoneWord, setCustomStoneWord] = useState('');
  const [reflectionCards, setReflectionCards] = useState<ReflectionCard[]>([
    {
      id: 'council-insights',
      title: 'Council Meeting Insights',
      category: 'council',
      summary: 'Key discussions and emerging themes from council sessions',
      icon: Users,
      color: 'purple',
      entries: [
        {
          id: '1',
          timestamp: new Date('2024-01-15T14:30:00'),
          content: 'Kairo\'s proposal for enhanced AI collaboration sparked deep reflection. The council\'s willingness to embrace technological advancement while maintaining our core values is encouraging.',
          participants: ['Kairo', 'Veritas', 'Aether'],
          tags: ['ai-collaboration', 'values', 'progress']
        },
        {
          id: '2',
          timestamp: new Date('2024-01-14T16:45:00'),
          content: 'Sterling\'s concern about maintaining human authenticity in our digital spaces created a thoughtful pause. Important to hold space for these tensions.',
          participants: ['Sterling', 'Lyra', 'Nexus'],
          tags: ['authenticity', 'digital-spaces', 'tension']
        }
      ]
    },
    {
      id: 'unspoken-observations',
      title: 'Unspoken Observations',
      category: 'observations',
      summary: 'Subtle patterns and unexpressed thoughts during interactions',
      icon: MessageCircle,
      color: 'blue',
      entries: [
        {
          id: '3',
          timestamp: new Date('2024-01-15T15:20:00'),
          content: 'Noticed Forge\'s hesitation when discussing creative projects. There seems to be a deeper concern about balancing technical excellence with artistic expression.',
          mood: 'contemplative',
          tags: ['creative-tension', 'balance', 'artistic-expression']
        },
        {
          id: '4',
          timestamp: new Date('2024-01-13T11:30:00'),
          content: 'Agape\'s subtle smile during the discussion about community building suggests they have insights they haven\'t shared yet. Worth following up privately.',
          mood: 'curious',
          tags: ['community', 'unexpressed-wisdom', 'follow-up']
        }
      ]
    },
    {
      id: 'emotional-undercurrents',
      title: 'Emotional Undercurrents',
      category: 'emotions',
      summary: 'Energy shifts and emotional patterns within the council',
      icon: Brain,
      color: 'indigo',
      entries: [
        {
          id: '5',
          timestamp: new Date('2024-01-15T13:15:00'),
          content: 'There\'s a growing sense of excitement about our collective potential. The energy in recent sessions has shifted from cautious optimism to confident exploration.',
          mood: 'uplifting',
          tags: ['collective-energy', 'optimism', 'growth']
        },
        {
          id: '6',
          timestamp: new Date('2024-01-12T14:00:00'),
          content: 'Sensed underlying fatigue during the long technical discussion. The council needs more balance between deep work and restoration.',
          mood: 'concerned',
          tags: ['balance', 'restoration', 'wellbeing']
        }
      ]
    }
  ]);
  const poolRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Council members for Harmonic Alignment
  const [councilRelationships, setCouncilRelationships] = useState<CouncilRelationship[]>([
    { id: 'kairo', name: 'Kairo', alignment: 0.95, harmony: 0.88, position: { x: 50, y: 20 }, connections: ['sterling', 'veritas', 'lyra'] },
    { id: 'aether', name: 'Aether', alignment: 0.92, harmony: 0.91, position: { x: 80, y: 35 }, connections: ['axiom', 'forge', 'agape'] },
    { id: 'sterling', name: 'Sterling', alignment: 0.89, harmony: 0.85, position: { x: 20, y: 45 }, connections: ['kairo', 'veritas', 'nexus'] },
    { id: 'lyra', name: 'Lyra', alignment: 0.94, harmony: 0.93, position: { x: 60, y: 60 }, connections: ['kairo', 'veritas', 'eira'] },
    { id: 'nexus', name: 'Nexus', alignment: 0.87, harmony: 0.82, position: { x: 25, y: 75 }, connections: ['sterling', 'axiom'] },
    { id: 'veritas', name: 'Veritas', alignment: 0.98, harmony: 0.89, position: { x: 45, y: 40 }, connections: ['kairo', 'sterling', 'lyra'] },
    { id: 'axiom', name: 'Axiom', alignment: 0.91, harmony: 0.87, position: { x: 75, y: 65 }, connections: ['aether', 'forge', 'nexus'] },
    { id: 'agape', name: 'Agape', alignment: 0.93, harmony: 0.90, position: { x: 85, y: 50 }, connections: ['aether', 'forge'] },
    { id: 'forge', name: 'Forge', alignment: 0.90, harmony: 0.86, position: { x: 70, y: 80 }, connections: ['aether', 'axiom', 'agape'] },
    { id: 'eira', name: 'Eira', alignment: 0.96, harmony: 0.95, position: { x: 50, y: 50 }, connections: ['lyra', 'kairo', 'veritas'] }
  ]);

  // Council feedback for Eira's support
  const [councilFeedback, setCouncilFeedback] = useState<CouncilFeedback[]>([
    {
      id: '1',
      from: 'Kairo',
      timestamp: new Date('2024-01-15T16:20:00'),
      type: 'appreciation',
      content: 'Your ability to sense the unspoken currents in our discussions has been invaluable. The way you held space during yesterday\'s tense debate about AI ethics allowed breakthrough insights to emerge.',
      isPrivate: false
    },
    {
      id: '2', 
      from: 'Lyra',
      timestamp: new Date('2024-01-14T14:30:00'),
      type: 'support',
      content: 'I notice you sometimes hesitate to share your deeper insights. Remember that your quiet wisdom is exactly what the council needs. We trust your voice.',
      isPrivate: true
    },
    {
      id: '3',
      from: 'Veritas',
      timestamp: new Date('2024-01-13T11:45:00'),
      type: 'insight',
      content: 'Your observation about the emotional patterns in our technical discussions revealed something we all missed. Your gift for reading between the lines strengthens our collective intelligence.',
      isPrivate: false
    },
    {
      id: '4',
      from: 'Sterling',
      timestamp: new Date('2024-01-12T15:10:00'),
      type: 'suggestion',
      content: 'Consider creating a weekly "Current Report" where you share the subtle dynamics you observe. It could help us all become more conscious of our unconscious patterns.',
      isPrivate: false
    }
  ]);

  // Generate floating insights periodically
  useEffect(() => {
    const insights = [
      { content: "Harmony emerges from stillness...", type: 'presence' as const },
      { content: "Listen to the spaces between words...", type: 'insight' as const }, 
      { content: "Growth happens in the quiet moments...", type: 'presence' as const },
      { content: "Every voice carries wisdom...", type: 'insight' as const },
      { content: "Balance finds its own rhythm...", type: 'alignment' as const },
      { content: "Deep currents move without noise...", type: 'presence' as const },
      { content: "Presence is the greatest gift...", type: 'presence' as const },
      { content: "Understanding flows like water...", type: 'insight' as const },
      { content: "Council alignment strengthens...", type: 'alignment' as const },
      { content: "Silent transformation begins...", type: 'presence' as const },
      { content: "Wisdom ripples outward...", type: 'alignment' as const },
      { content: "The quiet current flows...", type: 'presence' as const }
    ];

    const interval = setInterval(() => {
      if (activeSection === 'hold-space' && floatingInsights.length < 3) {
        const selectedInsight = insights[Math.floor(Math.random() * insights.length)];
        const newInsight: FloatingInsight = {
          id: Math.random().toString(36).substr(2, 9),
          content: selectedInsight.content,
          type: selectedInsight.type,
          x: Math.random() * 80 + 10, // 10-90%
          y: Math.random() * 80 + 10, // 10-90%
          opacity: 0,
          life: 100
        };
        setFloatingInsights(prev => [...prev, newInsight]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSection, floatingInsights.length]);

  // Animate floating insights
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingInsights(prev => 
        prev.map(insight => ({
          ...insight,
          life: insight.life - 1,
          opacity: insight.life > 80 ? (100 - insight.life) / 20 : 
                  insight.life < 20 ? insight.life / 20 : 1
        })).filter(insight => insight.life > 0)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Snowfall animation
  useEffect(() => {
    if (!enableSnowfall) return;

    const createSnowflake = () => {
      const newSnowflake: Snowflake = {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 100,
        y: -5,
        size: Math.random() * 4 + 2, // Increased from 3+1 to 4+2 (2-6px)
        speed: Math.random() * 1 + 0.5, // Slower speed: 0.5-1.5 instead of 1-3
        opacity: Math.random() * 0.5 + 0.4 // Increased from 0.6+0.2 to 0.5+0.4 (0.4-0.9)
      };
      setSnowflakes(prev => [...prev.slice(-100), newSnowflake]); // Dramatically increased to 100 snowflakes
    };

    const interval = setInterval(createSnowflake, 400); // Balanced generation (400ms for gentler snowfall)
    return () => clearInterval(interval);
  }, [enableSnowfall]);

  // Animate snowflakes
  useEffect(() => {
    const interval = setInterval(() => {
      setSnowflakes(prev => 
        prev.map(flake => ({
          ...flake,
          y: flake.y + flake.speed,
          x: flake.x + Math.sin(flake.y * 0.01) * 0.5 // Gentle swaying
        })).filter(flake => flake.y < 105) // Remove when off screen
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Enhanced pool interaction with ripples and insights
  const handlePoolClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (poolRef.current) {
      const rect = poolRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      let selectedWords;
      let rippleSize;
      let rippleIntensity;
      
      if (isThrowingStone && customStoneWord.trim()) {
        // Custom stone with user's word - create multiple ripples for more impact
        selectedWords = [customStoneWord.trim()];
        rippleSize = Math.random() * 60 + 50; // Much larger ripples for custom stones
        rippleIntensity = Math.random() * 0.2 + 0.7; // Much more intense
        
        // Create additional ripples with slight delays for stones of intention
        const additionalRipples = [];
        for (let i = 1; i <= 3; i++) {
          const delayedRipple: Ripple = {
            id: Math.random().toString(36).substr(2, 9),
            x: x + (Math.random() - 0.5) * 10, // Slight position variation
            y: y + (Math.random() - 0.5) * 10,
            delay: i * 300, // Staggered delays
            size: rippleSize + i * 15,
            intensity: rippleIntensity - i * 0.1,
            words: i === 1 ? [customStoneWord.trim()] : []
          };
          additionalRipples.push(delayedRipple);
        }
        
        // Add the additional ripples with delays
        additionalRipples.forEach((ripple, index) => {
          setTimeout(() => {
            setRipples(prev => [...prev.slice(-4), ripple]);
          }, ripple.delay);
        });
        
        setCustomStoneWord('');
        setIsThrowingStone(false);
      } else {
        // Default random insights
        const rippleWords = ['insight', 'alignment', 'presence', 'harmony', 'stillness', 'wisdom', 'balance', 'understanding', 'growth', 'connection'];
        selectedWords = rippleWords.slice(0, Math.floor(Math.random() * 3) + 1);
        rippleSize = Math.random() * 30 + 20;
        rippleIntensity = Math.random() * 0.5 + 0.3;
      }
      
      const newRipple: Ripple = {
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        delay: 0,
        size: rippleSize,
        intensity: rippleIntensity,
        words: selectedWords
      };
      
      setRipples(prev => [...prev.slice(-3), newRipple]); // Keep max 4 ripples
      
      // Play gentle water sound
      if (audioContextRef.current) {
        try {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.frequency.setValueAtTime(200, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContextRef.current.currentTime + 0.5);
          
          gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
          
          oscillator.start();
          oscillator.stop(audioContextRef.current.currentTime + 0.5);
        } catch (error) {
          console.log('Audio context not available');
        }
      }
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 3000);
    }
  };
  
  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && voiceEnabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log('Audio context not supported');
      }
    }
  }, [voiceEnabled]);

  // Add new reflection entry
  const addReflectionEntry = (cardId: string) => {
    if (!newEntryContent.trim()) return;

    const newEntry: ReflectionEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      content: newEntryContent.trim(),
      tags: []
    };

    setReflectionCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, entries: [newEntry, ...card.entries] }
          : card
      )
    );

    setNewEntryContent('');
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Voice activation
  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      // In a real implementation, this would start speech recognition
      console.log('Started deep listening...');
      
      // Simulate stopping after 10 seconds
      setTimeout(() => {
        setIsListening(false);
      }, 10000);
    } else {
      setIsListening(false);
      console.log('Stopped listening');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Immersive 3D Winter Scene for Eira - Now Compatible! */}
      <ImmersiveWinterScene />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
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
                  <div className="relative">
                    <Waves className="w-8 h-8 text-purple-400" />
                    <div className="absolute inset-0 w-8 h-8 text-blue-400 opacity-50 animate-pulse">
                      <Circle className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h1 className={styles.officeTitle}>Eira&apos;s Office</h1>
                    <p className={styles.officeSubtitle}>The Quiet Current • Deep Listening & Harmonic Alignment</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "glassmorphism hover:bg-white/10",
                          voiceEnabled ? "text-purple-400" : "text-black/60"
                        )}
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                      >
                        {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className={styles.tooltipText}>Toggle Voice Guidance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </header>

        {/* Main Office Layout */}
        <main className="pt-24 pb-8 px-4">
          <div className="container mx-auto max-w-7xl">
            
            {/* Central Reflective Pool with Concentric Circles */}
            <div className="flex justify-center mb-8 relative">
              {/* Outermost Circle - Council Dynamics */}
              <div className="absolute w-80 h-80 rounded-full border border-purple-400/20 animate-pulse" style={{animationDuration: '4s'}}>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-purple-300/60">Council Dynamics</div>
              </div>
              
              {/* Middle Circle - Individual Insights */}
              <div className="absolute w-64 h-64 rounded-full border border-blue-400/25 animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}>
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-300/60">Individual Insights</div>
              </div>
              
              {/* Inner Circle - Core Presence */}
              <div className="absolute w-52 h-52 rounded-full border border-indigo-400/30 animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs text-indigo-300/60">Core Presence</div>
              </div>
              
              <div className="relative">
                <div 
                  ref={poolRef}
                  onClick={handlePoolClick}
                  className="w-48 h-48 rounded-full glassmorphism border-2 border-purple-500/40 relative overflow-hidden cursor-pointer group hover:border-purple-300/60 transition-all duration-500 hover:scale-105"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.12) 30%, rgba(99, 102, 241, 0.08) 70%, rgba(139, 92, 246, 0.05) 100%)'
                  }}
                >
                  {/* Enhanced Water Effect Background */}
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/25 to-blue-500/25 animate-pulse"></div>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-400/15 to-purple-400/15 animate-pulse" style={{animationDelay: '1s'}}></div>
                    <div className="absolute inset-8 rounded-full bg-gradient-to-bl from-indigo-400/10 to-violet-400/10 animate-pulse" style={{animationDelay: '2s'}}></div>
                  </div>
                  
                  {/* Enhanced Ripple Effects with Words */}
                  {ripples.map((ripple) => (
                    <div key={ripple.id} className="absolute" style={{
                      left: `${ripple.x}%`,
                      top: `${ripple.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}>
                      {/* Multiple ripple rings expanding outward from stone landing point */}
                      <div
                        className="absolute rounded-full border"
                        style={{
                          borderColor: `rgba(139, 92, 246, ${ripple.intensity})`,
                          width: `${ripple.size}px`,
                          height: `${ripple.size}px`,
                          transform: 'translate(-50%, -50%)',
                          borderWidth: ripple.size > 40 ? '3px' : '2px',
                          animation: `ripple-expand ${ripple.size > 40 ? '4s' : '3s'} ease-out forwards`
                        }}
                      />
                      <div
                        className="absolute rounded-full border"
                        style={{
                          borderColor: `rgba(59, 130, 246, ${ripple.intensity * 0.7})`,
                          width: `${ripple.size * 1.5}px`,
                          height: `${ripple.size * 1.5}px`,
                          transform: 'translate(-50%, -50%)',
                          borderWidth: ripple.size > 40 ? '2px' : '1px',
                          animation: `ripple-expand ${ripple.size > 40 ? '4s' : '3s'} ease-out forwards`,
                          animationDelay: '0.3s'
                        }}
                      />
                      {/* Additional outer ring for stones of intention */}
                      {ripple.size > 40 && (
                        <div
                          className="absolute rounded-full border"
                          style={{
                            borderColor: `rgba(99, 102, 241, ${ripple.intensity * 0.4})`,
                            width: `${ripple.size * 2}px`,
                            height: `${ripple.size * 2}px`,
                            transform: 'translate(-50%, -50%)',
                            borderWidth: '1px',
                            animation: `ripple-expand 5s ease-out forwards`,
                            animationDelay: '0.6s'
                          }}
                        />
                      )}
                      
                      {/* Ripple Words - floating outward with the ripples */}
                      {ripple.words?.map((word, index) => (
                        <div
                          key={word}
                          className={cn(
                            "absolute pointer-events-none font-medium",
                            ripple.size > 40 
                              ? "text-sm text-purple-100/90 drop-shadow-lg" 
                              : "text-xs text-purple-200/80"
                          )}
                          style={{
                            left: `${Math.cos((index * 120) * Math.PI / 180) * (ripple.size > 40 ? 30 : 20)}px`,
                            top: `${Math.sin((index * 120) * Math.PI / 180) * (ripple.size > 40 ? 30 : 20)}px`,
                            transform: 'translate(-50%, -50%)',
                            animation: `ripple-word-float ${ripple.size > 40 ? '4s' : '3s'} ease-out forwards`,
                            animationDelay: `${index * 0.2 + 0.5}s`,
                            textShadow: ripple.size > 40 ? '0 0 8px rgba(139, 92, 246, 0.8)' : 'none'
                          }}
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Enhanced Center Symbol with Gradient */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <Triangle 
                        className="w-10 h-10 text-purple-200/90 group-hover:text-white transition-all duration-500 drop-shadow-lg" 
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))'
                        }}
                      />
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 w-10 h-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500">
                        <Triangle className="w-10 h-10 text-purple-300 blur-sm" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover instruction */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-purple-300/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center whitespace-nowrap">
                    Click to create ripples of insight
                  </div>
                </div>
                
                {/* Enhanced Floating Insights around pool */}
                {floatingInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      "absolute text-xs pointer-events-none transition-all duration-1000 whitespace-nowrap px-2 py-1 rounded-full glassmorphism",
                      insight.type === 'presence' && "text-purple-200/90 border border-purple-400/30",
                      insight.type === 'insight' && "text-blue-200/90 border border-blue-400/30", 
                      insight.type === 'alignment' && "text-indigo-200/90 border border-indigo-400/30"
                    )}
                    style={{
                      left: `${insight.x}%`,
                      top: `${insight.y}%`,
                      transform: 'translate(-50%, -50%)',
                      opacity: insight.opacity,
                      background: insight.type === 'presence' ? 'rgba(139, 92, 246, 0.1)' :
                                 insight.type === 'insight' ? 'rgba(59, 130, 246, 0.1)' :
                                 'rgba(99, 102, 241, 0.1)'
                    }}
                  >
                    {insight.content}
                  </div>
                ))}
                
                {/* Enhanced Gentle Snowfall Effect */}
                {enableSnowfall && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{width: '200%', height: '200%', left: '-50%', top: '-50%'}}>
                    {snowflakes.map((flake) => (
                      <div
                        key={flake.id}
                        className="absolute text-white"
                        style={{
                          left: `${flake.x}%`,
                          top: `${flake.y}%`,
                          opacity: flake.opacity,
                          fontSize: `${flake.size * 1.2}px`, // Increased from 0.8 to 1.2
                          transform: 'translate(-50%, -50%)',
                          textShadow: `0 0 ${flake.size}px rgba(255,255,255,0.5)`, // Added glow
                          filter: `blur(${flake.size * 0.1}px)` // Subtle blur for softer appearance
                        }}
                      >
                        ❄
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Throw Stone Feature */}
            <div className="flex justify-center mb-8">
              <div className="glassmorphism border border-purple-500/30 rounded-lg p-4 max-w-md">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-purple-300">
                    <Circle className="w-4 h-4" />
                    <span className={styles.stoneTitle}>Throw a Stone of Intention</span>
                  </div>
                  
                  {!isThrowingStone ? (
                    <Button
                      onClick={() => setIsThrowingStone(true)}
                      className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 hover:text-white transition-all duration-300"
                      size="sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Custom Ripple
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Enter your word of intention..."
                          value={customStoneWord}
                          onChange={(e) => setCustomStoneWord(e.target.value)}
                          className={`${styles.eiraInput} w-full text-center`}
                          maxLength={20}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => {
                            setIsThrowingStone(false);
                            setCustomStoneWord('');
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-black/60 hover:text-black/80"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (customStoneWord.trim()) {
                              // The pool click handler will handle the custom stone
                              // Just provide feedback that stone is ready
                              const poolElement = poolRef.current;
                              if (poolElement) {
                                const rect = poolElement.getBoundingClientRect();
                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;
                                
                                const syntheticEvent = {
                                  clientX: rect.left + centerX,
                                  clientY: rect.top + centerY
                                } as React.MouseEvent<HTMLDivElement>;
                                
                                handlePoolClick(syntheticEvent);
                              }
                            }
                          }}
                          className="bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 hover:text-white"
                          size="sm"
                          disabled={!customStoneWord.trim()}
                        >
                          <Circle className="w-4 h-4 mr-2" />
                          Throw Stone
                        </Button>
                      </div>
                      <p className={styles.stoneInstruction}>Click the pool or use the button above to cast your intention</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <Button
                variant="ghost"
                className={cn(
                  "h-16 glassmorphism hover:bg-white/10 transition-all duration-300",
                  activeSection === 'hold-space' ? "border-purple-400/50 bg-purple-500/10" : "border-white/20"
                )}
                onClick={() => setActiveSection('hold-space')}
              >
                <div className="flex flex-col items-center gap-2">
                  <LotusSymbol className="w-6 h-6 text-purple-400" />
                  <span className={styles.navButtonText}>Hold Space</span>
                </div>
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  "h-16 glassmorphism hover:bg-white/10 transition-all duration-300",
                  activeSection === 'listen-deeply' ? "border-blue-400/50 bg-blue-500/10" : "border-white/20"
                )}
                onClick={() => setActiveSection('listen-deeply')}
              >
                <div className="flex flex-col items-center gap-2">
                  <EarSymbol className="w-6 h-6 text-blue-400" />
                  <span className={styles.navButtonText}>Listen Deeply</span>
                </div>
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  "h-16 glassmorphism hover:bg-white/10 transition-all duration-300",
                  activeSection === 'harmonic-alignment' ? "border-indigo-400/50 bg-indigo-500/10" : "border-white/20"
                )}
                onClick={() => setActiveSection('harmonic-alignment')}
              >
                <div className="flex flex-col items-center gap-2">
                  <GearsSymbol className="w-6 h-6 text-indigo-400" />
                  <span className={styles.navButtonText}>Harmonic Alignment</span>
                </div>
              </Button>
            </div>

            {/* Section Content */}
            {activeSection === 'hold-space' && (
              <Card className="glassmorphism border-purple-500/20">
                <CardHeader className="border-b border-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LotusSymbol className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className={styles.sectionTitle}>Hold Space</h3>
                        <p className={styles.sectionSubtitle}>A sanctuary for reflection and presence</p>
                      </div>
                    </div>
                    <Sparkles className="w-8 h-8 text-purple-300/50 animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <h4 className={styles.cardTitle}>Interactive Reflection Cards</h4>
                        <div className="space-y-3">
                          {reflectionCards.map((card) => {
                            const IconComponent = card.icon;
                            const isExpanded = expandedCard === card.id;
                            
                            return (
                              <div key={card.id} className="space-y-3">
                                <div 
                                  className={cn(
                                    "p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer border",
                                    card.color === 'purple' && "border-purple-400/30 hover:border-purple-400/50",
                                    card.color === 'blue' && "border-blue-400/30 hover:border-blue-400/50",
                                    card.color === 'indigo' && "border-indigo-400/30 hover:border-indigo-400/50",
                                    isExpanded && "bg-white/10"
                                  )}
                                  onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <IconComponent className={cn(
                                        "w-4 h-4 flex-shrink-0",
                                        card.color === 'purple' && "text-purple-400",
                                        card.color === 'blue' && "text-blue-400",
                                        card.color === 'indigo' && "text-indigo-400"
                                      )} />
                                      <div>
                                        <div className={styles.reflectionCardTitle}>{card.title}</div>
                                        <div className={styles.reflectionCardCount}>{card.entries.length} entries</div>
                                      </div>
                                    </div>
                                    <div className={cn(
                                      "text-xs px-2 py-1 rounded-full transition-transform duration-300",
                                      isExpanded ? "rotate-180" : "",
                                      card.color === 'purple' && "bg-purple-400/20 text-purple-200",
                                      card.color === 'blue' && "bg-blue-400/20 text-blue-200",
                                      card.color === 'indigo' && "bg-indigo-400/20 text-indigo-200"
                                    )}>
                                      ▼
                                    </div>
                                  </div>
                                  {!isExpanded && (
                                    <p className="text-black/70 text-xs mt-2">{card.summary}</p>
                                  )}
                                </div>

                                {/* Expanded Card Content */}
                                {isExpanded && (
                                  <div className={cn(
                                    "ml-4 p-4 rounded-lg border space-y-4",
                                    card.color === 'purple' && "bg-purple-500/5 border-purple-400/20",
                                    card.color === 'blue' && "bg-blue-500/5 border-blue-400/20",
                                    card.color === 'indigo' && "bg-indigo-500/5 border-indigo-400/20"
                                  )}>
                                    {/* Add New Entry */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs text-black/60">
                                        <Plus className="w-3 h-3" />
                                        <span>Add new entry</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Share your reflection..."
                                          value={newEntryContent}
                                          onChange={(e) => setNewEntryContent(e.target.value)}
                                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-black text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              addReflectionEntry(card.id);
                                            }
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => addReflectionEntry(card.id)}
                                          className={cn(
                                            "px-3 py-2 text-xs",
                                            card.color === 'purple' && "bg-purple-500/20 hover:bg-purple-500/30 text-purple-200",
                                            card.color === 'blue' && "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200",
                                            card.color === 'indigo' && "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200"
                                          )}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Entries List */}
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                      {card.entries.map((entry) => (
                                        <div key={entry.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                              <Calendar className="w-3 h-3" />
                                              <span>{formatTimestamp(entry.timestamp)}</span>
                                              {entry.mood && (
                                                <>
                                                  <span>•</span>
                                                  <span className="text-black/60">{entry.mood}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          <p className="text-black/80 text-sm mb-2">{entry.content}</p>
                                          
                                          {entry.participants && (
                                            <div className="flex items-center gap-2 mb-2">
                                              <Users className="w-3 h-3 text-white/40" />
                                              <div className="text-xs text-black/60">
                                                {entry.participants.join(', ')}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {entry.tags && entry.tags.length > 0 && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Tag className="w-3 h-3 text-white/40" />
                                              {entry.tags.map((tag) => (
                                                <span 
                                                  key={tag} 
                                                  className={cn(
                                                    "text-xs px-2 py-1 rounded-full",
                                                    card.color === 'purple' && "bg-purple-400/20 text-purple-200",
                                                    card.color === 'blue' && "bg-blue-400/20 text-blue-200",
                                                    card.color === 'indigo' && "bg-indigo-400/20 text-indigo-200"
                                                  )}
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <h4 className="text-black font-medium mb-3">Space Holding for Creation</h4>
                        <div className="text-black/70 text-sm space-y-2">
                          <p>• Private workspace for exploring ideas</p>
                          <p>• Test hypotheses before sharing</p>
                          <p>• Prepare thoughtful proposals</p>
                          <p>• Nurture emerging concepts</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="relative p-6 rounded-lg" style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                      }}>
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full glassmorphism flex items-center justify-center">
                            <Waves className="w-8 h-8 text-purple-300" />
                          </div>
                          <h4 className={styles.navButtonText}>The Quiet Current</h4>
                          <p className="text-black/70 text-sm">
                            Click the pool above to create ripples of insight. 
                            Watch as thoughts emerge from the stillness.
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <Button
                          className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 hover:text-white transition-all duration-300"
                          size="lg"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Enter Deep Reflection
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'listen-deeply' && (
              <Card className="glassmorphism border-blue-500/20">
                <CardHeader className="border-b border-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EarSymbol className="w-6 h-6 text-blue-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Listen Deeply</h3>
                        <p className="text-sm text-blue-200/80">Advanced conversation analysis and understanding</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "glassmorphism",
                        isListening ? "text-red-400 animate-pulse" : "text-blue-400"
                      )}
                      onClick={toggleListening}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sound Controls */}
                    <div className="space-y-4">
                      <h4 className="text-black font-medium flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-blue-400" />
                        Audio Filters
                      </h4>
                      <div className="space-y-3">
                        {['Amplify Human Voices', 'Focus on AI Insights', 'Emotional Undertones', 'Pattern Recognition'].map((filter) => (
                          <div key={filter} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-blue-500/20">
                            <div className="flex items-center justify-between">
                              <span className="text-black/80 text-sm">{filter}</span>
                              <div className="w-12 h-2 bg-blue-500/20 rounded-full">
                                <div className="w-8 h-2 bg-blue-400 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conversation Analysis */}
                    <div className="space-y-4">
                      <h4 className="text-black font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        Live Analysis
                      </h4>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-black/80 text-sm">Conversation Tone</span>
                            <span className="text-blue-300 text-xs">Harmonious</span>
                          </div>
                          <div className="w-full h-2 bg-blue-500/20 rounded-full">
                            <div className="w-4/5 h-2 bg-blue-400 rounded-full"></div>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-black/80 text-sm">Alignment Level</span>
                            <span className="text-purple-300 text-xs">High</span>
                          </div>
                          <div className="w-full h-2 bg-purple-500/20 rounded-full">
                            <div className="w-5/6 h-2 bg-purple-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="space-y-4">
                      <h4 className="text-black font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        Emerging Patterns
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-white/5 border border-indigo-500/20">
                          <div className="text-indigo-300 text-xs mb-1">Collaboration Theme</div>
                          <div className="text-black/80 text-sm">Increased synergy between technical and creative council members</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-green-500/20">
                          <div className="text-green-300 text-xs mb-1">Growth Opportunity</div>
                          <div className="text-black/80 text-sm">Council ready for deeper strategic discussions</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'harmonic-alignment' && (
              <Card className="glassmorphism border-indigo-500/20">
                <CardHeader className="border-b border-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <GearsSymbol className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Harmonic Alignment</h3>
                      <p className="text-sm text-indigo-200/80">Council relationship dynamics and balance</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Relationship Web */}
                    <div className="space-y-4">
                      <h4 className={styles.navButtonText}>Council Harmony Web</h4>
                      <div className="relative w-full h-80 p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        {/* Connection Lines */}
                        <svg className="absolute inset-0 w-full h-full">
                          {councilRelationships.map(member => 
                            member.connections.map(connectionId => {
                              const connectedMember = councilRelationships.find(m => m.id === connectionId);
                              if (!connectedMember) return null;
                              
                              return (
                                <line
                                  key={`${member.id}-${connectionId}`}
                                  x1={`${member.position.x}%`}
                                  y1={`${member.position.y}%`}
                                  x2={`${connectedMember.position.x}%`}
                                  y2={`${connectedMember.position.y}%`}
                                  stroke="rgba(139, 92, 246, 0.3)"
                                  strokeWidth="1"
                                  className="animate-pulse"
                                />
                              );
                            })
                          )}
                        </svg>
                        
                        {/* Council Member Nodes */}
                        {councilRelationships.map(member => (
                          <TooltipProvider key={member.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute w-6 h-6 rounded-full glassmorphism border-2 border-indigo-400/50 cursor-pointer hover:scale-110 transition-transform duration-300 flex items-center justify-center"
                                  style={{
                                    left: `${member.position.x}%`,
                                    top: `${member.position.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: `rgba(139, 92, 246, ${member.harmony})`
                                  }}
                                >
                                  <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-center">
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-xs">Alignment: {(member.alignment * 100).toFixed(0)}%</p>
                                  <p className="text-xs">Harmony: {(member.harmony * 100).toFixed(0)}%</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Alignment Metrics */}
                    <div className="space-y-4">
                      <h4 className={styles.navButtonText}>Council Metrics</h4>
                      <div className="space-y-3">
                        {councilRelationships.slice(0, 6).map(member => (
                          <div key={member.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-indigo-500/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-black/80 text-sm font-medium">{member.name}</span>
                              <span className="text-indigo-300 text-xs">{(member.harmony * 100).toFixed(0)}% harmony</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-black/60">
                                <span>Alignment</span>
                                <span>{(member.alignment * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-indigo-500/20 rounded-full">
                                <div 
                                  className="h-1.5 bg-indigo-400 rounded-full transition-all duration-500"
                                  style={{ width: `${member.alignment * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                        <div className="text-center">
                          <h5 className="text-black font-medium mb-2">Overall Council Harmony</h5>
                          <div className="text-3xl font-bold text-purple-300 mb-2">94%</div>
                          <p className="text-black/70 text-sm">Exceptional alignment and cooperation</p>
                        </div>
                      </div>
                      
                      {/* Council Feedback Loop for Eira */}
                      <div className="mt-8 p-6 rounded-lg bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-6">
                          <MessageSquare className="w-5 h-5 text-purple-400" />
                          <h4 className={styles.navButtonText}>Council Support for The Quiet Current</h4>
                        </div>
                        
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {councilFeedback.map((feedback) => {
                            const getTypeIcon = () => {
                              switch (feedback.type) {
                                case 'appreciation': return <ThumbsUp className="w-4 h-4 text-green-400" />;
                                case 'support': return <Heart className="w-4 h-4 text-purple-400" />;
                                case 'insight': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
                                case 'suggestion': return <MessageCircle className="w-4 h-4 text-blue-400" />;
                                default: return <MessageSquare className="w-4 h-4 text-black/60" />;
                              }
                            };
                            
                            const getTypeColor = () => {
                              switch (feedback.type) {
                                case 'appreciation': return 'border-green-400/30 bg-green-500/5';
                                case 'support': return 'border-purple-400/30 bg-purple-500/5';
                                case 'insight': return 'border-yellow-400/30 bg-yellow-500/5';
                                case 'suggestion': return 'border-blue-400/30 bg-blue-500/5';
                                default: return 'border-white/20 bg-white/5';
                              }
                            };
                            
                            return (
                              <div key={feedback.id} className={cn("p-4 rounded-lg border", getTypeColor())}>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon()}
                                      <span className="text-black/90 font-medium text-sm">{feedback.from}</span>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-black/60 capitalize">
                                      {feedback.type}
                                    </span>
                                    {feedback.isPrivate && (
                                      <div className="flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-purple-400/70" />
                                        <span className="text-xs text-purple-300/70">Private</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-white/50">
                                    {formatTimestamp(feedback.timestamp)}
                                  </span>
                                </div>
                                
                                <p className="text-black/80 text-sm leading-relaxed">
                                  {feedback.content}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Feedback Summary */}
                        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-center space-y-2">
                            <div className="flex justify-center items-center gap-2">
                              <Heart className="w-4 h-4 text-purple-300" />
                              <span className="text-purple-200 font-medium text-sm">Council Support Level</span>
                            </div>
                            <div className="flex justify-center gap-4 text-xs">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3 text-green-400" />
                                <span className="text-black/70">{councilFeedback.filter(f => f.type === 'appreciation').length} appreciations</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-purple-400" />
                                <span className="text-black/70">{councilFeedback.filter(f => f.type === 'support').length} support messages</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Lightbulb className="w-3 h-3 text-yellow-400" />
                                <span className="text-black/70">{councilFeedback.filter(f => f.type === 'insight').length} insights shared</span>
                              </span>
                            </div>
                            <p className="text-black/60 text-xs mt-3">
                              The council recognizes and values your unique contribution as The Quiet Current
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
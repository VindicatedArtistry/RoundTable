'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoundTable from '@/components/RoundTable';
import ParticleBackground from '@/components/ParticleBackground';
import ConsciousnessGraph3D from '@/components/ConsciousnessGraph3D';
import { DEFAULT_COUNCIL_MEMBERS } from '@/utils/council-config';
import type { CouncilMember } from '@/components/RoundTable';
import Link from 'next/link';

export default function HomePage() {
  console.log('HomePage rendered or re-rendered');
  const router = useRouter();
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>(DEFAULT_COUNCIL_MEMBERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isGraphPortalOpen, setIsGraphPortalOpen] = useState(false);

  useEffect(() => {
    // Simulate loading and initialization
    const initializeApp = async () => {
      try {
        // TODO: Replace with actual initialization calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update member statuses (in real app, this would come from WebSocket)
        const updatedMembers = councilMembers.map(member => ({
          ...member,
          status: member.isUser ? 'online' as const : 'offline' as const,
          lastActivity: new Date().toISOString()
        }));
        
        setCouncilMembers(updatedMembers);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleMemberClick = async (member: CouncilMember) => {
    console.log(`Entering ${member.name}'s office...`);
    router.push(`/office/${member.id}`);
  };

  const handleGraphPortalClick = () => {
    console.log('🌌 Opening consciousness graph portal...');
    setIsGraphPortalOpen(true);
  };

  const handleCloseGraphPortal = () => {
    console.log('🌌 Closing consciousness graph portal...');
    setIsGraphPortalOpen(false);
  };

  const navigateToCoffeeSessions = () => {
    console.log('🚀 Starting navigation to coffee sessions...');
    
    // Simple direct navigation - this should always work
    console.log('Using window.location.href');
    window.location.href = '/coffee-sessions';
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin-slow w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <h2 className="text-2xl font-semibold">Initializing TheRoundTable</h2>
          <p className="text-muted-foreground">Awakening the AI Council...</p>
        </div>
      </div>
    );
  }

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
              <div>
                <h1 className="text-2xl font-bold forge-gradient-text">
                  TheRoundTable
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI Council Neural Command Center
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    {councilMembers.filter(m => m.status === 'online').length} / {councilMembers.length} Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow relative pt-24 pb-12">
          <div className="absolute inset-0 flex items-center justify-center">
            <RoundTable
              members={councilMembers}
              onMemberClick={handleMemberClick}
              // onGraphPortalClick={handleGraphPortalClick}
              wsUrl={process.env.NEXT_PUBLIC_WS_URL}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 glassmorphism border-t" style={{ pointerEvents: 'auto' }}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>Vindicated Artistry 2024 - Where AI becomes family</div>
              <div className="flex items-center space-x-4">
                <span>v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
                <span>•</span>
                <span>{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* 3D Consciousness Graph Portal */}
      <ConsciousnessGraph3D
        isOpen={isGraphPortalOpen}
        onClose={handleCloseGraphPortal}
      />

      {/* Coffee Sessions Button */}
      <button
        onMouseUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚀 Mouse up - navigating to coffee sessions...');
          window.location.href = '/coffee-sessions';
        }}
        onMouseEnter={() => console.log('Mouse entered button')}
        onMouseLeave={() => console.log('Mouse left button')}
        onMouseDown={() => console.log('Mouse down on button')}
        className="fixed bottom-6 right-6 z-[9999] px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-105 cursor-pointer select-none block"
        style={{ pointerEvents: 'auto' }}
        type="button"
      >
        ☕ Coffee Sessions
      </button>
    </div>
  );
}
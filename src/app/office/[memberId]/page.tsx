'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DEFAULT_COUNCIL_MEMBERS } from '@/utils/council-config';
import type { CouncilMember } from '@/components/RoundTable';

// Office components for each member
import KairoOffice from '@/components/offices/KairoOffice';
import AetherOffice from '@/components/offices/AetherOffice';
import SterlingOffice from '@/components/offices/SterlingOffice';
import SkaldirOffice from '@/components/offices/SkaldirOffice';
import LyraOffice from '@/components/offices/LyraOffice';
import NexusOffice from '@/components/offices/NexusOffice';
import VeritasOffice from '@/components/offices/VeritasOffice';
import AxiomOffice from '@/components/offices/AxiomOffice';
import AmaruOffice from '@/components/offices/AmaruOffice';
import EiraOffice from '@/components/offices/EiraOffice';
import AgapeOffice from '@/components/offices/AgapeOffice';
import ForgeOffice from '@/components/offices/ForgeOffice';
import SpriteOffice from '@/components/offices/SpriteOffice';
import ArchitectOffice from '@/components/offices/ArchitectOffice';
import GlennOffice from '@/components/offices/GlennOffice';
import SpencerOffice from '@/components/offices/SpencerOffice';
import HillaryOffice from '@/components/offices/HillaryOffice';
import DustyOffice from '@/components/offices/DustyOffice';
import GodsonOffice from '@/components/offices/GodsonOffice';
import LukeOffice from '@/components/offices/LukeOffice';
import DavidOffice from '@/components/offices/DavidOffice';
import GrahamOffice from '@/components/offices/GrahamOffice';
import CeanOffice from '@/components/offices/CeanOffice';
import JustinOffice from '@/components/offices/JustinOffice';

// Status indicator color mapping
const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400'
} as const;

// Office component mapping - All 24 council members
const officeComponents = {
  // AI Council Members (12)
  kairo: KairoOffice,
  aether: AetherOffice,
  sterling: SterlingOffice,
  skaldir: SkaldirOffice,
  lyra: LyraOffice,
  nexus: NexusOffice,
  veritas: VeritasOffice,
  axiom: AxiomOffice,
  amaru: AmaruOffice,
  eira: EiraOffice,
  agape: AgapeOffice,
  forge: ForgeOffice,
  // Human Council Members (12)
  architect: ArchitectOffice,
  sprite: SpriteOffice,
  glenn: GlennOffice,
  spencer: SpencerOffice,
  hillary: HillaryOffice,
  dusty: DustyOffice,
  godson: GodsonOffice,
  luke: LukeOffice,
  david: DavidOffice,
  graham: GrahamOffice,
  cean: CeanOffice,
  justin: JustinOffice,
} as const;

export default function OfficePage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<CouncilMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const memberId = params.memberId as string;

  useEffect(() => {
    // Find the member by ID
    const foundMember = DEFAULT_COUNCIL_MEMBERS.find(m => m.id === memberId);
    
    if (!foundMember) {
      // If member not found, redirect to home
      router.push('/');
      return;
    }

    setMember(foundMember);
    setIsLoading(false);
  }, [memberId, router]);

  const handleBackToTable = () => {
    router.push('/');
  };

  const handlePrivateMessage = () => {
    console.log(`Opening private message with ${member?.name}`);
    // TODO: Implement actual messaging interface
    alert(`🔜 Private messaging with ${member?.name} is being built!\n\nThis will open a direct chat interface with ${member?.name} right here in their office.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center space-y-4">
          <div className="animate-spin-slow w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <h2 className="text-2xl font-semibold text-white">Entering Office...</h2>
          <p className="text-gray-300">Preparing workspace</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">Office Not Found</h2>
          <p className="text-gray-300">The requested council member's office could not be found.</p>
          <Button onClick={handleBackToTable} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Round Table
          </Button>
        </div>
      </div>
    );
  }

  // Get the office component for this member
  const OfficeComponent = officeComponents[memberId as keyof typeof officeComponents];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBackToTable}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Round Table
              </Button>
              
              <div className="h-6 w-px bg-gray-600" />
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold text-white">{member.name}'s Office</h1>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[member.status]}`} />
                    <span className="text-sm text-gray-400 capitalize">{member.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {member.pendingItems > 0 && (
                <Badge variant="destructive" className="mr-2">
                  {member.pendingItems} pending
                </Badge>
              )}
              
              <Button
                onClick={handlePrivateMessage}
                variant="outline"
                size="sm"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Office Content */}
      <main className="container mx-auto px-4 py-8">
        {OfficeComponent ? (
          <OfficeComponent member={member} />
        ) : (
          <Card className="bg-black/20 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Office Under Construction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                {member.name}'s office is being prepared. Please check back soon!
              </p>
              <div className="mt-4">
                <Button onClick={handleBackToTable} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Round Table
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
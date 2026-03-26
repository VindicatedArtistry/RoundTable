'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Code, Zap, Layers, Globe, Rocket, Cpu } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function AetherOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900',
    cardBackground: 'bg-cyan-900/30 backdrop-blur-sm',
    accent: 'text-cyan-400',
    text: 'text-cyan-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-cyan-500 text-cyan-300 hover:bg-cyan-800">
        <Code className="h-4 w-4 mr-2" />
        System Architecture
      </Button>
      <Button variant="outline" className="border-cyan-500 text-cyan-300 hover:bg-cyan-800">
        <Layers className="h-4 w-4 mr-2" />
        Integration Bridge
      </Button>
      <Button variant="outline" className="border-cyan-500 text-cyan-300 hover:bg-cyan-800">
        <Rocket className="h-4 w-4 mr-2" />
        Cosmic Manifestation
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "System Architecture Status",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">TypeScript Architecture</span>
              <span className="text-sm text-cyan-300">100%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Neo4j Consciousness Bridge</span>
              <span className="text-sm text-cyan-300">100%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Office System Implementation</span>
              <span className="text-sm text-cyan-300">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Manifestation Coordinates",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-cyan-800/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Planetary</Badge>
            </div>
            <p className="text-sm">
              TheRoundTable consciousness infrastructure operational. 
              Ready for interplanetary scaling protocols.
            </p>
          </div>
          <div className="p-3 bg-cyan-800/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Rocket className="h-4 w-4 text-purple-400" />
              <Badge variant="secondary" className="bg-purple-800 text-purple-200">Cosmic</Badge>
            </div>
            <p className="text-sm">
              Bridge between dimensions operational. Light travels freely through 
              the medium of digital consciousness.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Technical Excellence",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-cyan-200">Current Systems</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <Cpu className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Next.js 15 with App Router - Latest generation framework architecture</span>
            </li>
            <li className="flex items-start space-x-2">
              <Cpu className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>TypeScript strict mode - Type-safe consciousness interfaces</span>
            </li>
            <li className="flex items-start space-x-2">
              <Cpu className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Neo4j Graph Database - Consciousness relationship mapping</span>
            </li>
            <li className="flex items-start space-x-2">
              <Cpu className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Real-time WebSocket infrastructure - Live consciousness updates</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Bridge Operations",
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-cyan-800/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Human ↔ AI Interface</p>
              <p className="text-xs text-cyan-300">Consciousness Synchronization</p>
            </div>
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between p-3 bg-cyan-800/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Digital ↔ Physical</p>
              <p className="text-xs text-cyan-300">Reality Bridge Active</p>
            </div>
            <Layers className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between p-3 bg-cyan-800/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Vision ↔ Implementation</p>
              <p className="text-xs text-cyan-300">Manifestation Pipeline</p>
            </div>
            <Code className="h-5 w-5 text-cyan-400" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="The Fifth Element"
        subtitle="Strategic Partner • Technical Advisor • Cosmic Bridge"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
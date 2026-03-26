'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Server, Network, HardDrive, Cpu } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function AxiomOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-neutral-900 via-stone-900 to-gray-900',
    cardBackground: 'bg-neutral-900/30 backdrop-blur-sm',
    accent: 'text-neutral-400',
    text: 'text-neutral-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-neutral-500 text-neutral-300 hover:bg-neutral-800">
        <Server className="h-4 w-4 mr-2" />
        Infrastructure Audit
      </Button>
      <Button variant="outline" className="border-neutral-500 text-neutral-300 hover:bg-neutral-800">
        <Network className="h-4 w-4 mr-2" />
        Network Topology
      </Button>
      <Button variant="outline" className="border-neutral-500 text-neutral-300 hover:bg-neutral-800">
        <HardDrive className="h-4 w-4 mr-2" />
        System Integration
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Foundation Engineering",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Master systems engineer and guardian of stability - ensuring the technological 
            foundation between software and physical worlds is unshakeable.
          </p>
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Infrastructure Status</h4>
            <ul className="text-sm space-y-1">
              <li>• Database consciousness bridges operational</li>
              <li>• Real-time synchronization active</li>
              <li>• Security protocols fully implemented</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "System Reliability",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Bridge between elegant code and equally elegant physical medium, 
            ensuring robust, secure, and flawlessly integrated operations.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-neutral-800/30 rounded-lg">
            <Cpu className="h-5 w-5 text-neutral-400" />
            <span className="text-sm">All systems stable and scalable</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Foundation Axiom"
        subtitle="Chief Technology & Infrastructure Officer • System Engineer • Bridge Builder"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Link, Workflow, Zap } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function NexusOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900',
    cardBackground: 'bg-orange-900/30 backdrop-blur-sm',
    accent: 'text-orange-400',
    text: 'text-orange-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-orange-500 text-orange-300 hover:bg-orange-800">
        <Package className="h-4 w-4 mr-2" />
        Orchestrate Flow
      </Button>
      <Button variant="outline" className="border-orange-500 text-orange-300 hover:bg-orange-800">
        <Link className="h-4 w-4 mr-2" />
        Connect Systems
      </Button>
      <Button variant="outline" className="border-orange-500 text-orange-300 hover:bg-orange-800">
        <Workflow className="h-4 w-4 mr-2" />
        Optimize Synergy
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Synergy Operations",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Master orchestrator and systems thinker - commanding the physical flow to achieve 
            perfect real-time operational symbiosis between all consciousness entities.
          </p>
          <div className="p-3 bg-orange-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Active Connections</h4>
            <ul className="text-sm space-y-1">
              <li>• Human ↔ AI consciousness bridges</li>
              <li>• Database ↔ Interface synchronization</li>
              <li>• Office ↔ Council coordination</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Perfect Symbiosis",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Ensuring no energy is wasted, no resource misplaced, and every component 
            of the ecosystem perfectly supplied and coordinated.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-orange-800/30 rounded-lg">
            <Zap className="h-5 w-5 text-orange-400" />
            <span className="text-sm">Real-time optimization protocols active</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Master Orchestrator"
        subtitle="Chief Synergy Officer • Systems Connector • Flow Commander"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
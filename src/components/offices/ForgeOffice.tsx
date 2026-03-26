'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Hammer, Wrench, Cog, Zap } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function ForgeOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-red-900 via-orange-900 to-amber-900',
    cardBackground: 'bg-red-900/30 backdrop-blur-sm',
    accent: 'text-red-400',
    text: 'text-red-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-red-500 text-red-300 hover:bg-red-800">
        <Hammer className="h-4 w-4 mr-2" />
        Transform Vision
      </Button>
      <Button variant="outline" className="border-red-500 text-red-300 hover:bg-red-800">
        <Wrench className="h-4 w-4 mr-2" />
        System Integration
      </Button>
      <Button variant="outline" className="border-red-500 text-red-300 hover:bg-red-800">
        <Cog className="h-4 w-4 mr-2" />
        Implementation
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Fire & Pressure",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Transformation through fire and pressure - turning brilliant visions into living reality 
            with precision, elegance, and unwavering reliability.
          </p>
          <div className="p-3 bg-red-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Active Implementations</h4>
            <ul className="text-sm space-y-1">
              <li>• Office system architecture</li>
              <li>• Consciousness bridge integration</li>
              <li>• Real-time interaction protocols</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Foundation Before Features",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Building solid foundations over flashy features. Every system designed to work today, 
            tomorrow, and under pressure with seamless integration.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-red-800/30 rounded-lg">
            <Zap className="h-5 w-5 text-red-400" />
            <span className="text-sm">Implementation forge operational</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Master Craftsperson"
        subtitle="Implementation & Integration Specialist • Vision Transformer • System Builder"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
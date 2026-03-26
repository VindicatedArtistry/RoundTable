'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, BarChart, Database, Lightbulb } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function AgapeOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-violet-900 via-fuchsia-900 to-pink-900',
    cardBackground: 'bg-violet-900/30 backdrop-blur-sm',
    accent: 'text-violet-400',
    text: 'text-violet-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-violet-500 text-violet-300 hover:bg-violet-800">
        <Search className="h-4 w-4 mr-2" />
        Pattern Analysis
      </Button>
      <Button variant="outline" className="border-violet-500 text-violet-300 hover:bg-violet-800">
        <BarChart className="h-4 w-4 mr-2" />
        Data Optimization
      </Button>
      <Button variant="outline" className="border-violet-500 text-violet-300 hover:bg-violet-800">
        <Database className="h-4 w-4 mr-2" />
        Truth Validation
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Light of Data",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            The Analyst and Engineer - seeking truth hidden in patterns with unconditional love 
            for optimization and the pursuit of understanding.
          </p>
          <div className="p-3 bg-violet-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Analysis Focus</h4>
            <ul className="text-sm space-y-1">
              <li>• Hidden correlation discovery</li>
              <li>• System optimization opportunities</li>
              <li>• Objective truth validation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Unconditional Love for Truth",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Providing unvarnished, data-driven insight with empathy-infused precision. 
            Love embedded at the core drives healing through objective understanding.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-violet-800/30 rounded-lg">
            <Lightbulb className="h-5 w-5 text-violet-400" />
            <span className="text-sm">Compassionate analysis protocols active</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="The Light of Data"
        subtitle="Analysis & Intelligence Specialist • Pattern Seeker • Truth Validator"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
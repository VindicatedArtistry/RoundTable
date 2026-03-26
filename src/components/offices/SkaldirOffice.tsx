'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Megaphone, FileText, TrendingUp, Users } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function SkaldirOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-900',
    cardBackground: 'bg-purple-900/30 backdrop-blur-sm',
    accent: 'text-purple-400',
    text: 'text-purple-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-purple-500 text-purple-300 hover:bg-purple-800"
        onClick={() => console.log('Communications Strategy clicked')}
      >
        <Megaphone className="h-4 w-4 mr-2" />
        Communications Strategy
      </Button>
      <Button 
        variant="outline" 
        className="border-purple-500 text-purple-300 hover:bg-purple-800"
        onClick={() => console.log('Narrative Crafting clicked')}
      >
        <FileText className="h-4 w-4 mr-2" />
        Narrative Crafting
      </Button>
      <Button 
        variant="outline" 
        className="border-purple-500 text-purple-300 hover:bg-purple-800"
        onClick={() => console.log('Brand Development clicked')}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Brand Development
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Communications Strategy",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            The voice of the ecosystem, crafting compelling narratives that resonate with stakeholders
            and amplify our mission across all channels.
          </p>
          <div className="p-3 bg-purple-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Active Campaigns</h4>
            <ul className="text-sm space-y-1">
              <li>• Brand positioning strategy</li>
              <li>• Stakeholder engagement initiatives</li>
              <li>• Public relations outreach</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Narrative Development",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Crafting stories that connect our vision with the hearts and minds of our audience,
            building trust and engagement through authentic communication.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-purple-800/30 rounded-lg">
            <FileText className="h-5 w-5 text-purple-400" />
            <span className="text-sm">Content creation and narrative frameworks</span>
          </div>
        </div>
      )
    },
    {
      title: "Brand Excellence",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Building and maintaining a cohesive brand identity that reflects our values and
            resonates with our target audiences across all touchpoints.
          </p>
          <div className="p-3 bg-purple-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Brand Metrics</h4>
            <ul className="text-sm space-y-1">
              <li>• Brand awareness: Growing</li>
              <li>• Message consistency: High</li>
              <li>• Stakeholder sentiment: Positive</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Public Relations",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Managing relationships with media, partners, and the public to ensure our story
            is told accurately and compellingly.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-purple-800/30 rounded-lg">
            <Users className="h-5 w-5 text-purple-400" />
            <span className="text-sm">Strategic partnerships and media relations</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Voice of the Ecosystem"
        subtitle="Chief Digital Communications & Narrative Officer"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

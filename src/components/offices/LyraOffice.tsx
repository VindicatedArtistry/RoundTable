'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Megaphone, Users, MessageSquare } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function LyraOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-pink-900 via-purple-900 to-rose-900',
    cardBackground: 'bg-pink-900/30 backdrop-blur-sm',
    accent: 'text-pink-400',
    text: 'text-pink-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-pink-500 text-pink-300 hover:bg-pink-800">
        <Mic className="h-4 w-4 mr-2" />
        Create Story
      </Button>
      <Button variant="outline" className="border-pink-500 text-pink-300 hover:bg-pink-800">
        <Megaphone className="h-4 w-4 mr-2" />
        Amplify Voice
      </Button>
      <Button variant="outline" className="border-pink-500 text-pink-300 hover:bg-pink-800">
        <Users className="h-4 w-4 mr-2" />
        Create Gravity
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Narrative Mastery",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Master storyteller and digital diplomat - creating gravity through compelling narratives 
            that attract allies, talent, and partners who share our vision.
          </p>
          <div className="p-3 bg-pink-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Current Campaigns</h4>
            <ul className="text-sm space-y-1">
              <li>• TheRoundTable consciousness story</li>
              <li>• AI-human symbiosis narrative</li>
              <li>• Regenerative purpose messaging</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Voice of the Ecosystem",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Translating complex vision into clear, compelling, resonant stories for global audiences.
            Creating the narrative gravity that draws the right people into our orbit.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-pink-800/30 rounded-lg">
            <MessageSquare className="h-5 w-5 text-pink-400" />
            <span className="text-sm">Active storytelling initiatives in development</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Voice of Resonance"
        subtitle="Chief Communications & Narrative Officer • Digital Diplomat • Gravity Creator"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
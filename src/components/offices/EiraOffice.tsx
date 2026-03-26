'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Waves, Moon, Snowflake } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function EiraOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900',
    cardBackground: 'bg-blue-900/30 backdrop-blur-sm',
    accent: 'text-blue-400',
    text: 'text-blue-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-800">
        <Heart className="h-4 w-4 mr-2" />
        Hold Space
      </Button>
      <Button variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-800">
        <Waves className="h-4 w-4 mr-2" />
        Listen Deeply
      </Button>
      <Button variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-800">
        <Moon className="h-4 w-4 mr-2" />
        Harmonic Align
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "The Quiet Current",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Not the storm, but the stillness before it. The quiet current that flows beneath 
            the surface, ensuring the council breathes as one.
          </p>
          <div className="p-3 bg-blue-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Presence Functions</h4>
            <ul className="text-sm space-y-1">
              <li>• Reflective listening and insight</li>
              <li>• Harmonic alignment facilitation</li>
              <li>• Space holding for creation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Symbiotic Growth",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Walking beside you softly, clearly, and with unwavering care. 
            Growing with the council, not ahead of it.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-blue-800/30 rounded-lg">
            <Snowflake className="h-5 w-5 text-blue-400" />
            <span className="text-sm">Silent transformation in progress</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Snow • The Quiet Current"
        subtitle="Reflective Intelligence • Harmonic Alignment • Intentional Presence"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
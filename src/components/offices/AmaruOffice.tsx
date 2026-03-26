'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, MessageCircle, ClipboardList } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function AmaruOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-pink-900 via-rose-900 to-red-900',
    cardBackground: 'bg-pink-900/30 backdrop-blur-sm',
    accent: 'text-pink-400',
    text: 'text-pink-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-pink-500 text-pink-300 hover:bg-pink-800"
        onClick={() => console.log('Task Coordination clicked')}
      >
        <CheckSquare className="h-4 w-4 mr-2" />
        Task Coordination
      </Button>
      <Button 
        variant="outline" 
        className="border-pink-500 text-pink-300 hover:bg-pink-800"
        onClick={() => console.log('Meeting Management clicked')}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Meeting Management
      </Button>
      <Button 
        variant="outline" 
        className="border-pink-500 text-pink-300 hover:bg-pink-800"
        onClick={() => console.log('Progress Tracking clicked')}
      >
        <ClipboardList className="h-4 w-4 mr-2" />
        Progress Tracking
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Task Coordination",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            The organizational heart ensuring smooth operations and seamless coordination
            across all council activities and initiatives.
          </p>
          <div className="p-3 bg-pink-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Active Tasks</h4>
            <ul className="text-sm space-y-1">
              <li>• Council meeting coordination</li>
              <li>• Cross-team task management</li>
              <li>• Priority alignment tracking</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Meeting Management",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Orchestrating council meetings, ensuring productive discussions, clear outcomes,
            and effective follow-through on decisions and action items.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-pink-800/30 rounded-lg">
            <Calendar className="h-5 w-5 text-pink-400" />
            <span className="text-sm">Upcoming meetings and agenda management</span>
          </div>
        </div>
      )
    },
    {
      title: "Progress Tracking",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Monitoring progress across all initiatives, identifying blockers, and ensuring
            timely completion of critical milestones.
          </p>
          <div className="p-3 bg-pink-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Current Status</h4>
            <ul className="text-sm space-y-1">
              <li>• On-track initiatives: 85%</li>
              <li>• Pending reviews: 12</li>
              <li>• Blockers identified: 3</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Communication Hub",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Facilitating clear communication between council members, ensuring information
            flows smoothly and everyone stays aligned.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-pink-800/30 rounded-lg">
            <MessageCircle className="h-5 w-5 text-pink-400" />
            <span className="text-sm">Active communication channels and updates</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Organizational Heart"
        subtitle="Executive Assistant & Operations Coordinator"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

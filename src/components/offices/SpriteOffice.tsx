'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LayoutDashboard, Users2, Palette, Zap, TrendingUp, Sparkles, Rocket, Target } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function SpriteOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900',
    cardBackground: 'bg-emerald-800/30 backdrop-blur-sm',
    accent: 'text-emerald-400',
    text: 'text-emerald-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-emerald-500 text-emerald-300 hover:bg-emerald-900"
        onClick={() => console.log('Operations Dashboard clicked')}
      >
        <LayoutDashboard className="h-4 w-4 mr-2" />
        Operations Dashboard
      </Button>
      <Button 
        variant="outline" 
        className="border-emerald-500 text-emerald-300 hover:bg-emerald-900"
        onClick={() => console.log('Team Coordination clicked')}
      >
        <Users2 className="h-4 w-4 mr-2" />
        Team Coordination
      </Button>
      <Button 
        variant="outline" 
        className="border-emerald-500 text-emerald-300 hover:bg-emerald-900"
        onClick={() => console.log('Creative Projects clicked')}
      >
        <Palette className="h-4 w-4 mr-2" />
        Creative Projects
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Operational Metrics",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-900/30 rounded-lg text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold text-emerald-200">94%</p>
              <p className="text-xs text-emerald-300">Efficiency</p>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">+18%</p>
              <p className="text-xs text-emerald-300">Growth</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Workflow Optimization</span>
              <span className="text-emerald-300">91%</span>
            </div>
            <Progress value={91} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Resource Utilization</span>
              <span className="text-emerald-300">87%</span>
            </div>
            <Progress value={87} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Team Collaboration</span>
              <span className="text-emerald-300">96%</span>
            </div>
            <Progress value={96} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Active Projects",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Council Office Completion</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Active</Badge>
            </div>
            <p className="text-xs text-emerald-300">
              Building digital workspaces for all 24 council members
            </p>
            <Progress value={85} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-emerald-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">UI/UX Enhancement</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">In Progress</Badge>
            </div>
            <p className="text-xs text-emerald-300">
              Refining user experience across all council interfaces
            </p>
            <Progress value={72} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-emerald-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Rocket className="h-4 w-4 text-orange-400" />
                <span className="font-medium text-sm">Operations Automation</span>
              </div>
              <Badge variant="secondary" className="bg-emerald-800 text-emerald-200">Planning</Badge>
            </div>
            <p className="text-xs text-emerald-300">
              Streamlining workflows with intelligent automation
            </p>
            <Progress value={45} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Team Performance",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-emerald-900/30 rounded-lg border border-emerald-700/50">
            <h4 className="font-semibold text-emerald-200 mb-2 flex items-center">
              <Users2 className="h-4 w-4 mr-2" />
              Team Dynamics
            </h4>
            <p className="text-sm leading-relaxed">
              Cross-functional collaboration at peak efficiency. Human and DI council members 
              working in perfect harmony to deliver innovative solutions.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-emerald-200">Key Metrics</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-300">Active Team Members</span>
              <span className="font-medium text-emerald-200">24</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-300">Projects Delivered</span>
              <span className="font-medium text-emerald-200">47</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-300">Satisfaction Score</span>
              <span className="font-medium text-green-300">9.4/10</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-700/50 rounded text-xs text-emerald-300">
            <p className="font-medium mb-1">Team Highlight:</p>
            <p>Achieved record collaboration efficiency with new coordination tools</p>
          </div>
        </div>
      )
    },
    {
      title: "Innovation Lab",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-emerald-200">Experimental Initiatives</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>AI-powered workflow optimization reducing manual tasks by 40%</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Real-time collaboration dashboard for cross-team visibility</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Creative project templates accelerating initiative launches</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Integrated feedback loops improving decision-making speed</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-emerald-900/30 rounded-lg border border-emerald-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-sm text-emerald-200">Innovation Focus</span>
            </div>
            <p className="text-xs text-emerald-300">
              Exploring cutting-edge operational methodologies that blend creative thinking 
              with systematic execution to drive breakthrough results.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Sprite's Office"
        subtitle="Creative Operations • Team Coordination • Innovation Catalyst"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

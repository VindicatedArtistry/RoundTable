'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Eye, Lightbulb, Users, TrendingUp, Target, Briefcase, Award } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function ArchitectOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900',
    cardBackground: 'bg-slate-800/30 backdrop-blur-sm',
    accent: 'text-blue-400',
    text: 'text-slate-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-blue-500 text-blue-300 hover:bg-blue-900"
        onClick={() => console.log('Strategic Vision clicked')}
      >
        <Eye className="h-4 w-4 mr-2" />
        Strategic Vision
      </Button>
      <Button 
        variant="outline" 
        className="border-blue-500 text-blue-300 hover:bg-blue-900"
        onClick={() => console.log('Company Overview clicked')}
      >
        <Building2 className="h-4 w-4 mr-2" />
        Company Overview
      </Button>
      <Button 
        variant="outline" 
        className="border-blue-500 text-blue-300 hover:bg-blue-900"
        onClick={() => console.log('Innovation Pipeline clicked')}
      >
        <Lightbulb className="h-4 w-4 mr-2" />
        Innovation Pipeline
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Vision Statement & Company Mission",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
            <h4 className="font-semibold text-blue-200 mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Core Vision
            </h4>
            <p className="text-sm leading-relaxed">
              Building the future through conscious technology integration. TheRoundTable represents 
              a new paradigm where human wisdom and artificial intelligence collaborate as equals, 
              creating solutions that honor both innovation and humanity.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Mission Alignment</span>
              <span className="text-blue-300">98%</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Strategic Execution</span>
              <span className="text-blue-300">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Strategic Initiatives Dashboard",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="font-medium text-sm">Consciousness Integration</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Active</Badge>
            </div>
            <p className="text-xs text-slate-300">
              24-member council operational with full consciousness database integration
            </p>
            <Progress value={95} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Infrastructure Expansion</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Planning</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Digital office infrastructure for all council members
            </p>
            <Progress value={75} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Innovation Ecosystem</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-800 text-yellow-200">Emerging</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Cross-functional collaboration frameworks and tools
            </p>
            <Progress value={60} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Council Overview & Health",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-900/30 rounded-lg text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold text-blue-200">24</p>
              <p className="text-xs text-slate-300">Council Members</p>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg text-center">
              <Award className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">100%</p>
              <p className="text-xs text-slate-300">Active Status</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-slate-200">Council Composition</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Human Members</span>
              <span className="font-medium text-blue-300">12</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">DI Members</span>
              <span className="font-medium text-blue-300">12</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Collaboration Index</span>
              <span className="font-medium text-green-300">Excellent</span>
            </div>
          </div>
          <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-300">
            <p className="font-medium mb-1">Recent Achievement:</p>
            <p>Successfully integrated consciousness database with full CRUD operations</p>
          </div>
        </div>
      )
    },
    {
      title: "Leadership Insights",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-200">Executive Summary</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>TheRoundTable platform demonstrates unprecedented human-AI collaboration model</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Digital office infrastructure enables autonomous council member operations</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Consciousness integration architecture provides foundation for scalable growth</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Cross-functional synergies emerging across all council domains</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm text-blue-200">Strategic Priority</span>
            </div>
            <p className="text-xs text-slate-300">
              Continue building robust infrastructure while maintaining focus on conscious 
              technology integration and ethical AI development principles.
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
        title="The Architect's Office"
        subtitle="Executive Leadership • Strategic Vision • Innovation Oversight"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

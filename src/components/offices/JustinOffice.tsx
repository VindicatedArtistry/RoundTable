'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardHat, ClipboardCheck, Ruler, Building2, Wrench, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function JustinOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-amber-900 via-stone-800 to-zinc-900',
    cardBackground: 'bg-amber-800/30 backdrop-blur-sm',
    accent: 'text-amber-400',
    text: 'text-amber-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-amber-500 text-amber-300 hover:bg-amber-900"
        onClick={() => console.log('Construction Status clicked')}
      >
        <Building2 className="h-4 w-4 mr-2" />
        Construction Status
      </Button>
      <Button 
        variant="outline" 
        className="border-zinc-500 text-zinc-300 hover:bg-zinc-800"
        onClick={() => console.log('Project Management clicked')}
      >
        <ClipboardCheck className="h-4 w-4 mr-2" />
        Project Management
      </Button>
      <Button 
        variant="outline" 
        className="border-amber-500 text-amber-300 hover:bg-amber-900"
        onClick={() => console.log('Quality Control clicked')}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Quality Control
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Vitruvian Industries Performance",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-amber-900/30 rounded-lg text-center">
              <Building2 className="h-5 w-5 mx-auto mb-1 text-amber-400" />
              <p className="text-2xl font-bold text-amber-200">24</p>
              <p className="text-xs text-amber-300">Active Projects</p>
            </div>
            <div className="p-3 bg-zinc-800/30 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">+18%</p>
              <p className="text-xs text-green-300">Efficiency Gain</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Project Completion Rate</span>
              <span className="text-amber-300">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Safety Compliance</span>
              <span className="text-green-300">98%</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Resource Utilization</span>
              <span className="text-amber-300">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Active Construction",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-amber-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardHat className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-sm">Downtown Infrastructure Hub</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">On Track</Badge>
            </div>
            <p className="text-xs text-amber-200">
              Multi-phase commercial and residential development
            </p>
            <Progress value={67} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-amber-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-sm">Sustainable Housing Complex</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">In Progress</Badge>
            </div>
            <p className="text-xs text-amber-200">
              Eco-friendly residential units with green technology
            </p>
            <Progress value={43} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-amber-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-sm">Industrial Park Expansion</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-800 text-yellow-200">Planning</Badge>
            </div>
            <p className="text-xs text-amber-200">
              Manufacturing facilities and logistics infrastructure
            </p>
            <Progress value={28} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Quality Metrics",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <h4 className="font-semibold text-zinc-200 mb-2 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Quality Standards
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-amber-200">Structural Integrity</span>
                <Badge variant="secondary" className="bg-green-800 text-green-200">Excellent</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-200">Material Quality</span>
                <Badge variant="secondary" className="bg-green-800 text-green-200">Certified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-200">Workmanship</span>
                <Badge variant="secondary" className="bg-blue-800 text-blue-200">High</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-200">Code Compliance</span>
                <Badge variant="secondary" className="bg-green-800 text-green-200">100%</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-amber-200">Inspection Results</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-300">Passed Inspections</span>
              <span className="font-medium text-green-300">247/252</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-300">Defect Rate</span>
              <span className="font-medium text-green-300">0.8%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Infrastructure Development",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-amber-200">Strategic Initiatives</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Smart building integration with IoT sensors and automation systems</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-zinc-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Sustainable construction practices reducing carbon footprint by 35%</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Advanced prefabrication techniques improving build efficiency</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-zinc-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Workforce development programs training next-gen construction professionals</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-amber-900/30 rounded-lg border border-amber-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Ruler className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-sm text-amber-200">Construction Philosophy</span>
            </div>
            <p className="text-xs text-amber-300">
              Building the future through precision engineering, sustainable practices, 
              and unwavering commitment to quality. Every structure we create stands as 
              a testament to craftsmanship, safety, and innovation in construction.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 bg-green-900/30 rounded text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-400" />
              <p className="text-lg font-bold text-green-200">Zero</p>
              <p className="text-xs text-green-300">Major Incidents</p>
            </div>
            <div className="p-2 bg-amber-900/30 rounded text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-400" />
              <p className="text-lg font-bold text-amber-200">3.2M</p>
              <p className="text-xs text-amber-300">Sq Ft Built</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Justin's Office"
        subtitle="Construction Excellence • Infrastructure Development • Quality Assurance"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, BarChart3, Sprout, TreePine, TrendingDown, Droplets, Wind, Recycle } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function HillaryOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-green-900 via-emerald-800 to-green-950',
    cardBackground: 'bg-green-800/30 backdrop-blur-sm',
    accent: 'text-green-400',
    text: 'text-green-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-green-500 text-green-300 hover:bg-green-900"
        onClick={() => console.log('Environmental Impact clicked')}
      >
        <Leaf className="h-4 w-4 mr-2" />
        Environmental Impact
      </Button>
      <Button 
        variant="outline" 
        className="border-green-500 text-green-300 hover:bg-green-900"
        onClick={() => console.log('Sustainability Dashboard clicked')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Sustainability Dashboard
      </Button>
      <Button 
        variant="outline" 
        className="border-green-500 text-green-300 hover:bg-green-900"
        onClick={() => console.log('Eco Initiatives clicked')}
      >
        <Sprout className="h-4 w-4 mr-2" />
        Eco Initiatives
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Environmental Metrics",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-900/30 rounded-lg text-center">
              <TreePine className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">2.4M</p>
              <p className="text-xs text-green-300">Trees Planted</p>
            </div>
            <div className="p-3 bg-emerald-900/30 rounded-lg text-center">
              <TrendingDown className="h-5 w-5 mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold text-blue-200">-32%</p>
              <p className="text-xs text-green-300">Carbon Reduction</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Ecosystem Health</span>
              <span className="text-green-300">88%</span>
            </div>
            <Progress value={88} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Biodiversity Index</span>
              <span className="text-green-300">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Renewable Energy Usage</span>
              <span className="text-green-300">76%</span>
            </div>
            <Progress value={76} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Sustainability Projects",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-green-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TreePine className="h-4 w-4 text-green-400" />
                <span className="font-medium text-sm">Urban Reforestation</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Active</Badge>
            </div>
            <p className="text-xs text-green-300">
              Planting native species in urban areas to restore natural habitats
            </p>
            <Progress value={78} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-green-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wind className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Clean Air Initiative</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">In Progress</Badge>
            </div>
            <p className="text-xs text-green-300">
              Reducing air pollution through green infrastructure and monitoring
            </p>
            <Progress value={65} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-green-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Recycle className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-sm">Circular Economy Program</span>
              </div>
              <Badge variant="secondary" className="bg-emerald-800 text-emerald-200">Planning</Badge>
            </div>
            <p className="text-xs text-green-300">
              Implementing waste reduction and resource recovery systems
            </p>
            <Progress value={42} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Carbon Footprint",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-green-900/30 rounded-lg border border-green-700/50">
            <h4 className="font-semibold text-green-200 mb-2 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Carbon Reduction Progress
            </h4>
            <p className="text-sm leading-relaxed">
              Achieved significant carbon footprint reduction through renewable energy adoption, 
              sustainable practices, and ecosystem restoration initiatives.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-green-200">Emissions Tracking</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-300">Current Emissions</span>
              <span className="font-medium text-green-200">1,240 tons CO₂</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-300">Target Reduction</span>
              <span className="font-medium text-green-200">50% by 2025</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-300">Carbon Offset</span>
              <span className="font-medium text-blue-300">3,800 tons</span>
            </div>
          </div>
          <div className="p-2 bg-green-700/50 rounded text-xs text-green-300">
            <p className="font-medium mb-1">Recent Achievement:</p>
            <p>Net negative carbon footprint achieved for Q4 2024</p>
          </div>
        </div>
      )
    },
    {
      title: "Ecological Restoration",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-green-200">Active Restoration Projects</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Wetland restoration improving water quality and biodiversity</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Native pollinator habitat creation supporting ecosystem health</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Soil regeneration programs enhancing agricultural sustainability</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Wildlife corridor development connecting fragmented habitats</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm text-green-200">Stewardship Focus</span>
            </div>
            <p className="text-xs text-green-300">
              Committed to regenerative practices that heal ecosystems, restore natural balance, 
              and create sustainable harmony between human activity and environmental health.
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
        title="Hillary's Office"
        subtitle="Environmental Stewardship • Sustainability Leadership • Ecological Restoration"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

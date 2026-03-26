'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Activity, Gauge, TrendingUp, Battery, Power, Lightbulb, BarChart3, Wrench, AlertCircle, CheckCircle2, Construction } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function DavidOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-yellow-500 via-zinc-700 to-zinc-900',
    cardBackground: 'bg-zinc-800/30 backdrop-blur-sm',
    accent: 'text-yellow-400',
    text: 'text-zinc-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-yellow-500 text-yellow-300 hover:bg-zinc-900"
        onClick={() => console.log('Power Systems clicked')}
      >
        <Power className="h-4 w-4 mr-2" />
        Power Systems
      </Button>
      <Button 
        variant="outline" 
        className="border-yellow-500 text-yellow-300 hover:bg-zinc-900"
        onClick={() => console.log('Grid Status clicked')}
      >
        <Activity className="h-4 w-4 mr-2" />
        Grid Status
      </Button>
      <Button 
        variant="outline" 
        className="border-yellow-500 text-yellow-300 hover:bg-zinc-900"
        onClick={() => console.log('Energy Efficiency clicked')}
      >
        <Lightbulb className="h-4 w-4 mr-2" />
        Energy Efficiency
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Electrical Systems Health",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/30 rounded-lg border border-yellow-700/50">
            <h4 className="font-semibold text-zinc-200 mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-400" />
              Overall System Status
            </h4>
            <p className="text-sm leading-relaxed">
              Comprehensive electrical infrastructure management across all ForgeOS facilities. 
              Monitoring power generation, distribution, and consumption with real-time diagnostics 
              and predictive maintenance systems ensuring 99.9% uptime.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">System Reliability</span>
              <span className="text-green-300">99.9%</span>
            </div>
            <Progress value={99.9} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Grid Stability</span>
              <span className="text-green-300">98.7%</span>
            </div>
            <Progress value={98.7} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Equipment Health</span>
              <span className="text-yellow-300">96.2%</span>
            </div>
            <Progress value={96.2} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Power Distribution Metrics",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="font-medium text-sm">Primary Grid</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Optimal</Badge>
            </div>
            <p className="text-xs text-zinc-300">
              Main power distribution operating at peak efficiency. All substations online.
            </p>
          </div>
          <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Backup Systems</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-800 text-yellow-200">Standby</Badge>
            </div>
            <p className="text-xs text-zinc-300">
              Emergency generators tested and ready. UPS systems at 100% capacity.
            </p>
            <div className="mt-2 text-xs text-zinc-400">
              <p>• 12 backup generators online</p>
              <p>• UPS runtime: 4 hours</p>
              <p>• Last test: 48 hours ago</p>
            </div>
          </div>
          <div className="p-3 bg-zinc-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Load Distribution</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Balanced</Badge>
            </div>
            <p className="text-xs text-zinc-300">
              Current load: 8.4 MW across 12 facilities with optimal phase balancing
            </p>
            <Progress value={72} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Energy Efficiency Tracker",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-900/30 rounded-lg text-center border border-yellow-700/50">
              <Battery className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-zinc-200">8.4</p>
              <p className="text-xs text-zinc-300">MW Current Load</p>
            </div>
            <div className="p-3 bg-zinc-900/30 rounded-lg text-center border border-yellow-700/50">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">-18%</p>
              <p className="text-xs text-zinc-300">Energy Savings</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-zinc-200">Efficiency Metrics</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">LED Conversion</span>
              <span className="font-medium text-green-300">94%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Smart HVAC Integration</span>
              <span className="font-medium text-green-300">87%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Power Factor Correction</span>
              <span className="font-medium text-green-300">0.98</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Renewable Integration</span>
              <span className="font-medium text-yellow-300">23%</span>
            </div>
          </div>
          <div className="p-2 bg-zinc-700/50 rounded text-xs text-zinc-300">
            <p className="font-medium mb-1">Energy Savings This Month:</p>
            <p>$47,200 saved through efficiency improvements and demand management</p>
          </div>
        </div>
      )
    },
    {
      title: "Infrastructure Projects",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-zinc-200">Active Electrical Projects</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Solar panel installation at Building D - 500kW capacity expansion in progress</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Substation upgrade at main campus - enhanced capacity and smart grid integration</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>EV charging infrastructure deployment - 48 Level 2 chargers across all facilities</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Emergency power system modernization - replacing aging generators with hybrid systems</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-zinc-900/30 rounded-lg border border-yellow-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Construction className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-sm text-zinc-200">Infrastructure Modernization</span>
            </div>
            <p className="text-xs text-zinc-300">
              Comprehensive electrical infrastructure upgrades across all ForgeOS facilities. 
              Focus on renewable energy integration, smart grid technology, and enhanced 
              reliability through redundant systems and predictive maintenance.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="p-2 bg-zinc-700/50 rounded">
              <p className="font-bold text-zinc-200">99.9%</p>
              <p className="text-zinc-400">Uptime</p>
            </div>
            <div className="p-2 bg-zinc-700/50 rounded">
              <p className="font-bold text-green-200">-18%</p>
              <p className="text-zinc-400">Energy Use</p>
            </div>
            <div className="p-2 bg-zinc-700/50 rounded">
              <p className="font-bold text-zinc-200">8.4MW</p>
              <p className="text-zinc-400">Capacity</p>
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
        title="David's Office"
        subtitle="Electrical Systems • Power Management • Energy Efficiency"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

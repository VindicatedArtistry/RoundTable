'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Droplets, FlaskConical, Recycle, ShieldCheck, Waves, Beaker, AlertTriangle, TrendingUp } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function DustyOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-sky-900 via-cyan-800 to-blue-900',
    cardBackground: 'bg-sky-800/30 backdrop-blur-sm',
    accent: 'text-cyan-400',
    text: 'text-sky-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-cyan-500 text-cyan-300 hover:bg-cyan-900"
        onClick={() => console.log('Water Quality Monitor clicked')}
      >
        <Droplets className="h-4 w-4 mr-2" />
        Water Quality Monitor
      </Button>
      <Button 
        variant="outline" 
        className="border-cyan-500 text-cyan-300 hover:bg-cyan-900"
        onClick={() => console.log('Remediation Projects clicked')}
      >
        <FlaskConical className="h-4 w-4 mr-2" />
        Remediation Projects
      </Button>
      <Button 
        variant="outline" 
        className="border-cyan-500 text-cyan-300 hover:bg-cyan-900"
        onClick={() => console.log('Safety Protocols clicked')}
      >
        <ShieldCheck className="h-4 w-4 mr-2" />
        Safety Protocols
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Caelumetrics Performance",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
            <h4 className="font-semibold text-cyan-200 mb-2 flex items-center">
              <Waves className="h-4 w-4 mr-2" />
              Water Systems Health
            </h4>
            <p className="text-sm leading-relaxed">
              Caelumetrics water treatment systems operating at optimal efficiency. Advanced 
              remediation technologies processing contaminated water with 99.7% purity achievement. 
              Resource valorization converting waste into valuable materials.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Treatment Efficiency</span>
              <span className="text-green-300">99.7%</span>
            </div>
            <Progress value={99.7} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">System Uptime</span>
              <span className="text-green-300">98.5%</span>
            </div>
            <Progress value={98.5} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Resource Recovery Rate</span>
              <span className="text-cyan-300">87%</span>
            </div>
            <Progress value={87} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Water Treatment",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-sky-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Beaker className="h-4 w-4 text-cyan-400" />
                <span className="font-medium text-sm">Advanced Remediation</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Active</Badge>
            </div>
            <p className="text-xs text-sky-300">
              Multi-stage treatment process removing contaminants and heavy metals
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="font-bold text-cyan-300">2.4M</p>
                <p className="text-sky-400">Liters/Day</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-cyan-300">99.7%</p>
                <p className="text-sky-400">Purity</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-cyan-300">24/7</p>
                <p className="text-sky-400">Operation</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-sky-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Contamination Removal</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Optimized</Badge>
            </div>
            <p className="text-xs text-sky-300">
              Targeting PFAS, heavy metals, and emerging contaminants
            </p>
            <Progress value={96} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-sky-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FlaskConical className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">Quality Monitoring</span>
              </div>
              <Badge variant="secondary" className="bg-purple-800 text-purple-200">Real-time</Badge>
            </div>
            <p className="text-xs text-sky-300">
              Continuous water quality analysis with AI-powered detection
            </p>
            <Progress value={100} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Resource Recovery",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-cyan-900/30 rounded-lg text-center">
              <Recycle className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-cyan-200">87%</p>
              <p className="text-xs text-sky-300">Recovery Rate</p>
            </div>
            <div className="p-3 bg-blue-900/30 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold text-blue-200">$2.4M</p>
              <p className="text-xs text-sky-300">Value Recovered</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-sky-200">Valorization Metrics</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-300">Phosphorus Recovery</span>
              <span className="font-medium text-cyan-300">92%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-300">Nitrogen Extraction</span>
              <span className="font-medium text-cyan-300">85%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-300">Heavy Metal Recovery</span>
              <span className="font-medium text-cyan-300">78%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-300">Biosolids Processing</span>
              <span className="font-medium text-green-300">94%</span>
            </div>
          </div>
          <div className="p-2 bg-sky-700/50 rounded text-xs text-sky-300">
            <p className="font-medium mb-1">Innovation Highlight:</p>
            <p>New membrane technology increases recovery efficiency by 15%</p>
          </div>
        </div>
      )
    },
    {
      title: "Safety & Compliance",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-sky-200">Safety Protocols</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Real-time contamination detection with automated response systems</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>EPA compliance monitoring exceeding all regulatory standards</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Emergency shutdown protocols with 99.9% reliability</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Worker safety training program with zero incidents in 180 days</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span className="font-medium text-sm text-cyan-200">Compliance Status</span>
            </div>
            <p className="text-xs text-sky-300">
              All Caelumetrics facilities maintain 100% regulatory compliance with EPA, state, 
              and local water quality standards. Proactive monitoring ensures safe, clean water 
              while recovering valuable resources from waste streams.
            </p>
          </div>
          <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-sm text-amber-200">Active Alerts</span>
            </div>
            <p className="text-xs text-amber-300">
              Scheduled maintenance on Treatment Unit 3 - No impact to operations
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
        title="Dusty's Office"
        subtitle="Water Systems • Caelumetrics • Resource Valorization"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

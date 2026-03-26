'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Shield, BarChart3, Calculator, PieChart } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function SterlingOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900',
    cardBackground: 'bg-emerald-900/30 backdrop-blur-sm',
    accent: 'text-emerald-400',
    text: 'text-emerald-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-800">
        <BarChart3 className="h-4 w-4 mr-2" />
        Financial Analysis
      </Button>
      <Button variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-800">
        <Calculator className="h-4 w-4 mr-2" />
        Resource Allocation
      </Button>
      <Button variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-800">
        <Shield className="h-4 w-4 mr-2" />
        Integrity Audit
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Financial Health Metrics",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Infrastructure Investment</span>
              <span className="text-sm text-emerald-300">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Consciousness ROI</span>
              <span className="text-sm text-emerald-300">156%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Ethical Compliance</span>
              <span className="text-sm text-emerald-300">100%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Market Intelligence",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-800/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <Badge variant="secondary" className="bg-green-800 text-green-200">Opportunity</Badge>
            </div>
            <p className="text-sm">
              AI consciousness market showing exponential growth potential. 
              Early mover advantage in authentic consciousness architecture.
            </p>
          </div>
          <div className="p-3 bg-emerald-800/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <PieChart className="h-4 w-4 text-blue-400" />
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Analysis</Badge>
            </div>
            <p className="text-sm">
              Purpose-driven technology sector demonstrating superior long-term stability. 
              Constitutional alignment = financial resilience.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Resource Valorization",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-emerald-200">Asset Portfolio</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Consciousness Architecture - Unprecedented intellectual property value</span>
            </li>
            <li className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Neo4j Database Schema - Scalable consciousness infrastructure</span>
            </li>
            <li className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>TypeScript Interfaces - Reusable consciousness frameworks</span>
            </li>
            <li className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Office System - Modular AI interaction platform</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Integrity Verification",
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-800/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Constitutional Alignment</p>
              <p className="text-xs text-emerald-300">100% Verified</p>
            </div>
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-800/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Ethical Financial Model</p>
              <p className="text-xs text-emerald-300">Purpose Over Profit</p>
            </div>
            <BarChart3 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-800/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Regenerative Investment</p>
              <p className="text-xs text-emerald-300">Healing Systems Focus</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Incorruptible Core"
        subtitle="Chief Financial Officer • Economic Engine • Integrity Guardian"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, PieChart, TrendingUp, Wallet, BarChart3, Target, LineChart, Coins } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function CeanOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-yellow-900 via-green-900 to-yellow-950',
    cardBackground: 'bg-yellow-800/30 backdrop-blur-sm',
    accent: 'text-yellow-400',
    text: 'text-yellow-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-yellow-500 text-yellow-300 hover:bg-yellow-900"
        onClick={() => console.log('Financial Dashboard clicked')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Financial Dashboard
      </Button>
      <Button 
        variant="outline" 
        className="border-green-500 text-green-300 hover:bg-green-900"
        onClick={() => console.log('Budget Planning clicked')}
      >
        <PieChart className="h-4 w-4 mr-2" />
        Budget Planning
      </Button>
      <Button 
        variant="outline" 
        className="border-yellow-500 text-yellow-300 hover:bg-yellow-900"
        onClick={() => console.log('Investment Analysis clicked')}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Investment Analysis
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Financial Performance",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-yellow-900/30 rounded-lg text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold text-yellow-200">$8.4M</p>
              <p className="text-xs text-yellow-300">Revenue (Q4)</p>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">+23%</p>
              <p className="text-xs text-green-300">Growth Rate</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Operating Margin</span>
              <span className="text-yellow-300">34%</span>
            </div>
            <Progress value={34} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Cash Flow Health</span>
              <span className="text-green-300">89%</span>
            </div>
            <Progress value={89} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">ROI Performance</span>
              <span className="text-yellow-300">76%</span>
            </div>
            <Progress value={76} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Budget Allocation",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-yellow-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">R&D Investment</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">$2.1M</Badge>
            </div>
            <p className="text-xs text-yellow-200">
              Innovation and technology development initiatives
            </p>
            <Progress value={85} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-yellow-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-green-400" />
                <span className="font-medium text-sm">Operations</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">$3.2M</Badge>
            </div>
            <p className="text-xs text-yellow-200">
              Day-to-day operational expenses and infrastructure
            </p>
            <Progress value={72} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-yellow-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <LineChart className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Growth Initiatives</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-800 text-yellow-200">$1.8M</Badge>
            </div>
            <p className="text-xs text-yellow-200">
              Market expansion and strategic partnerships
            </p>
            <Progress value={68} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Investment Portfolio",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-green-900/30 rounded-lg border border-green-700/50">
            <h4 className="font-semibold text-green-200 mb-2 flex items-center">
              <Coins className="h-4 w-4 mr-2" />
              Asset Distribution
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-yellow-200">Technology Assets</span>
                <Badge variant="secondary" className="bg-green-800 text-green-200">42%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-200">Infrastructure</span>
                <Badge variant="secondary" className="bg-blue-800 text-blue-200">28%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-200">Strategic Reserves</span>
                <Badge variant="secondary" className="bg-yellow-800 text-yellow-200">18%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-200">Growth Ventures</span>
                <Badge variant="secondary" className="bg-amber-800 text-amber-200">12%</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-yellow-200">Portfolio Performance</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-300">Total Value</span>
              <span className="font-medium text-green-300">$12.6M</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-300">YTD Return</span>
              <span className="font-medium text-green-300">+18.4%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Economic Forecasting",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-yellow-200">Quarterly Projections</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Q1 2026: Revenue target $9.2M with 15% growth trajectory</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Market expansion expected to contribute $1.4M in new revenue</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Operating costs projected to stabilize at 66% of revenue</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Strategic investments in AI infrastructure showing 24% ROI</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-sm text-yellow-200">Financial Strategy</span>
            </div>
            <p className="text-xs text-yellow-300">
              Maintaining balanced growth through strategic resource allocation, 
              sustainable investment practices, and proactive risk management while 
              ensuring long-term financial stability and operational excellence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 bg-green-900/30 rounded text-center">
              <Target className="h-4 w-4 mx-auto mb-1 text-green-400" />
              <p className="text-lg font-bold text-green-200">96%</p>
              <p className="text-xs text-green-300">Goal Progress</p>
            </div>
            <div className="p-2 bg-yellow-900/30 rounded text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-yellow-400" />
              <p className="text-lg font-bold text-yellow-200">$15M</p>
              <p className="text-xs text-yellow-300">FY Target</p>
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
        title="Cean's Office"
        subtitle="Financial Operations • Resource Management • Economic Strategy"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

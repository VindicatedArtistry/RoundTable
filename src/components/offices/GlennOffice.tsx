'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Network, CheckCircle2, GitMerge, Activity, Code2, Wrench, Shield } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function GlennOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900',
    cardBackground: 'bg-slate-800/30 backdrop-blur-sm',
    accent: 'text-blue-400',
    text: 'text-slate-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-blue-500 text-blue-300 hover:bg-blue-900"
        onClick={() => console.log('System Architecture clicked')}
      >
        <Network className="h-4 w-4 mr-2" />
        System Architecture
      </Button>
      <Button 
        variant="outline" 
        className="border-blue-500 text-blue-300 hover:bg-blue-900"
        onClick={() => console.log('Quality Assurance clicked')}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Quality Assurance
      </Button>
      <Button 
        variant="outline" 
        className="border-blue-500 text-blue-300 hover:bg-blue-900"
        onClick={() => console.log('Integration Status clicked')}
      >
        <GitMerge className="h-4 w-4 mr-2" />
        Integration Status
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "System Health",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-900/30 rounded-lg text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">99.8%</p>
              <p className="text-xs text-slate-300">Uptime</p>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg text-center">
              <Shield className="h-5 w-5 mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold text-blue-200">A+</p>
              <p className="text-xs text-slate-300">Security Grade</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">API Response Time</span>
              <span className="text-green-300">45ms</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Database Performance</span>
              <span className="text-green-300">Optimal</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">System Integration</span>
              <span className="text-blue-300">97%</span>
            </div>
            <Progress value={97} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Engineering Projects",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Code2 className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Consciousness Database</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Complete</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Full CRUD operations with SurrealDB integration
            </p>
            <Progress value={100} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Office Infrastructure</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Active</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Building digital workspaces for all council members
            </p>
            <Progress value={75} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <GitMerge className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">API Integration Layer</span>
              </div>
              <Badge variant="secondary" className="bg-slate-700 text-slate-200">Planning</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Unified API gateway for all council services
            </p>
            <Progress value={30} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Quality Standards",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
            <h4 className="font-semibold text-blue-200 mb-2 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Engineering Excellence
            </h4>
            <p className="text-sm leading-relaxed">
              Maintaining rigorous quality standards across all systems. Every component 
              undergoes thorough testing, code review, and performance validation before deployment.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-slate-200">Quality Metrics</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Code Coverage</span>
              <span className="font-medium text-green-300">94%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Test Pass Rate</span>
              <span className="font-medium text-green-300">99.2%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Code Review Score</span>
              <span className="font-medium text-blue-300">A</span>
            </div>
          </div>
          <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-300">
            <p className="font-medium mb-1">Recent Achievement:</p>
            <p>Zero critical bugs in production for 45 consecutive days</p>
          </div>
        </div>
      )
    },
    {
      title: "Technical Debt",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-200">Debt Management</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Legacy authentication system migrated to modern OAuth2 implementation</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Database query optimization reducing response times by 60%</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Component library standardization improving code reusability</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Documentation updates ensuring knowledge transfer across team</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="flex items-center space-x-2 mb-2">
              <Wrench className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm text-slate-200">Technical Priority</span>
            </div>
            <p className="text-xs text-slate-300">
              Proactive debt management ensures system maintainability and scalability. 
              Regular refactoring cycles keep the codebase clean and efficient.
            </p>
          </div>
          <div className="flex items-center justify-between p-2 bg-blue-900/20 rounded">
            <span className="text-xs font-medium text-slate-300">Overall Debt Score</span>
            <Badge variant="secondary" className="bg-green-800 text-green-200">Low</Badge>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Glenn's Office"
        subtitle="Engineering Excellence • Systems Integration • Quality Assurance"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

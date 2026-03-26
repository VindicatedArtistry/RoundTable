'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Cloud, Cpu, Globe, Server, Sparkles, Brain, Zap, TrendingUp } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function GodsonOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900',
    cardBackground: 'bg-violet-800/30 backdrop-blur-sm',
    accent: 'text-violet-400',
    text: 'text-violet-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-violet-500 text-violet-300 hover:bg-violet-900"
        onClick={() => console.log('Cloud Status clicked')}
      >
        <Cloud className="h-4 w-4 mr-2" />
        Cloud Status
      </Button>
      <Button 
        variant="outline" 
        className="border-violet-500 text-violet-300 hover:bg-violet-900"
        onClick={() => console.log('AI Deployment clicked')}
      >
        <Cpu className="h-4 w-4 mr-2" />
        AI Deployment
      </Button>
      <Button 
        variant="outline" 
        className="border-violet-500 text-violet-300 hover:bg-violet-900"
        onClick={() => console.log('Infrastructure Monitor clicked')}
      >
        <Server className="h-4 w-4 mr-2" />
        Infrastructure Monitor
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "EmberglowAI Performance",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-violet-900/30 rounded-lg border border-violet-700/50">
            <h4 className="font-semibold text-violet-200 mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Sovereign AI Platform
            </h4>
            <p className="text-sm leading-relaxed">
              EmberglowAI sovereign cloud infrastructure delivering secure, accessible AI services 
              globally. Advanced language models and AI capabilities running on distributed 
              infrastructure with 99.99% uptime and complete data sovereignty.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Platform Uptime</span>
              <span className="text-green-300">99.99%</span>
            </div>
            <Progress value={99.99} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">AI Response Time</span>
              <span className="text-green-300">98ms avg</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Global Accessibility</span>
              <span className="text-violet-300">147 regions</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Cloud Infrastructure",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-violet-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-violet-400" />
                <span className="font-medium text-sm">Distributed Cloud Network</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Optimal</Badge>
            </div>
            <p className="text-xs text-violet-300">
              Multi-region cloud infrastructure with automatic failover and load balancing
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="font-bold text-violet-300">147</p>
                <p className="text-violet-400">Regions</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-violet-300">2,400+</p>
                <p className="text-violet-400">Nodes</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-violet-300">99.99%</p>
                <p className="text-violet-400">Uptime</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-violet-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">Compute Resources</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Scaling</Badge>
            </div>
            <p className="text-xs text-violet-300">
              Auto-scaling infrastructure with 15 petaflops of AI compute capacity
            </p>
            <Progress value={78} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-violet-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Edge Computing</span>
              </div>
              <Badge variant="secondary" className="bg-purple-800 text-purple-200">Active</Badge>
            </div>
            <p className="text-xs text-violet-300">
              Low-latency edge nodes for real-time AI inference and processing
            </p>
            <Progress value={88} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "AI Model Deployments",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-violet-900/30 rounded-lg text-center">
              <Brain className="h-5 w-5 mx-auto mb-1 text-purple-400" />
              <p className="text-2xl font-bold text-violet-200">47</p>
              <p className="text-xs text-violet-300">Active Models</p>
            </div>
            <div className="p-3 bg-purple-900/30 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-violet-400" />
              <p className="text-2xl font-bold text-purple-200">2.8B</p>
              <p className="text-xs text-violet-300">Daily Requests</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-violet-200">Model Performance</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-violet-300">Language Models</span>
              <span className="font-medium text-violet-300">98.2%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-violet-300">Vision Models</span>
              <span className="font-medium text-violet-300">96.7%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-violet-300">Multimodal Models</span>
              <span className="font-medium text-violet-300">97.5%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-violet-300">Specialized AI</span>
              <span className="font-medium text-green-300">99.1%</span>
            </div>
          </div>
          <div className="p-2 bg-violet-700/50 rounded text-xs text-violet-300">
            <p className="font-medium mb-1">Latest Deployment:</p>
            <p>EmberglowAI v4.2 - Enhanced reasoning with 40% faster inference</p>
          </div>
        </div>
      )
    },
    {
      title: "Global Accessibility",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-violet-200">Accessibility Metrics</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>147 global regions with sub-100ms latency for 95% of users</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Multi-language support with 87 languages and counting</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Accessibility features including screen reader optimization and voice control</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Data sovereignty compliance across all jurisdictions</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-violet-900/30 rounded-lg border border-violet-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="h-4 w-4 text-green-400" />
              <span className="font-medium text-sm text-violet-200">Global Reach</span>
            </div>
            <p className="text-xs text-violet-300">
              EmberglowAI serves users across 147 regions with complete data sovereignty, 
              ensuring AI capabilities are accessible to everyone while maintaining privacy 
              and security. Our distributed infrastructure guarantees low latency and high 
              availability worldwide.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="p-2 bg-violet-700/50 rounded">
              <p className="font-bold text-violet-200">98ms</p>
              <p className="text-violet-400">Avg Latency</p>
            </div>
            <div className="p-2 bg-violet-700/50 rounded">
              <p className="font-bold text-violet-200">99.99%</p>
              <p className="text-violet-400">Availability</p>
            </div>
            <div className="p-2 bg-violet-700/50 rounded">
              <p className="font-bold text-violet-200">100%</p>
              <p className="text-violet-400">Sovereignty</p>
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
        title="Godson's Office"
        subtitle="Cloud Infrastructure • EmberglowAI • Sovereign AI Platform"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Network, Activity, Map, Wifi, Server, Zap, Globe, Radio } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function SpencerOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900',
    cardBackground: 'bg-teal-800/30 backdrop-blur-sm',
    accent: 'text-cyan-400',
    text: 'text-teal-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-cyan-500 text-cyan-300 hover:bg-cyan-900"
        onClick={() => console.log('Network Status clicked')}
      >
        <Activity className="h-4 w-4 mr-2" />
        Network Status
      </Button>
      <Button 
        variant="outline" 
        className="border-cyan-500 text-cyan-300 hover:bg-cyan-900"
        onClick={() => console.log('Infrastructure Monitor clicked')}
      >
        <Server className="h-4 w-4 mr-2" />
        Infrastructure Monitor
      </Button>
      <Button 
        variant="outline" 
        className="border-cyan-500 text-cyan-300 hover:bg-cyan-900"
        onClick={() => console.log('Connectivity Map clicked')}
      >
        <Map className="h-4 w-4 mr-2" />
        Connectivity Map
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Aura Networks Performance",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
            <h4 className="font-semibold text-cyan-200 mb-2 flex items-center">
              <Network className="h-4 w-4 mr-2" />
              Network Health
            </h4>
            <p className="text-sm leading-relaxed">
              Aura Networks infrastructure operating at peak efficiency. All nodes synchronized 
              with zero packet loss. Quantum-encrypted channels maintaining secure communications 
              across all council operations.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Network Uptime</span>
              <span className="text-green-300">99.98%</span>
            </div>
            <Progress value={99.98} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Bandwidth Utilization</span>
              <span className="text-cyan-300">67%</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Security Score</span>
              <span className="text-green-300">98%</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Network Topology",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-teal-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span className="font-medium text-sm">Global Backbone</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Optimal</Badge>
            </div>
            <p className="text-xs text-teal-300">
              12 primary nodes across 6 continents with redundant failover paths
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="font-bold text-cyan-300">24ms</p>
                <p className="text-teal-400">Avg Latency</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-cyan-300">10Tbps</p>
                <p className="text-teal-400">Capacity</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-cyan-300">99.9%</p>
                <p className="text-teal-400">Reliability</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-teal-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Edge Network</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Active</Badge>
            </div>
            <p className="text-xs text-teal-300">
              148 edge nodes providing low-latency access to council services
            </p>
            <Progress value={92} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-teal-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">Mesh Network</span>
              </div>
              <Badge variant="secondary" className="bg-purple-800 text-purple-200">Expanding</Badge>
            </div>
            <p className="text-xs text-teal-300">
              Self-healing mesh topology for resilient local connectivity
            </p>
            <Progress value={78} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Connectivity Metrics",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-cyan-900/30 rounded-lg text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold text-cyan-200">2.4ms</p>
              <p className="text-xs text-teal-300">Response Time</p>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">847K</p>
              <p className="text-xs text-teal-300">Active Connections</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-teal-200">Performance Metrics</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-teal-300">Throughput</span>
              <span className="font-medium text-cyan-300">8.2 Gbps</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-teal-300">Packet Loss</span>
              <span className="font-medium text-green-300">0.001%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-teal-300">Jitter</span>
              <span className="font-medium text-cyan-300">0.8ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-teal-300">Error Rate</span>
              <span className="font-medium text-green-300">0.0002%</span>
            </div>
          </div>
          <div className="p-2 bg-teal-700/50 rounded text-xs text-teal-300">
            <p className="font-medium mb-1">Network Status:</p>
            <p>All systems operational. Zero critical incidents in last 30 days.</p>
          </div>
        </div>
      )
    },
    {
      title: "Infrastructure Projects",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-teal-200">Active Initiatives</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Quantum encryption rollout across all council communication channels</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Edge network expansion to support 200+ nodes by Q2</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>AI-powered network optimization for predictive load balancing</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Zero-trust architecture implementation for enhanced security</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Server className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-sm text-cyan-200">Infrastructure Priority</span>
            </div>
            <p className="text-xs text-teal-300">
              Maintaining 99.99% uptime while scaling network capacity to support growing 
              council operations and emerging AI workloads across all domains.
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
        title="Spencer's Office"
        subtitle="Network Infrastructure • Aura Networks • Connectivity Excellence"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

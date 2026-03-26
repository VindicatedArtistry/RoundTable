'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, Lock, Eye, Activity, ShieldAlert, ShieldCheck, TrendingDown, Camera, Building2, Users, KeyRound } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function LukeOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-slate-900 via-gray-800 to-zinc-900',
    cardBackground: 'bg-slate-800/30 backdrop-blur-sm',
    accent: 'text-slate-400',
    text: 'text-slate-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-slate-500 text-slate-300 hover:bg-slate-900"
        onClick={() => console.log('Security Status clicked')}
      >
        <Shield className="h-4 w-4 mr-2" />
        Security Status
      </Button>
      <Button 
        variant="outline" 
        className="border-red-500 text-red-300 hover:bg-slate-900"
        onClick={() => console.log('Threat Monitor clicked')}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Threat Monitor
      </Button>
      <Button 
        variant="outline" 
        className="border-slate-500 text-slate-300 hover:bg-slate-900"
        onClick={() => console.log('Incident Response clicked')}
      >
        <ShieldAlert className="h-4 w-4 mr-2" />
        Incident Response
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Security Posture Dashboard",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-green-400" />
              Overall Facility Security
            </h4>
            <p className="text-sm leading-relaxed">
              Comprehensive physical security operations protecting all ForgeOS facilities, 
              personnel, and physical assets. Multi-layered defense strategy with 24/7 surveillance, 
              access control systems, and rapid response security teams across all locations.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Facility Security Score</span>
              <span className="text-green-300">96/100</span>
            </div>
            <Progress value={96} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Access Control Compliance</span>
              <span className="text-green-300">99.8%</span>
            </div>
            <Progress value={99.8} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Response Time</span>
              <span className="text-slate-300">&lt;90 sec avg</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Active Threats & Alerts",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span className="font-medium text-sm">Facility Status</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">All Clear</Badge>
            </div>
            <p className="text-xs text-slate-300">
              All facilities secure. No unauthorized access attempts. Perimeter systems nominal.
            </p>
          </div>
          <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-sm">Medium Priority Alerts</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-800 text-yellow-200">2 Active</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Badge access anomalies at Building C - security team investigating
            </p>
            <div className="mt-2 text-xs text-slate-400">
              <p>• Security personnel dispatched</p>
              <p>• Surveillance review in progress</p>
              <p>• Access logs being audited</p>
            </div>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Surveillance Systems</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Online</Badge>
            </div>
            <p className="text-xs text-slate-300">
              847 cameras active across all facilities with AI-powered motion detection
            </p>
            <Progress value={100} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Asset Protection Status",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/30 rounded-lg text-center border border-slate-700/50">
              <Building2 className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-slate-200">12</p>
              <p className="text-xs text-slate-300">Secured Facilities</p>
            </div>
            <div className="p-3 bg-slate-900/30 rounded-lg text-center border border-slate-700/50">
              <TrendingDown className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-200">-92%</p>
              <p className="text-xs text-slate-300">Incidents (YoY)</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-slate-200">Protection Coverage</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Perimeter Security</span>
              <span className="font-medium text-green-300">100%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Access Control Points</span>
              <span className="font-medium text-green-300">100%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Surveillance Coverage</span>
              <span className="font-medium text-green-300">98.7%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Security Personnel</span>
              <span className="font-medium text-green-300">99.5%</span>
            </div>
          </div>
          <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-300">
            <p className="font-medium mb-1">Latest Security Update:</p>
            <p>Biometric access control upgraded at all main entrances - Building A-F complete</p>
          </div>
        </div>
      )
    },
    {
      title: "Security Protocols",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-200">Active Security Measures</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Multi-factor biometric access control at all entry points with real-time verification</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>847 AI-powered surveillance cameras with motion detection and facial recognition</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>24/7 security personnel with rapid response teams at all major facilities</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Perimeter intrusion detection with automated alert systems and drone surveillance</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-red-400" />
              <span className="font-medium text-sm text-slate-200">Security Operations Center</span>
            </div>
            <p className="text-xs text-slate-300">
              24/7 physical security operations monitoring all ForgeOS facilities with real-time 
              surveillance, access control management, and rapid response security teams. 
              Multi-layered defense protecting personnel, facilities, and physical assets.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="p-2 bg-slate-700/50 rounded">
              <p className="font-bold text-slate-200">24/7</p>
              <p className="text-slate-400">Monitoring</p>
            </div>
            <div className="p-2 bg-slate-700/50 rounded">
              <p className="font-bold text-green-200">847</p>
              <p className="text-slate-400">Cameras</p>
            </div>
            <div className="p-2 bg-slate-700/50 rounded">
              <p className="font-bold text-slate-200">&lt;90s</p>
              <p className="text-slate-400">Response</p>
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
        title="Luke's Office"
        subtitle="Physical Security • Facility Protection • Access Control"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

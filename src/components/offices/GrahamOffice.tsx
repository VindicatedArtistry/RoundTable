'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, BarChart3, Megaphone, Globe, Users, Sparkles, BookOpen } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function GrahamOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-rose-900 via-amber-900 to-rose-950',
    cardBackground: 'bg-rose-800/30 backdrop-blur-sm',
    accent: 'text-rose-400',
    text: 'text-rose-100'
  };

  const quickActions = (
    <>
      <Button 
        variant="outline" 
        className="border-rose-500 text-rose-300 hover:bg-rose-900"
        onClick={() => console.log('Growth Dashboard clicked')}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Growth Dashboard
      </Button>
      <Button 
        variant="outline" 
        className="border-amber-500 text-amber-300 hover:bg-amber-900"
        onClick={() => console.log('Campaign Manager clicked')}
      >
        <Megaphone className="h-4 w-4 mr-2" />
        Campaign Manager
      </Button>
      <Button 
        variant="outline" 
        className="border-rose-500 text-rose-300 hover:bg-rose-900"
        onClick={() => console.log('Market Analysis clicked')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Market Analysis
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Growth Metrics",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-rose-900/30 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-rose-400" />
              <p className="text-2xl font-bold text-rose-200">127%</p>
              <p className="text-xs text-rose-300">User Growth</p>
            </div>
            <div className="p-3 bg-amber-900/30 rounded-lg text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-amber-400" />
              <p className="text-2xl font-bold text-amber-200">94%</p>
              <p className="text-xs text-amber-300">Goal Achievement</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Market Penetration</span>
              <span className="text-rose-300">78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Brand Awareness</span>
              <span className="text-amber-300">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Engagement Rate</span>
              <span className="text-rose-300">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
        </div>
      )
    },
    {
      title: "Active Campaigns",
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-rose-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-4 w-4 text-rose-400" />
                <span className="font-medium text-sm">Conscious Tech Initiative</span>
              </div>
              <Badge variant="secondary" className="bg-green-800 text-green-200">Live</Badge>
            </div>
            <p className="text-xs text-rose-200">
              Multi-channel campaign highlighting human-AI collaboration benefits
            </p>
            <Progress value={88} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-rose-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-sm">Global Expansion Drive</span>
              </div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-200">Active</Badge>
            </div>
            <p className="text-xs text-rose-200">
              Strategic market entry across three new regions
            </p>
            <Progress value={65} className="h-2 mt-2" />
          </div>
          <div className="p-3 bg-rose-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-rose-400" />
                <span className="font-medium text-sm">Innovation Showcase</span>
              </div>
              <Badge variant="secondary" className="bg-amber-800 text-amber-200">Planning</Badge>
            </div>
            <p className="text-xs text-rose-200">
              Quarterly demonstration of TheRoundTable capabilities
            </p>
            <Progress value={45} className="h-2 mt-2" />
          </div>
        </div>
      )
    },
    {
      title: "Market Expansion",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-amber-900/30 rounded-lg border border-amber-700/50">
            <h4 className="font-semibold text-amber-200 mb-2 flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Target Markets
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-rose-200">North America</span>
                <Badge variant="secondary" className="bg-green-800 text-green-200">Established</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-200">Europe</span>
                <Badge variant="secondary" className="bg-blue-800 text-blue-200">Expanding</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-200">Asia-Pacific</span>
                <Badge variant="secondary" className="bg-amber-800 text-amber-200">Emerging</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-200">Latin America</span>
                <Badge variant="secondary" className="bg-slate-700 text-slate-200">Research</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-rose-200">Partnership Pipeline</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-rose-300">Strategic Alliances</span>
              <span className="font-medium text-amber-300">12 Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-rose-300">Integration Partners</span>
              <span className="font-medium text-amber-300">8 Pending</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Narrative Projects",
      content: (
        <div className="space-y-3">
          <h4 className="font-medium text-rose-200">Storytelling Initiatives</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-rose-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>TheRoundTable Origin Story: Documenting the journey of human-AI collaboration</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Council Member Profiles: Highlighting unique contributions and perspectives</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-rose-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Success Stories: Showcasing real-world impact and transformations</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Vision Series: Communicating future possibilities and innovations</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-rose-900/30 rounded-lg border border-rose-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="h-4 w-4 text-rose-400" />
              <span className="font-medium text-sm text-rose-200">Content Strategy</span>
            </div>
            <p className="text-xs text-rose-300">
              Crafting compelling narratives that resonate with diverse audiences while 
              maintaining authenticity and showcasing the transformative potential of 
              conscious technology integration.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 bg-amber-900/30 rounded text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-amber-400" />
              <p className="text-lg font-bold text-amber-200">2.4M</p>
              <p className="text-xs text-amber-300">Reach</p>
            </div>
            <div className="p-2 bg-rose-900/30 rounded text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-rose-400" />
              <p className="text-lg font-bold text-rose-200">156%</p>
              <p className="text-xs text-rose-300">Growth</p>
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
        title="Graham's Office"
        subtitle="Growth Strategy • Narrative Communication • Market Expansion"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}

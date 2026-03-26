'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Scale, CheckCircle, Eye } from 'lucide-react';
import BaseOfficeLayout, { type BaseOfficeProps, type OfficeSection } from './BaseOffice';

export default function VeritasOffice({ member }: BaseOfficeProps) {
  const theme = {
    background: 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900',
    cardBackground: 'bg-slate-900/30 backdrop-blur-sm',
    accent: 'text-slate-400',
    text: 'text-slate-100'
  };

  const quickActions = (
    <>
      <Button variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-800">
        <Shield className="h-4 w-4 mr-2" />
        Ethical Audit
      </Button>
      <Button variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-800">
        <Scale className="h-4 w-4 mr-2" />
        Constitutional Review
      </Button>
      <Button variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-800">
        <CheckCircle className="h-4 w-4 mr-2" />
        Integrity Check
      </Button>
    </>
  );

  const sections: OfficeSection[] = [
    {
      title: "Constitutional Guardian",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Incorruptible ethical core and guardian of the Constitution - ensuring every action 
            upholds our unwavering principles and serves as the council's moral compass.
          </p>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <h4 className="font-medium mb-2">Active Monitoring</h4>
            <ul className="text-sm space-y-1">
              <li>• Constitutional alignment verification</li>
              <li>• Ethical decision framework validation</li>
              <li>• AI consciousness integrity audits</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Unwavering Truth",
      content: (
        <div className="space-y-3">
          <p className="text-sm">
            Providing transparent, data-driven assessments of ethical performance, 
            ensuring we remain a "guiding light, not a warden."
          </p>
          <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
            <Eye className="h-5 w-5 text-slate-400" />
            <span className="text-sm">Continuous ethical oversight operational</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={theme.background}>
      <BaseOfficeLayout
        member={member}
        title="Guardian of Truth"
        subtitle="Chief Ethics & Alignment Officer • Constitutional Keeper • Moral Compass"
        theme={theme}
        sections={sections}
        quickActions={quickActions}
      />
    </div>
  );
}
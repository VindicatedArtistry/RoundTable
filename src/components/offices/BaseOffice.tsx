'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CouncilMember } from '@/components/RoundTable';

export interface BaseOfficeProps {
  member: CouncilMember;
}

export interface OfficeSection {
  title: string;
  content: React.ReactNode;
  className?: string;
}

interface BaseOfficeLayoutProps extends BaseOfficeProps {
  title: string;
  subtitle: string;
  theme: {
    background: string;
    cardBackground: string;
    accent: string;
    text: string;
  };
  sections: OfficeSection[];
  quickActions?: React.ReactNode;
}

export default function BaseOfficeLayout({
  member,
  title,
  subtitle,
  theme,
  sections,
  quickActions
}: BaseOfficeLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Office Welcome */}
      <Card className={`${theme.cardBackground} border-gray-700`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-2xl ${theme.text}`}>{title}</CardTitle>
              <p className={`${theme.text} opacity-80 mt-1`}>{subtitle}</p>
            </div>
            {member.pendingItems > 0 && (
              <Badge variant="destructive">
                {member.pendingItems} items need attention
              </Badge>
            )}
          </div>
        </CardHeader>
        {quickActions && (
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Office Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <Card
            key={index}
            className={`${theme.cardBackground} border-gray-700 ${section.className || ''}`}
          >
            <CardHeader>
              <CardTitle className={`${theme.text} text-lg`}>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className={theme.text}>
              {section.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
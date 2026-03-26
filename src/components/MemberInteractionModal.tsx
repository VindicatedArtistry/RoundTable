'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SimpleModal from '@/components/SimpleModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Home, Crown, User } from 'lucide-react';
import type { CouncilMember } from '@/components/RoundTable';

interface MemberInteractionModalProps {
  member: CouncilMember | null;
  isOpen: boolean;
  onClose: () => void;
}

// Status indicator color mapping
const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500', 
  busy: 'bg-red-500',
  offline: 'bg-gray-400'
} as const;

export default function MemberInteractionModal({
  member,
  isOpen,
  onClose
}: MemberInteractionModalProps) {
  const router = useRouter();

  if (!member) return null;

  const handleClose = () => {
    console.log('Modal close triggered!');
    onClose();
  };

  const handlePrivateMessage = () => {
    console.log('Private message button clicked!', member.name);
    // TODO: Implement private messaging
    onClose();
    // For now, show alert - will implement actual messaging later
    alert(`Private messaging with ${member.name} coming soon!`);
  };

  const handleGoToOffice = () => {
    console.log('Go to office button clicked!', member.name);
    onClose();
    // Route to the member's office
    router.push(`/office/${member.id}`);
  };

  const formatLastActivity = (lastActivity: string) => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={handleClose}>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
            {member.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{member.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">{member.role}</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[member.status]}`} />
            <span className="text-sm capitalize">{member.status}</span>
            <span className="text-xs text-muted-foreground">
              • Last active {formatLastActivity(member.lastActivity)}
            </span>
          </div>
        </div>
      </div>

        <div className="space-y-4 mt-6">
          {member.pendingItems > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {member.pendingItems} pending items
                </Badge>
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Awaiting your attention
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrivateMessage();
              }}
              className="w-full h-12 flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              type="button"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Private Message</span>
            </Button>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleGoToOffice();
              }}
              className="w-full h-12 flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
              type="button"
            >
              <Home className="h-5 w-5" />
              <span>Go To Office</span>
            </Button>

            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              variant="outline"
              className="w-full"
              size="lg"
              type="button"
            >
              Cancel
            </Button>
          </div>

          {member.isUser && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Family Member
                </span>
              </div>
            </div>
          )}
      </div>
    </SimpleModal>
  );
}
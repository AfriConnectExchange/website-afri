'use client';
import { CheckCircle2, Circle, Gift, Zap } from 'lucide-react';
import { Card3D } from '../ui/card-3d';
import { Button3D } from '../ui/button-3d';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import type { AppUser } from '@/lib/types';

interface ProfileCompletionCardProps {
  user: AppUser;
  onNavigate: (page: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function ProfileCompletionCard({ user, onNavigate }: ProfileCompletionCardProps) {
  const checklist: ChecklistItem[] = [
    {
      id: 'email',
      label: 'Verify Email Address',
      completed: !!user.email_verified,
    },
    {
      id: 'phone',
      label: 'Add Phone Number',
      completed: !!user.phone,
    },
    {
      id: 'address',
      label: 'Add Shipping Address',
      completed: !!(user as any).address,
    },
    {
      id: 'avatar',
      label: 'Upload Profile Picture',
      completed: !!(user.avatarUrl || user.profile_picture_url),
    },
    {
      id: 'kyc',
      label: 'Complete Identity Verification',
      completed: user.verification_status === 'verified',
      action: () => onNavigate('/kyc'),
      actionLabel: 'Start KYC',
    },
  ];

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  // Determine badge based on completion
  const getBadge = () => {
    if (completionPercentage === 100) {
      return { label: 'Profile Master', color: 'bg-yellow-500', icon: Gift };
    } else if (completionPercentage >= 80) {
      return { label: 'Almost There!', color: 'bg-blue-500', icon: Zap };
    } else if (completionPercentage >= 50) {
      return { label: 'Getting Started', color: 'bg-green-500', icon: Zap };
    }
    return { label: 'New Member', color: 'bg-gray-500', icon: Zap };
  };

  const badge = getBadge();
  const BadgeIcon = badge.icon;

  // Show card only if not 100% complete
  if (completionPercentage === 100) {
    return (
      <Card3D className="p-4 mb-6 border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500 rounded-xl">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900">🎉 Profile Complete!</h3>
            <p className="text-xs text-gray-600">You've unlocked all features</p>
          </div>
          <Badge className="bg-yellow-500 text-white">Master</Badge>
        </div>
      </Card3D>
    );
  }

  return (
    <Card3D className="p-5 mb-6 border-0 bg-gradient-to-br from-white to-gray-50/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', badge.color)}>
            <BadgeIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Profile Completion</h3>
            <p className="text-xs text-gray-600">{completedCount} of {totalCount} completed</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {completionPercentage}%
        </Badge>
      </div>

      <Progress value={completionPercentage} className="h-2 mb-4" />

      <div className="space-y-2.5">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center justify-between p-2.5 rounded-xl transition-colors',
              item.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
            )}
          >
            <div className="flex items-center gap-2 flex-1">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <span className={cn(
                'text-xs font-medium',
                item.completed ? 'text-green-700 line-through' : 'text-gray-700'
              )}>
                {item.label}
              </span>
            </div>
            {!item.completed && item.action && (
              <Button3D
                size="sm"
                onClick={item.action}
                variant="outline"
                className="h-7 text-xs px-3"
              >
                {item.actionLabel}
              </Button3D>
            )}
          </div>
        ))}
      </div>

      {completionPercentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-700">
            💡 <span className="font-semibold">Tip:</span> Complete your profile to unlock full marketplace features and build trust with buyers!
          </p>
        </div>
      )}
    </Card3D>
  );
}

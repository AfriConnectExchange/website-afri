'use client';
import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AppUser } from '@/lib/types';

interface Props {
  user: AppUser;
  onNavigate: (path: string) => void;
}

export const ProfileCompletionMinimal: React.FC<Props> = ({ user, onNavigate }) => {
  const checklist = [
    { id: 'email', label: 'Verify Email', completed: !!user.email_verified, path: '/profile' },
    { id: 'phone', label: 'Add Phone', completed: !!user.phone, path: '/profile' },
    { id: 'address', label: 'Add Address', completed: !!(user as any).address, path: '/profile' },
    { id: 'avatar', label: 'Upload Photo', completed: !!(user.avatarUrl || user.profile_picture_url), path: '/profile' },
    { id: 'kyc', label: 'Complete Identity Verification', completed: user.verification_status === 'verified', path: '/kyc' },
  ];

  const completedCount = checklist.filter(i => i.completed).length;
  const totalCount = checklist.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="p-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="px-3 py-2 text-sm">
            Profile: <span className="ml-2 font-semibold">{percent}%</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Profile Completion</div>
              <div className="text-xs text-muted-foreground">{completedCount}/{totalCount}</div>
            </div>
            <Progress value={percent} className="h-2 mt-2" />
          </div>

          <div className="space-y-2 text-sm">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <div className={cn(item.completed ? 'text-gray-500 line-through' : 'text-gray-800')}>{item.label}</div>
                </div>
                {!item.completed && (
                  <Button size="sm" variant="outline" onClick={() => onNavigate(item.path)}>
                    Update
                  </Button>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProfileCompletionMinimal;

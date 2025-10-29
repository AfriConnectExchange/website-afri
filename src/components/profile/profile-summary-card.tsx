
'use client';

import { Mail, Phone, MapPin, User, Settings, Receipt, LogOut, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import VerifyEmailModal from './VerifyEmailModal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import type { AppUser } from '@/lib/types';

interface ProfileSummaryCardProps {
  user: AppUser;
  onNavigate: (page: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const getRoleColor = (role?: string) => {
  switch (role) {
    case 'seller': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'sme': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'trainer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case 'seller': return 'Seller';
    case 'sme': return 'SME Business';
    case 'trainer': return 'Trainer/Educator';
    default: return 'Buyer';
  }
};

export function ProfileSummaryCard({ user, onNavigate, activeTab, setActiveTab }: ProfileSummaryCardProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  
  const handleSignOut = async () => {
    await logout();
    setShowLogoutConfirm(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const userName = user.fullName || user.email || 'Unnamed User';
  
  const menuItems = [
    { id: 'profile', label: 'My Account', icon: User },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
  ];

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary/20 p-1">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={userName ?? undefined} />
              <AvatarFallback className="text-2xl bg-muted">
                {userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg mb-1">{userName}</h3>
            <Badge className={cn('mb-3', getRoleColor(user.roles?.[0]))}>
              {getRoleLabel(user.roles?.[0])}
            </Badge>
            <div className="text-sm text-muted-foreground space-y-1 my-4">
              {user.email && (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                  {!user.email_verified && (
                    <Button size="sm" variant="outline" className="ml-2 h-7" onClick={() => setShowVerifyEmail(true)}>
                      Verify
                    </Button>
                  )}
                </div>
              )}
            </div>

            <VerifyEmailModal open={showVerifyEmail} onOpenChange={setShowVerifyEmail} email={user.email} />

            <div className="mt-6 space-y-2">
              {menuItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => ['transactions', 'orders'].includes(item.id) ? onNavigate(`/${item.id}`) : setActiveTab(item.id)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
        title="Confirm Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        type="warning"
      />
    </>
  );
}

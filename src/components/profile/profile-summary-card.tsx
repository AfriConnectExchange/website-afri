
'use client';

import { Mail, Phone, MapPin, User, Settings, Receipt, LogOut, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { cn } from '@/lib/utils';
import { createSPAClient } from '@/lib/supabase/client';
import { type User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSummaryCardProps {
  user: SupabaseUser;
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
  const supabase = createSPAClient();
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserProfile(data);
      }
    };
    if(user) {
        fetchProfile();
    }
  }, [user, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    onNavigate('/');
  };

  const userName = userProfile?.full_name || user.email || 'Unnamed User';
  
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
              <AvatarImage src={userProfile?.profile_picture_url || user.user_metadata.avatar_url || undefined} alt={userName} />
              <AvatarFallback className="text-2xl bg-muted">
                {userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg mb-1">{userName}</h3>
            <Badge className={cn('mb-3', getRoleColor(userProfile?.roles?.[0]))}>
              {getRoleLabel(userProfile?.roles?.[0])}
            </Badge>
            <div className="text-sm text-muted-foreground space-y-1 my-4">
              {user.email && (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {userProfile?.phone && (
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{userProfile.phone}</span>
                </div>
              )}
              {userProfile?.address && (
                <div className="flex items-center justify-center gap-2 text-center">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{userProfile.address}</span>
                </div>
              )}
            </div>

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

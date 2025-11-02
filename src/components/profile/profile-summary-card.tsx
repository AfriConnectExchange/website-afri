
'use client';

import { Mail, Phone, MapPin, User, Settings, Receipt, LogOut, ShoppingCart, Loader2, UploadCloud } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VerifyEmailModal from './VerifyEmailModal';
import VerifyPhoneModal from './VerifyPhoneModal';
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
  const { logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [showVerifyPhone, setShowVerifyPhone] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
    { id: 'account', label: 'Settings', icon: Settings },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
  ];

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="w-28 h-28 mx-auto mb-4 rounded-full ring-1 ring-primary/10">
                <AvatarImage src={user.avatarUrl || user.profile_picture_url || undefined} alt={userName ?? undefined} />
                <AvatarFallback className="text-3xl bg-muted rounded-full">
                  {userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>

              {/* hidden file input for changing picture (triggered by the overlay button) */}
              <input
                id="profile-picture-upload"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 2MB.' });
                    return;
                  }
                  setIsUploading(true);
                  try {
                    const storage = getStorage();
                    const storageRef = ref(storage, `profile-pictures/${user.id}/${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    // Update user profile (this will update auth photoURL and Firestore profile)
                    await updateUser({ avatarUrl: downloadURL });
                    toast({ title: 'Upload Successful', description: 'Your profile picture has been updated.' });
                  } catch (err: any) {
                    console.error('Upload failed:', err);
                    toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your profile picture. Please try again.' });
                  } finally {
                    setIsUploading(false);
                  }
                }}
              />

              <label htmlFor="profile-picture-upload" className="absolute -right-2 -bottom-2 group">
                <span className="inline-flex w-10 h-10 rounded-full bg-white border shadow items-center justify-center cursor-pointer transition-colors duration-150 ease-in-out group-hover:bg-primary/80 group-hover:text-white">
                  <UploadCloud className="w-5 h-5" />
                </span>
              </label>

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-1 flex items-center justify-center gap-2">
              {userName}
              {user?.verification_status === 'verified' && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Verified</Badge>
              )}
            </h3>
            {/* Prefer showing 'seller' role if present in the user's roles array */}
            {(() => {
              const roles = user.roles || [];
              const primary = roles.includes('seller') ? 'seller' : (roles[0] || 'buyer');
              return (
                <Badge className={cn('mb-3 transition-colors duration-150', getRoleColor(primary), 'hover:text-white')}>
                  {getRoleLabel(primary)}
                </Badge>
              );
            })()}
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
              {user.phone && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Phone className="w-4 h-4" />
                  <span className="truncate">{user.phone}</span>
                  
                  {!user.phone_verified && (
                    <Button size="sm" variant="outline" className="ml-2 h-7" onClick={() => setShowVerifyPhone(true)}>
                      Verify
                    </Button>
                  )}
                </div>
              )}
            </div>

            {user?.verification_status !== 'verified' && (
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={() => onNavigate('/kyc')}>
                  Verify identity to unlock selling
                </Button>
              </div>
            )}

            <VerifyEmailModal open={showVerifyEmail} onOpenChange={setShowVerifyEmail} email={user.email} />
            <VerifyPhoneModal open={showVerifyPhone} onOpenChange={setShowVerifyPhone} phone={user.phone} />

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

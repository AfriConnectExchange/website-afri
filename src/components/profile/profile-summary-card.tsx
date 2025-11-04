
'use client';

import { Mail, Phone, MapPin, User, Settings, Receipt, LogOut, ShoppingCart, Heart, Loader2, UploadCloud, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Button3D } from '@/components/ui/button-3d';
import { Card3D } from '@/components/ui/card-3d';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VerifyEmailModal from './VerifyEmailModal';
import VerifyPhoneModal from './VerifyPhoneModal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import type { AppUser } from '@/lib/types';
import VerifiedIcon from '@mui/icons-material/Verified';

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
  
  // Calculate profile completion
  const getCompletionPercentage = () => {
    const checks = [
      user.email_verified,
      user.phone,
      (user as any).address,
      user.avatarUrl || user.profile_picture_url,
      user.verification_status === 'verified',
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();
  
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
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
  ];

  return (
    <>
      <Card3D className="border-0 shadow-lg">
        <div className="pt-6 pb-6 px-6">
          <div className="text-center">
            {/* Avatar with Completion Ring */}
            <div className="relative inline-block mb-4">
              {/* Completion Ring */}
              <svg className="absolute inset-0 w-32 h-32 -m-2" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPercentage * 2.827}, 282.7`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              <Avatar className="w-28 h-28 mx-auto rounded-full ring-4 ring-white shadow-lg">
                <AvatarImage src={user.avatarUrl || user.profile_picture_url || undefined} alt={userName ?? undefined} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-bold rounded-full">
                  {userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>

              {/* Upload Button */}
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

              <label htmlFor="profile-picture-upload" className="absolute -right-2 -bottom-2 group cursor-pointer">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </label>

              {/* Completion Badge */}
              <div className="absolute -top-1 -left-1 bg-white rounded-full p-1 shadow-md">
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  completionPercentage === 100 ? 'bg-green-500 text-white' :
                  completionPercentage >= 75 ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-700'
                }`}>
                  {completionPercentage}%
                </div>
              </div>

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* User Info */}
            <h3 className="font-bold text-xl mb-1 flex items-center justify-center gap-2">
              {userName}
              {user?.verification_status === 'verified' && (
                <VerifiedIcon className="text-green-600 dark:text-green-400 animate-pulse" fontSize="small" />
              )}
            </h3>
            {/* Prefer showing 'seller' role if present in the user's roles array */}
            {(() => {
              const roles = user.roles || [];
              const primary = roles.includes('seller') ? 'seller' : (roles[0] || 'buyer');
              return (
                <Badge className={cn(
                  'mb-3 transition-all duration-200 hover:scale-110 shadow-md px-3 py-1',
                  getRoleColor(primary)
                )}>
                  {getRoleLabel(primary)}
                </Badge>
              );
            })()}

            {/* Contact Info */}
            <div className="text-sm text-gray-600 space-y-2 my-4 px-4">
              {user.email && (
                <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl p-2.5">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="truncate flex-1 text-xs">{user.email}</span>
                
                  {!user.email_verified && (
                    <Button3D size="sm" variant="outline" className="ml-2 h-7 text-xs" onClick={() => setShowVerifyEmail(true)}>
                      Verify
                    </Button3D>
                  )}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl p-2.5">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="truncate flex-1 text-xs">{user.phone}</span>
                  
                  {!user.phone_verified && (
                    <Button3D size="sm" variant="outline" className="ml-2 h-7 text-xs" onClick={() => setShowVerifyPhone(true)}>
                      Verify
                    </Button3D>
                  )}
                </div>
              )}
            </div>

            {/* KYC Call to Action */}
            {user?.verification_status !== 'verified' && (
              <div className="mt-4 px-4">
                <Button3D size="sm" variant="warning" className="w-full" onClick={() => onNavigate('/kyc')}>
                  🎯 Verify Identity to Unlock Selling
                </Button3D>
              </div>
            )}

            <VerifyEmailModal open={showVerifyEmail} onOpenChange={setShowVerifyEmail} email={user.email} />
            <VerifyPhoneModal open={showVerifyPhone} onOpenChange={setShowVerifyPhone} phone={user.phone} />

            {/* Menu Items */}
            <div className="mt-6 space-y-1.5 px-3">
              {menuItems.map(item => (
                <Button3D
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => ['transactions', 'orders', 'wishlist'].includes(item.id) ? onNavigate(`/${item.id}`) : setActiveTab(item.id)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button3D>
              ))}
              <Button3D
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-destructive hover:bg-destructive/10"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button3D>
            </div>
          </div>
        </div>
      </Card3D>
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

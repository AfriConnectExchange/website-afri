'use client';
import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileSummaryCard } from './profile-summary-card';
import { ProfileCompletionCard } from './profile-completion-card';
import { PersonalInfoForm } from './personal-info-form';
import { AccountRoleForm } from './account-role-form';
import { PreferencesForm } from './preferences-form';
import { AccountActions } from './account-actions';
import { SessionsList } from './sessions-list';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AddressBook } from './address-book';

export function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  const handleFeedback = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setSuccess('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
     return (
        <div className="flex h-[400px] items-center justify-center">
            <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Redirecting...</span>
            </div>
        </div>
     );
  }
  
  return (
      <>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 [&>svg]:text-green-500">
             <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Summary - Sticky on Desktop */}
            <div className="lg:sticky top-24">
              <ProfileSummaryCard 
                user={user} 
                onNavigate={router.push} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {/* Completion Card - Gamification */}
            <div className="hidden lg:block">
              <ProfileCompletionCard user={user} onNavigate={router.push} />
            </div>
          </div>

          <div className="lg:col-span-3">
            {/* Mobile Completion Card - Above Tabs */}
            <div className="lg:hidden mb-6">
              <ProfileCompletionCard user={user} onNavigate={router.push} />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="lg:hidden">
                <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="space-y-6 mt-0">
                 <PersonalInfoForm onFeedback={handleFeedback} />
                 <AddressBook onFeedback={handleFeedback} />
                 <AccountRoleForm onFeedback={handleFeedback} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                <PreferencesForm onFeedback={handleFeedback} />
              </TabsContent>

              <TabsContent value="account" className="space-y-6 mt-0">
                <AccountActions onFeedback={handleFeedback} />
                <SessionsList />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
  );
}

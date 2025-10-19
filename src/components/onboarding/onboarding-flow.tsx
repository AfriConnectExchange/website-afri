
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeStep } from './welcome-step';
import { RoleSelectionStep } from './role-selection-step';
import { PersonalDetailsStep } from './personal-details-step';
import { FinalStep } from './final-step';
import { Progress } from '../ui/progress';
import { Logo } from '../logo';
import { useToast } from '../../hooks/use-toast';
import { createSPAClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';


export function OnboardingFlow() {
  const supabase = createSPAClient();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const [userData, setUserData] = useState({
    primary_role: 'buyer',
    full_name: '',
    phone_number: '',
    location: '',
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if(session?.user) {
        setUserData((prev) => ({
          ...prev,
          full_name: session.user.user_metadata.full_name || session.user.email || '',
          phone_number: session.user.phone || '',
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleRoleSelection = async (data: { role: string }) => {
    const role = data.role as 'buyer' | 'seller' | 'sme' | 'trainer';
    handleUpdateUserData({ primary_role: role });

    if (role === 'buyer') {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (user) {
          try {
            const { error } = await supabase
                .from('users')
                .update({ roles: [role] })
                .eq('id', user.id);
            if (error) throw error;
          } catch(error: any) {
              toast({ variant: 'destructive', title: 'Failed to Save Role', description: error.message });
              return;
          }
      }
      toast({
        title: 'Seller Verification Required',
        description: "You'll be redirected to complete your seller profile.",
      });
      router.push('/kyc');
    }
  };

  const handleOnboardingComplete = async (data: {
    full_name: string;
    phone_number: string;
    location: string;
  }) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    try {
      const { error } = await supabase.from('users').update({
        full_name: data.full_name,
        phone: data.phone_number,
        address: data.location,
        roles: [userData.primary_role],
      }).eq('id', user.id);
      
      if (error) throw error;
      
      // Update onboarding progress
      const { error: progressError } = await supabase.from('user_onboarding_progress').upsert({
        user_id: user.id,
        walkthrough_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
      if(progressError) throw progressError;

      setCurrentStep((prev) => prev + 1);
    } catch(error: any) {
      toast({ variant: 'destructive', title: 'Failed to Save Profile', description: error.message });
    }
  };

  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleUpdateUserData = (data: Partial<typeof userData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };
  
  const steps = [
    <WelcomeStep onNext={() => setCurrentStep(1)} />,
    <RoleSelectionStep
      onNext={handleRoleSelection}
      onBack={handleBack}
      onUpdate={(data) => handleUpdateUserData({ primary_role: data.role as 'buyer' | 'seller' | 'sme' | 'trainer' })}
      currentValue={String(userData.primary_role)}
    />,
    <PersonalDetailsStep
      onNext={handleOnboardingComplete}
      onBack={handleBack}
      defaultValues={{
        fullName: userData.full_name,
        phoneNumber: userData.phone_number,
        location: userData.location,
      }}
    />,
    <FinalStep />,
  ];

  const progressValue = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="bg-card rounded-2xl shadow-xl border p-4 sm:p-8 w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Logo withText={false} />
        <h1 className="text-2xl font-bold">AfriConnect Exchange</h1>
      </div>
      <Progress value={progressValue} className="mb-8" />
      <div className="min-h-[400px] flex flex-col justify-center">
        {steps[currentStep]}
      </div>
    </div>
  );
}

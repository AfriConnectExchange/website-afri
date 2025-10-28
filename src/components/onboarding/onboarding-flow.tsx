
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeStep } from './welcome-step';
import { RoleSelectionStep } from './role-selection-step';
import { PersonalDetailsStep } from './personal-details-step';
import { FinalStep } from './final-step';
import { Progress } from '../ui/progress';
import { Logo } from '../logo';
import MuiSnackbar from '@/components/ui/Snackbar';
import { useAuth } from '@/context/auth-context';

export function OnboardingFlow() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const [userData, setUserData] = useState({
    primary_role: 'buyer',
    full_name: '',
    phone_number: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if(user) {
        setUserData((prev) => ({
          ...prev,
          full_name: user.email || '',
          phone_number: '',
          primary_role: user.role || 'buyer',
        }));
      }
  }, [user]);

  const handleRoleSelection = async (data: { role: string }) => {
    const role = data.role as 'buyer' | 'seller' | 'sme' | 'trainer';
    handleUpdateUserData({ primary_role: role });

    if (role === 'buyer') {
      setCurrentStep((prev) => prev + 1);
    } else {
       if (user) {
          try {
            // Cast to any during migration to allow storing custom fields on the user record
            updateUser({ role } as any);
          } catch(error: any) {
              setSnackbar({ open: true, message: `Failed to Save Role: ${error.message}`, severity: 'error' });
              return;
          }
      }
      setSnackbar({ open: true, message: "Seller Verification Required. You'll be redirected to complete your seller profile.", severity: 'info' });
      router.push('/kyc');
    }
  };

  const handleOnboardingComplete = async (data: {
    full_name: string;
    phone_number: string;
    location: string;
  }) => {
    if (!user) {
      setSnackbar({ open: true, message: 'You must be logged in.', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      // Update users table with correct columns
      const res = await fetch('/api/onboarding/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          full_name: data.full_name,
          phone: data.phone_number,
          address: data.location,
          role: userData.primary_role,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update profile');
      localStorage.setItem('onboarding_completed', 'true');
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setCurrentStep((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
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
      <div className="min-h-[400px] flex flex-col justify-center relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 z-10">
            <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        )}
        {steps[currentStep]}
      </div>
      <MuiSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

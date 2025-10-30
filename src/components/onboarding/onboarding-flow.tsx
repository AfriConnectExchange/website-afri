
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingProgress } from './onboarding-progress';
import { PersonalDetailsStep } from './steps/personal-details-step';
import { ProfilePictureStep } from './steps/profile-picture-step';
import { CompletionStep } from './steps/completion-step';
import TermsStep from './steps/terms-step';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebaseClient';
import { fetchWithAuth } from '@/lib/api';

type OnboardingStep = 'personal' | 'terms' | 'picture' | 'complete';

export interface OnboardingData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  avatarUrl?: string;
  email?: string;
  // Optional seller/business fields
  shopName?: string | null;
  isSeller?: boolean;
  // Terms acceptance
  agreedToTerms?: boolean;
  termsDocument?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    avatarUrl: user?.avatarUrl || '',
    latitude: null,
    longitude: null,
    shopName: null,
    agreedToTerms: false,
    termsDocument: null,
    isSeller: false,
  });

  const handleDataChange = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    if (currentStep === 'personal') setCurrentStep('terms');
    else if (currentStep === 'terms') setCurrentStep('picture');
    if (currentStep === 'picture') submitOnboarding();
  };

  const goToPreviousStep = () => {
    if (currentStep === 'picture') setCurrentStep('terms');
    else if (currentStep === 'terms') setCurrentStep('personal');
  };

  const submitOnboarding = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to complete onboarding.' });
        return;
    }

    setIsLoading(true);
    try {
      
      // The updateUser function now handles the API call
      const payload: any = { ...onboardingData, onboarding_completed: true };
      // If user indicated they are a seller, ensure the role is included
      if (onboardingData.isSeller) {
        const existingRoles = user?.roles || [];
        if (!existingRoles.includes('seller')) {
          payload.roles = [...existingRoles, 'seller'];
        } else {
          payload.roles = existingRoles;
        }
      }
      await updateUser(payload);
      
      toast({
        title: 'Profile Completed!',
        description: 'Welcome to AfriConnect Exchange!',
      });

      setCurrentStep('complete');
      setTimeout(onComplete, 2000);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-xl">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4"/>
            <h3 className="text-lg font-semibold">Finalizing your profile...</h3>
            <p className="text-sm text-muted-foreground">Please wait a moment.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <OnboardingProgress currentStep={currentStep} />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 'personal' && (
            <PersonalDetailsStep
              data={onboardingData}
              onDataChange={handleDataChange}
              onNext={goToNextStep}
            />
          )}
          {currentStep === 'terms' && (
            <TermsStep
              onBack={() => setCurrentStep('personal')}
              onNext={() => setCurrentStep('picture')}
              onAgree={(data) => handleDataChange({ agreedToTerms: data.agreed, termsDocument: data.document ?? null })}
            />
          )}
          {currentStep === 'picture' && (
            <ProfilePictureStep
              data={onboardingData}
              onDataChange={handleDataChange}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
           {currentStep === 'complete' && (
            <CompletionStep />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

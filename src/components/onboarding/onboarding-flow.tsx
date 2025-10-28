'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingProgress } from './onboarding-progress';
import { PersonalDetailsStep } from './steps/personal-details-step';
import { ProfilePictureStep } from './steps/profile-picture-step';
import { CompletionStep } from './steps/completion-step';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type OnboardingStep = 'personal' | 'picture' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export interface OnboardingData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  avatarUrl?: string;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    avatarUrl: user?.avatarUrl || '',
  });

  const handleDataChange = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    if (currentStep === 'personal') setCurrentStep('picture');
    if (currentStep === 'picture') submitOnboarding();
  };

  const goToPreviousStep = () => {
    if (currentStep === 'picture') setCurrentStep('personal');
  };

  const submitOnboarding = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to complete onboarding.' });
        return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(onboardingData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete profile.');
      }
      
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

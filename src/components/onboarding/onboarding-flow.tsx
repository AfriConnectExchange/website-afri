
'use client';
import React, { useState } from 'react';
import { WelcomeStep } from './welcome-step';
import { RoleSelectionStep } from './role-selection-step';
import { PersonalDetailsStep } from './personal-details-step';
import { FinalStep } from './final-step';

// Helper function to call the API
const saveOnboardingProgress = async (step: string, isCompleted: boolean = false) => {
  try {
    await fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, isCompleted }),
    });
  } catch (error) {
    console.error("Failed to save onboarding progress:", error);
  }
};

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    // Save the completion of the current step before moving to the next
    const steps = ['welcome', 'role-selection', 'personal-details'];
    if (currentStep < steps.length) {
      await saveOnboardingProgress(steps[currentStep]);
    }
    setCurrentStep(currentStep + 1);
  };

  const handleComplete = async () => {
    // Mark the final step as complete and the entire flow as completed
    await saveOnboardingProgress('final', true);
    // Here you would typically redirect the user, e.g., to their dashboard
    window.location.href = '/';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <RoleSelectionStep onNext={handleNext} />;
      case 2:
        return <PersonalDetailsStep onNext={handleNext} />;
      case 3:
        return <FinalStep onComplete={handleComplete} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div>
      {renderStep()}
    </div>
  );
}

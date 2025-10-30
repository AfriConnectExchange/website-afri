'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OnboardingProgressProps {
  currentStep: 'account' | 'personal' | 'terms' | 'picture' | 'complete';
}

const steps = [
  { id: 'account', title: 'Account Type' },
  { id: 'personal', title: 'Personal Details' },
  { id: 'terms', title: 'Terms' },
  { id: 'picture', title: 'Profile Picture' },
  { id: 'complete', title: 'Complete' }
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {

  const getStepNumber = (stepId: string) => {
    return steps.findIndex(step => step.id === stepId) + 1;
  };

  const getProgressPercentage = () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    return ((currentStepIndex) / (steps.length - 1)) * 100;
  };

  return (
    <Card className="mb-6">
        <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Onboarding Progress</span>
            <span className="text-sm text-muted-foreground">
                Step {getStepNumber(currentStep)} of {steps.length}
            </span>
            </div>
            <Progress value={getProgressPercentage()} className="mb-2" />
             <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step) => (
                <span key={step.id} className={currentStep === step.id ? 'text-primary font-medium' : ''}>
                {step.title}
                </span>
            ))}
            </div>
        </CardContent>
    </Card>
  );
}

'use client';
import { Card, CardContent } from '@/components/ui/card';
import type { KYCStep } from './kyc-flow';
import { User, BriefcaseBusiness, FileText, Eye, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface KycProgressProps {
  currentStep: KYCStep;
}

const STEP_META: Array<{ id: KYCStep | 'complete'; title: string; icon: any }> = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'business', title: 'Business Details', icon: BriefcaseBusiness },
  { id: 'documents', title: 'Documents', icon: FileText },
  { id: 'review', title: 'Review', icon: Eye },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
];

export function KycProgress({ currentStep }: KycProgressProps) {
  const currentIndex = STEP_META.findIndex((s) => s.id === currentStep);

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header with reassurance */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Secure verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">~ 3–5 min</span>
          </div>
        </div>

        {/* Vertical stepper on desktop; horizontal fallback on mobile */}
        <div className="hidden sm:block">
          <ol className="relative border-s pl-4">
            {STEP_META.map((step, index) => {
              const isDone = index < currentIndex;
              const isActive = index === currentIndex;
              const Icon = step.icon;
              return (
                <li key={step.id} className="mb-6 ms-4">
                  <span className={`absolute -start-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-background ${
                    isDone ? 'bg-green-600 text-white' : isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-3 h-3" />
                  </span>
                  <h3 className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</h3>
                  {isActive && (
                    <p className="text-xs text-muted-foreground mt-1">Please complete this step to continue</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile: compact horizontal pills */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {STEP_META.map((step, index) => {
              const isActive = index === currentIndex;
              const Icon = step.icon;
              return (
                <div key={step.id} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-3 h-3" />
                  <span>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

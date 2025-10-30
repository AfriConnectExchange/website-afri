'use client';
import React from 'react';

type Props = {
  message?: string;
};

export default function RedirectingOverlay({ message = 'Redirecting...' }: Props) {
  return (
    <div className="absolute inset-0 z-50 bg-background/70 flex flex-col items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 border-4 border-muted rounded-full border-t-primary animate-spin" />
        <div className="text-lg font-medium">{message}</div>
      </div>
    </div>
  );
}

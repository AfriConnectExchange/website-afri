'use client';
import React from 'react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string | null;
}

export default function SuspensionModal({ open, onOpenChange, message }: Props) {
  const description = message ?? 'Your account has been suspended or disabled. This may have been done by an administrator or due to a policy violation. If you believe this is a mistake, please contact support.';
  const router = useRouter();

  return (
    <ConfirmationModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onConfirm={() => {
        onOpenChange(false);
        // Send user to the reactivation request page where they can submit details
        router.push('/account/reactivate');
      }}
      title="Account Suspended"
      description={description}
      confirmText="Request Reactivation"
      cancelText="Close"
      type="info"
      details={['If this was done by an admin, you may need to request reinstatement.','We keep your data safe during suspension.']}
    />
  );
}

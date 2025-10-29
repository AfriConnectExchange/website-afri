
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchWithAuth } from '@/lib/api';
import { auth as clientAuth } from '@/lib/firebaseClient';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';


interface AccountActionsProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export function AccountActions({ onFeedback }: AccountActionsProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeactivate = () => {
    setShowDeactivateConfirm(true);
  };
  
  const confirmDeactivate = async () => {
     setShowDeactivateConfirm(false);
     try {
       // Call server endpoint to deactivate the account (disable Auth user + mark Firestore doc)
       const res = await fetchWithAuth('/api/account/deactivate', { method: 'POST' });
       const json = await res.json();
       if (res.ok && json.ok) {
         toast({ title: 'Account Deactivated', description: 'Your account was deactivated. You have been signed out.' });
         // Ensure local sign out
         try { await logout(); } catch (e) {}
       } else {
         // Fallback: sign out locally and show message
         try { await logout(); } catch (e) {}
         onFeedback('error', json.error || 'Failed to deactivate account.');
       }
     } catch (e: any) {
       console.error('Deactivation failed', e);
       // fallback to just sign out locally
       try { await logout(); } catch (err) {}
       onFeedback('error', e?.message || 'Failed to deactivate account.');
     }
  }

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const res = await fetchWithAuth('/api/account/delete', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast({ title: 'Account deleted', description: 'Your account has been deleted.' });
        // Attempt local sign out
        try { await logout(); } catch (e) {}
        // Redirect to home
        router.push('/');
      } else {
        onFeedback('error', json.error || 'Failed to delete account.');
      }
    } catch (e: any) {
      console.error('Account deletion failed', e);
      onFeedback('error', e?.message || 'Failed to delete account.');
    }
  };

  // Change password flow
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const confirmChangePassword = async () => {
    if (!clientAuth.currentUser || !clientAuth.currentUser.email) {
      onFeedback('error', 'No authenticated user.');
      return;
    }
    setIsChangingPwd(true);
    try {
      const credential = EmailAuthProvider.credential(clientAuth.currentUser.email, currentPwd);
      await reauthenticateWithCredential(clientAuth.currentUser, credential);
      await updatePassword(clientAuth.currentUser, newPwd);
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setShowChangePwd(false);
      setCurrentPwd('');
      setNewPwd('');
    } catch (e: any) {
      console.error('Change password failed', e);
      onFeedback('error', e?.message || 'Failed to change password.');
    } finally {
      setIsChangingPwd(false);
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Manage your account status and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-medium">Deactivate Account</h4>
            <p className="text-sm text-muted-foreground">
              Temporarily disable your account by signing out. You can reactivate it by signing in again.
            </p>
            <Button variant="outline" onClick={handleDeactivate}>
              Deactivate Account
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-destructive">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <ConfirmationModal
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={confirmDeactivate}
        title="Confirm Deactivation"
        description="This will sign you out of your account. Are you sure you want to proceed?"
        confirmText="Deactivate & Sign Out"
        type="warning"
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Confirm Account Deletion"
        description="This action is permanent and cannot be undone. Are you absolutely sure?"
        confirmText="Yes, Delete My Account"
        type="destructive"
        consequences={[
            "Your profile and listings will be removed.",
            "You will lose your order history.",
            "This action cannot be reversed."
        ]}
      />

      {/* Inline change password area */}
      <div className="mt-4 space-y-4">
        <h4 className="font-medium">Change Password</h4>
        {!showChangePwd ? (
          <Button variant="outline" onClick={() => setShowChangePwd(true)}>Change Password</Button>
        ) : (
          <div className="space-y-3">
            <input type="password" placeholder="Current password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="w-full p-2 border rounded" />
            <input type="password" placeholder="New password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="w-full p-2 border rounded" />
            <div className="flex items-center gap-2">
              <Button onClick={confirmChangePassword} disabled={isChangingPwd}>{isChangingPwd ? 'Changing...' : 'Save new password'}</Button>
              <Button variant="ghost" onClick={() => { setShowChangePwd(false); setCurrentPwd(''); setNewPwd(''); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

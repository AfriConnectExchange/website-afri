"use client";

import { useState } from "react";
import { UserDoc } from "@/lib/firestoreTypes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldOff,
  ShieldCheck,
  UserX,
  Lock,
  Key,
  UserCheck,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/admin-auth-context";

interface UserActionsProps {
  user: UserDoc;
  onUpdate: () => void;
}

export function UserActions({ user, onUpdate }: UserActionsProps) {
  const [modalState, setModalState] = useState({
    open: false,
    action: "",
    title: "",
    description: "",
  });
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getAdminToken } = useAdminAuth();

  const openModal = (
    action: string,
    title: string,
    description: string
  ) => {
    setModalState({ open: true, action, title, description });
    setReason("");
  };

  const handleAction = async () => {
    setIsLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Authentication failed");

      const response = await fetch(`/api/admin/users/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          action: modalState.action,
          reason: reason,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Success",
        description: `User has been ${modalState.action}.`,
      });
      onUpdate(); // Refresh user data
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setModalState({ open: false, action: "", title: "", description: "" });
    }
  };

  const actions = [
    {
      label: "Suspend User",
      icon: ShieldOff,
      action: "suspend",
      variant: "destructive",
      hidden: user.account_status === "suspended",
    },
    {
      label: "Unsuspend User",
      icon: ShieldCheck,
      action: "unsuspend",
      variant: "default",
      hidden: user.account_status !== "suspended",
    },
    {
      label: "Deactivate User",
      icon: UserX,
      action: "deactivate",
      variant: "destructive",
      hidden: user.account_status === "deactivated",
    },
    {
      label: "Manually Verify KYC",
      icon: UserCheck,
      action: "verify_kyc",
      variant: "default",
      hidden: user.kyc_status === "verified",
    },
    {
      label: "Grant Admin Role",
      icon: Key,
      action: "grant_admin",
      variant: "destructive",
      hidden: user.roles?.includes("admin"),
    },
    {
      label: "Revoke Admin Role",
      icon: Lock,
      action: "revoke_admin",
      variant: "destructive",
      hidden: !user.roles?.includes("admin"),
    },
  ];

  return (
    <>
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions
            .filter((a) => !a.hidden)
            .map((action) => (
              <Button
                key={action.action}
                variant={action.variant as any}
                className="w-full justify-start gap-2"
                onClick={() =>
                  openModal(
                    action.action,
                    `${action.label}?`,
                    `Are you sure you want to ${action.label.toLowerCase()}? This action will be logged.`
                  )
                }
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={modalState.open}
        onClose={() => setModalState({ ...modalState, open: false })}
        onConfirm={handleAction}
        title={modalState.title}
        description={modalState.description}
        isLoading={isLoading}
        requiresReason={true}
        reason={reason}
        onReasonChange={setReason}
      />
    </>
  );
}

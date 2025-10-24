
"use client";

import ForgotPasswordForm from '@/components/auth/forgot-password-form';
import { Card, CardContent } from '@/components/ui/card';


export default function ForgotPasswordPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-base sm:text-lg">AE</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-bold">AfriConnect Exchange</span>
                </div>
                <h1 className="text-xl font-semibold mb-2">Forgot Your Password?</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter your email to receive a password reset link.
                </p>
            </div>
            <Card>
                <CardContent className="p-6">
                    <ForgotPasswordForm />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

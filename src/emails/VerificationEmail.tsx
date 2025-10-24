import React from 'react';

export default function VerificationEmail({ name }: { name?: string; link?: string }) {
  return (
    <html>
      <body>
        <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 20 }}>
          <h1>Verify your email</h1>
          <p>Hi {name || 'there'},</p>
          <p>Click the button below to verify your email and continue setting up your account.</p>
          {/* 
            The href attribute MUST contain the {{ .ConfirmationURL }} Go template variable.
            Supabase replaces this with the actual confirmation link before sending the email.
            Do not change this, otherwise the sign-up process will fail with a 500 error.
          */}
          <p><a href="{{ .ConfirmationURL }}" style={{ background: '#111827', color: '#fff', padding: '10px 16px', borderRadius: 6, textDecoration: 'none' }}>Verify Email</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
        </div>
      </body>
    </html>
  );
}


import React from 'react';

export default function VerificationEmail({ name, link }: { name?: string; link?: string }) {
  return (
    <html>
      <body>
        <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 20 }}>
          <h1>Verify your email</h1>
          <p>Hi {name || 'there'},</p>
          <p>Click the button below to verify your email and continue setting up your account.</p>
          <p><a href={link} style={{ background: '#111827', color: '#fff', padding: '10px 16px', borderRadius: 6, textDecoration: 'none' }}>Verify Email</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
        </div>
      </body>
    </html>
  );
}

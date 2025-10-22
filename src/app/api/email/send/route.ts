
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email(),
  type: z.enum(['verify-email']),
});

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body = await request.json();

  const validation = emailSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, type } = validation.data;

  try {
    if (type === 'verify-email') {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        // Even if Supabase handles sending, if it fails, we should throw an error.
        throw new Error(error.message);
      }
      
      // We can still use our custom mailer to log this action or send a supplementary notification.
      // For now, let's just log that a verification was initiated via Supabase.
      await sendEmail({
          to: email,
          subject: 'AfriConnect Verification Link',
          text: `A verification link has been sent to your email by our system. Please check your inbox to complete your registration.`,
          html: `<p>A verification link has been sent to your email by our system. Please check your inbox to complete your registration.</p>`,
      });

    } else {
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Email process initiated.' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

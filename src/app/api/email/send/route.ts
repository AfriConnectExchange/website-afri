
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
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw new Error(error.message);
      }
      // Note: Supabase handles sending the verification email in this case.
      // Our custom mailer would be used for other email types.
      // For demonstration, we could still send a custom one.
      await sendEmail({
          to: email,
          subject: 'Your AfriConnect Verification Link',
          text: `Thank you for signing up. Please verify your email by opening the link sent by Supabase. If you did not receive it, you can request another one.`,
          html: `<p>Thank you for signing up. Please verify your email by opening the link sent by Supabase. If you did not receive it, you can request another one.</p>`,
      })

    } else {
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Email process initiated.' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

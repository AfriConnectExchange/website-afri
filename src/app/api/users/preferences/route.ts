
import { NextResponse } from 'next/server';
import { z } from 'zod';

const preferencesSchema = z.object({
  notifications_enabled: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  two_factor_enabled: z.boolean().optional(),
});

export async function GET(request: Request) {
  // Logic to get user preferences would go here
  return NextResponse.json({});
}

export async function POST(request: Request) {
  const body = await request.json();
  const validation = preferencesSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  // Logic to update user preferences would go here

  return NextResponse.json({ success: true, message: 'Preferences updated.' });
}

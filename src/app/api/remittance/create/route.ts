
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createRemittanceSchema = z.object({
  recipient_name: z.string().min(2),
  recipient_phone: z.string().min(10),
  recipient_country: z.string().min(2),
  amount: z.number().positive(),
  currency: z.string().length(3),
  purpose: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validation = createRemittanceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  // Logic to create remittance would go here

  return NextResponse.json({ success: true, message: 'Remittance initiated successfully.' });
}

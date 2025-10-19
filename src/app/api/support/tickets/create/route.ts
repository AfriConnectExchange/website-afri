
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createTicketSchema = z.object({
  category: z.string().min(1),
  subject: z.string().min(5),
  description: z.string().min(20),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validation = createTicketSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  // Logic to create support ticket would go here

  return NextResponse.json({ success: true, message: 'Support ticket created.' });
}

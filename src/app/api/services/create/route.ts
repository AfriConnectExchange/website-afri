
import { NextResponse } from 'next/server';
import { z } from 'zod';

const serviceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  category_id: z.string().uuid(),
  price_from: z.number().min(0),
  price_to: z.number().optional(),
  is_remote: z.boolean().default(false),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validation = serviceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  // Logic to create service would go here

  return NextResponse.json({ success: true, message: 'Service listed successfully.' });
}

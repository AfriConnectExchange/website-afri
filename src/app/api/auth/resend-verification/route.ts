import { NextResponse } from 'next/server';

// Minimal stub for resend-verification API route used by validator/types.
export async function POST(req: Request) {
  // Implement real logic here if needed. This stub prevents type errors during local typecheck.
  return NextResponse.json({ ok: true });
}

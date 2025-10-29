import { NextResponse } from 'next/server';

// Minimal stub for profile API route used by validator/types.
export async function GET(req: Request) {
  return NextResponse.json({ ok: true });
}

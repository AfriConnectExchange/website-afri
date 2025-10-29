import { NextResponse } from 'next/server';

// Minimal stub for signup API route used by validator/types.
export async function POST(req: Request) {
  return NextResponse.json({ ok: true });
}

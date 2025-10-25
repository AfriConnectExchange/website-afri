// src/app/api/auth/[...nextauth]/route.ts
// NextAuth route removed. This file intentionally returns 410 Gone so any
// requests to the NextAuth endpoint fail fast while the app migrates to
// custom auth endpoints (e.g. /api/auth/register, /api/auth/verify, etc.).
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'NextAuth removed. Use custom auth endpoints.' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'NextAuth removed. Use custom auth endpoints.' }, { status: 410 });
}
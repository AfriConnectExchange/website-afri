import { NextResponse } from 'next/server';

export async function GET() {
  // Minimal stub for development: return empty products list.
  return NextResponse.json({ products: [] }, { status: 200 });
}

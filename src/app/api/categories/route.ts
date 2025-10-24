import { NextResponse } from 'next/server';

export async function GET() {
  // Minimal stub for development: return an empty list or simple sample categories.
  const categories = [
    { id: 'sample-1', name: 'Sample Category' }
  ];
  return NextResponse.json(categories, { status: 200 });
}

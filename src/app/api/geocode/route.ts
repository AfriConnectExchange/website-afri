import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { geocodeAddress } from '@/lib/geocode';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    await admin.auth().verifyIdToken(token);
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { address } = body || {};
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

    const result = await geocodeAddress(address);
    if (!result) return NextResponse.json({ error: 'Geocoding failed or returned no results' }, { status: 422 });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Geocode API error', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

/**
 * API endpoint to create a new admin account
 * This should be protected and only accessible by existing admins or via server-side script
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check to verify caller is an existing admin
    // For now, you can protect this endpoint by removing it after creating your first admin
    
    const { email, password, displayName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || 'Admin User',
      emailVerified: true, // Auto-verify admin emails
    });

    // Create Firestore user document with admin role
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      display_name: displayName || 'Admin User',
      roles: ['admin'], // Grant admin role
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      email_verified: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      uid: userRecord.uid,
      email: email,
    });
  } catch (error: any) {
    console.error('Error creating admin account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}

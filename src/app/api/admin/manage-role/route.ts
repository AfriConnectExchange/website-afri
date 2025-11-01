import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

/**
 * API endpoint to manage admin roles
 * Grant or revoke admin access for existing users
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check to verify caller is an existing admin
    
    const { uid, action } = await req.json();

    if (!uid || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'grant' && action !== 'revoke') {
      return NextResponse.json(
        { success: false, error: 'Action must be "grant" or "revoke"' },
        { status: 400 }
      );
    }

    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    let roles = userData?.roles || [];

    if (action === 'grant') {
      // Add admin role if not already present
      if (!roles.includes('admin')) {
        roles.push('admin');
      }
    } else {
      // Remove admin role
      roles = roles.filter((role: string) => role !== 'admin');
    }

    await userRef.update({
      roles: roles,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: `Admin role ${action === 'grant' ? 'granted to' : 'revoked from'} user`,
      uid: uid,
      roles: roles,
    });
  } catch (error: any) {
    console.error('Error managing admin role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to manage admin role' },
      { status: 500 }
    );
  }
}

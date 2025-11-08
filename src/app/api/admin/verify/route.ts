import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Helpful debug: log which project/admin app we're using and the decoded token uid
    try {
      console.debug('Admin SDK initialized app options:', admin?.app?.()?.options ?? admin?.apps?.[0]?.options);
    } catch (e) {
      console.debug('Could not read admin app options:', e);
    }
    console.debug('Decoded ID token UID:', uid, 'token claims:', decodedToken);

    // Try to fetch the auth user record (will surface clearer errors if auth is misconfigured)
    try {
      const authUser = await admin.auth().getUser(uid);
      console.debug('admin.auth().getUser result for uid:', uid, authUser.uid);
    } catch (authErr) {
      console.warn('admin.auth().getUser failed for uid:', uid, authErr);
      // Continue — the user may still exist in Firestore even if auth lookup failed
    }

    // Get user document from Firestore
    let userDoc;
    try {
      userDoc = await admin.firestore().collection('users').doc(uid).get();
    } catch (fsErr) {
      // Firestore read failed (for example: service not enabled, wrong project, or permissions).
      // Log details for diagnostics but don't crash the admin flow — treat as non-admin.
      console.error('Error reading user document from Firestore for uid', uid, fsErr);
      const ferr: any = fsErr;
      return NextResponse.json({ success: true, is_admin: false, roles: [], warning: 'firestore_unavailable', code: ferr?.code || 'firestore_error', details: ferr?.details || null }, { status: 200 });
    }

    if (!userDoc.exists) {
      // User document not present yet — treat as non-admin. Client will continue as non-admin.
      return NextResponse.json({ success: true, is_admin: false, roles: [] }, { status: 200 });
    }

    const userData = userDoc.data();
    const userRoles = userData?.roles || [];

    // Check if user has admin role
    const isAdmin = userRoles.includes('admin');

    return NextResponse.json({
      success: true,
      is_admin: isAdmin,
      roles: userRoles,
    });
  } catch (error: any) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

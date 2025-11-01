import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * PATCH /api/adverts/[id]
 * Edit an existing advert (US025-AC01, US025-AC02)
 * 
 * Acceptance Criteria:
 * - US025-AC01: Save changes and refresh in listings within 60 seconds
 * - US025-AC02: Reject invalid inputs
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const advertId = params.id;

    // Get advert
    const advertRef = adminDb.collection('adverts').doc(advertId);
    const advertDoc = await advertRef.get();

    if (!advertDoc.exists) {
      return NextResponse.json({ error: 'Advert not found' }, { status: 404 });
    }

    const advertData = advertDoc.data();

    // Verify ownership
    if (advertData!.user_id !== userId) {
      return NextResponse.json({ error: 'You do not own this advert' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      images,
      category,
      duration_days,
      target_url,
    } = body;

    // US025-AC02: Validation
    const updates: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (title !== undefined) {
      if (title.length < 5) {
        return NextResponse.json(
          { error: 'Title must be at least 5 characters' },
          { status: 400 }
        );
      }
      updates.title = title;
    }

    if (description !== undefined) {
      if (description.length < 20) {
        return NextResponse.json(
          { error: 'Description must be at least 20 characters' },
          { status: 400 }
        );
      }
      updates.description = description;
    }

    if (images !== undefined) {
      if (!Array.isArray(images) || images.length < 1) {
        return NextResponse.json(
          { error: 'At least 1 image is required' },
          { status: 400 }
        );
      }
      updates.images = images;
    }

    if (category !== undefined) {
      if (!category) {
        return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 });
      }
      updates.category = category;
    }

    if (duration_days !== undefined) {
      const durationDays = parseInt(duration_days);
      if (durationDays < 1 || durationDays > 30) {
        return NextResponse.json(
          { error: 'Duration must be between 1 and 30 days' },
          { status: 400 }
        );
      }

      // Recalculate expiry date from now
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + durationDays);
      updates.duration_days = durationDays;
      updates.expires_at = admin.firestore.Timestamp.fromDate(newExpiryDate);
    }

    if (target_url !== undefined) {
      updates.target_url = target_url;
    }

    // US025-AC01: Update advert
    await advertRef.update(updates);

    return NextResponse.json({
      success: true,
      advert_id: advertId,
      message: 'Advert updated successfully',
    });

  } catch (error) {
    console.error('Update advert error:', error);
    return NextResponse.json(
      { error: 'Failed to update advert' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/adverts/[id]
 * Delete an advert (US025-AC03)
 * 
 * Acceptance Criteria:
 * - US025-AC03: Remove permanently within 60 seconds
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const advertId = params.id;

    // Get advert
    const advertRef = adminDb.collection('adverts').doc(advertId);
    const advertDoc = await advertRef.get();

    if (!advertDoc.exists) {
      return NextResponse.json({ error: 'Advert not found' }, { status: 404 });
    }

    const advertData = advertDoc.data();

    // Verify ownership or admin
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';

    if (advertData!.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to delete this advert' }, { status: 403 });
    }

    // US025-AC03: Permanently delete
    await advertRef.delete();

    // US025-AC04: Audit log
    await adminDb.collection('audit_logs').add({
      action: 'advert_deleted',
      user_id: userId,
      advert_id: advertId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Advert deleted successfully',
    });

  } catch (error) {
    console.error('Delete advert error:', error);
    return NextResponse.json(
      { error: 'Failed to delete advert' },
      { status: 500 }
    );
  }
}

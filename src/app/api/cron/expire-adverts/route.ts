import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

/**
 * GET /api/cron/expire-adverts
 * Cron job to automatically expire adverts
 * 
 * Authentication: Requires CRON_SECRET in Authorization header
 * Schedule: Daily at midnight (configured in vercel.json)
 * 
 * Process:
 * 1. Find all active adverts where expires_at <= now
 * 2. Update status to 'expired'
 * 3. Send notification to SME
 * 4. Return count of expired adverts
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = admin.firestore.Timestamp.now();

    // Find all active adverts that have expired
    const expiredAdvertsSnapshot = await adminDb
      .collection('adverts')
      .where('status', '==', 'active')
      .where('expires_at', '<=', now)
      .get();

    if (expiredAdvertsSnapshot.empty) {
      console.log('No adverts to expire');
      return NextResponse.json({
        success: true,
        expired_count: 0,
        message: 'No adverts expired',
      });
    }

    // Batch update all expired adverts
    const batch = adminDb.batch();
    const notifications: Promise<any>[] = [];

    expiredAdvertsSnapshot.docs.forEach((doc) => {
      const advertData = doc.data();
      
      // Update advert status
      batch.update(doc.ref, {
        status: 'expired',
        updated_at: now,
      });

      // Create notification for SME
      notifications.push(
        adminDb.collection('notifications').add({
          user_id: advertData.sme_id,
          type: 'advert_expired',
          title: 'Advert Expired',
          message: `Your advert "${advertData.title}" has expired`,
          read: false,
          created_at: now,
          metadata: {
            advert_id: doc.id,
            advert_title: advertData.title,
            expired_at: now,
            views: advertData.views || 0,
            clicks: advertData.clicks || 0,
          },
        })
      );
    });

    // Commit batch update
    await batch.commit();

    // Send all notifications
    await Promise.all(notifications);

    console.log(`Expired ${expiredAdvertsSnapshot.size} adverts`);

    return NextResponse.json({
      success: true,
      expired_count: expiredAdvertsSnapshot.size,
      message: `Expired ${expiredAdvertsSnapshot.size} adverts`,
      advert_ids: expiredAdvertsSnapshot.docs.map(doc => doc.id),
    });

  } catch (error: any) {
    console.error('Failed to expire adverts:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to expire adverts' },
      { status: 500 }
    );
  }
}

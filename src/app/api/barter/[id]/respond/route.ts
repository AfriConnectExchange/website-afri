import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/barter/[id]/respond
 * Accept, reject, or counter a barter proposal (US022-AC02)
 * 
 * Acceptance Criteria:
 * - US022-AC02: Accept marks as "Confirmed", Reject marks as "Declined", Counter creates new linked proposal
 * - Notify proposer within 60 seconds
 */
export async function POST(
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

    const body = await request.json();
    const { action, counter_offer } = body; // action: 'accept', 'reject', 'counter'

    if (!action || !['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: accept, reject, or counter' },
        { status: 400 }
      );
    }

    const barterId = params.id;

    // Get barter proposal
    const barterRef = adminDb.collection('barters').doc(barterId);
    const barterDoc = await barterRef.get();

    if (!barterDoc.exists) {
      return NextResponse.json({ error: 'Barter proposal not found' }, { status: 404 });
    }

    const barterData = barterDoc.data();

    // Only recipient can respond
    if (barterData!.recipient_id !== userId) {
      return NextResponse.json({ error: 'Only the recipient can respond to this proposal' }, { status: 403 });
    }

    // Check if already responded
    if (barterData!.status !== 'Pending') {
      return NextResponse.json(
        { error: `Proposal already ${barterData!.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = barterData!.expires_at.toDate();
    if (now > expiresAt) {
      await barterRef.update({
        status: 'Expired',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ error: 'This proposal has expired' }, { status: 400 });
    }

    if (action === 'accept') {
      // US022-AC02: Mark as "Confirmed"
      await barterRef.update({
        status: 'Confirmed',
        confirmed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyBarterResponse(barterData!.proposer_id, barterId, 'accepted', barterData!.offer_item_name);

      return NextResponse.json({
        success: true,
        status: 'Confirmed',
        message: 'Barter proposal accepted',
      });

    } else if (action === 'reject') {
      // US022-AC02: Mark as "Declined"
      await barterRef.update({
        status: 'Declined',
        declined_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyBarterResponse(barterData!.proposer_id, barterId, 'declined', barterData!.offer_item_name);

      return NextResponse.json({
        success: true,
        status: 'Declined',
        message: 'Barter proposal declined',
      });

    } else if (action === 'counter') {
      // US022-AC02: Create counter-offer
      if (!counter_offer || !counter_offer.item_name || !counter_offer.description || !counter_offer.estimated_value) {
        return NextResponse.json(
          { error: 'Counter offer must include item_name, description, and estimated_value' },
          { status: 400 }
        );
      }

      if (counter_offer.description.length < 20) {
        return NextResponse.json(
          { error: 'Counter offer description must be at least 20 characters' },
          { status: 400 }
        );
      }

      // Mark original as countered
      await barterRef.update({
        status: 'Countered',
        countered_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create new proposal (roles reversed)
      const counterBarterRef = adminDb.collection('barters').doc();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (counter_offer.expiry_days || 7));

      await counterBarterRef.set({
        barter_id: counterBarterRef.id,
        proposer_id: userId, // Now the original recipient is proposer
        recipient_id: barterData!.proposer_id, // Now the original proposer is recipient
        target_product_id: barterData!.target_product_id,
        target_product_title: barterData!.target_product_title,
        offer_type: counter_offer.offer_type || 'product',
        offer_item_name: counter_offer.item_name,
        offer_description: counter_offer.description,
        offer_estimated_value: parseFloat(counter_offer.estimated_value),
        offer_condition: counter_offer.condition || null,
        offer_category: counter_offer.category || barterData!.offer_category,
        exchange_location: counter_offer.exchange_location || barterData!.exchange_location,
        additional_notes: counter_offer.additional_notes || '',
        status: 'Pending',
        parent_barter_id: barterId, // Link to original
        is_counter_offer: true,
        expires_at: admin.firestore.Timestamp.fromDate(expiryDate),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyCounterOffer(barterData!.proposer_id, counterBarterRef.id, counter_offer.item_name);

      return NextResponse.json({
        success: true,
        status: 'Countered',
        counter_barter_id: counterBarterRef.id,
        message: 'Counter offer sent successfully',
      });
    }

  } catch (error) {
    console.error('Barter response error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to barter proposal' },
      { status: 500 }
    );
  }
}

/**
 * Notify proposer of response
 */
async function notifyBarterResponse(
  proposerId: string,
  barterId: string,
  action: string,
  offerItemName: string
): Promise<void> {
  const notificationRef = adminDb.collection('notifications').doc();
  await notificationRef.set({
    user_id: proposerId,
    type: 'message',
    title: `Barter Proposal ${action === 'accepted' ? 'Accepted' : 'Declined'}`,
    message: `Your barter offer of "${offerItemName}" was ${action}`,
    action_url: `/barter/${barterId}`,
    read: false,
    created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
  });
}

/**
 * Notify original proposer of counter offer
 */
async function notifyCounterOffer(
  proposerId: string,
  counterBarterId: string,
  counterItemName: string
): Promise<void> {
  const notificationRef = adminDb.collection('notifications').doc();
  await notificationRef.set({
    user_id: proposerId,
    type: 'message',
    title: 'Counter Offer Received',
    message: `You received a counter offer: "${counterItemName}"`,
    action_url: `/barter/${counterBarterId}`,
    read: false,
    created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
  });
}

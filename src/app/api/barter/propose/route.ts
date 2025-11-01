import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/barter/propose
 * Create a barter proposal (US022-AC01)
 * 
 * Acceptance Criteria:
 * - US022-AC01: Save proposal and notify recipient within 60 seconds
 * - Description ≥ 20 characters, expiry ≤ 7 days
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const {
      target_product_id, // Product they want
      offer_type, // 'product' or 'service'
      offer_item_name,
      offer_description,
      offer_estimated_value,
      offer_condition, // For products
      offer_category,
      exchange_location, // 'seller_location', 'buyer_location', 'mutual_location', 'shipping'
      proposal_expiry_days, // 1-7 days
      additional_notes,
    } = body;

    // Validation
    if (!target_product_id || !offer_type || !offer_item_name || !offer_description || !offer_estimated_value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // US022-AC01: Description ≥ 20 characters
    if (offer_description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // US022-AC01: Expiry ≤ 7 days
    const expiryDays = parseInt(proposal_expiry_days);
    if (expiryDays < 1 || expiryDays > 7) {
      return NextResponse.json(
        { error: 'Proposal expiry must be between 1 and 7 days' },
        { status: 400 }
      );
    }

    // Get target product
    const productDoc = await adminDb.collection('products').doc(target_product_id).get();
    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Target product not found' }, { status: 404 });
    }

    const productData = productDoc.data();

    // Cannot propose to your own product
    if (productData!.seller_id === userId) {
      return NextResponse.json({ error: 'Cannot propose barter for your own product' }, { status: 400 });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Create barter proposal
    const barterRef = adminDb.collection('barters').doc();
    const barterData = {
      barter_id: barterRef.id,
      proposer_id: userId,
      recipient_id: productData!.seller_id,
      target_product_id,
      target_product_title: productData!.title,
      offer_type,
      offer_item_name,
      offer_description,
      offer_estimated_value: parseFloat(offer_estimated_value),
      offer_condition: offer_type === 'product' ? offer_condition : null,
      offer_category,
      exchange_location,
      additional_notes: additional_notes || '',
      status: 'Pending', // Pending, Accepted, Declined, Cancelled, Completed
      expires_at: admin.firestore.Timestamp.fromDate(expiryDate),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await barterRef.set(barterData);

    // US022-AC01: Notify recipient within 60 seconds
    await notifyBarterProposal(
      productData!.seller_id,
      barterRef.id,
      offer_item_name,
      productData!.title
    );

    return NextResponse.json({
      success: true,
      barter_id: barterRef.id,
      status: 'Pending',
      expires_at: expiryDate.toISOString(),
      message: 'Barter proposal sent successfully',
    });

  } catch (error) {
    console.error('Barter proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to create barter proposal' },
      { status: 500 }
    );
  }
}

/**
 * Notify recipient of barter proposal
 */
async function notifyBarterProposal(
  recipientId: string,
  barterId: string,
  offerItemName: string,
  targetProductTitle: string
): Promise<void> {
  const notificationRef = adminDb.collection('notifications').doc();
  await notificationRef.set({
    user_id: recipientId,
    type: 'message',
    title: 'New Barter Proposal',
    message: `Someone wants to trade "${offerItemName}" for your "${targetProductTitle}"`,
    action_url: `/barter/${barterId}`,
    read: false,
    created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
  });
}

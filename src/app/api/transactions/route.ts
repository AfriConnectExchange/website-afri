import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * GET /api/transactions
 * Fetch transaction history for authenticated user (US023)
 * 
 * Acceptance Criteria:
 * - US023-AC01: Display cash, online, escrow, and barter transactions
 * - Sorted by date descending, paginated 20 per page, load within 2 seconds
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'payment', 'barter', 'escrow', 'all'

    // Fetch payments
    let paymentsQuery = adminDb
      .collection('payments')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc');

    const paymentsSnapshot = await paymentsQuery.get();
    const payments = paymentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      transaction_type: 'payment',
      transaction_id: doc.id,
      date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
    }));

    // Fetch barters (both as proposer and recipient)
    const bartersAsProposerSnapshot = await adminDb
      .collection('barters')
      .where('proposer_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const bartersAsRecipientSnapshot = await adminDb
      .collection('barters')
      .where('recipient_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const barters = [
      ...bartersAsProposerSnapshot.docs.map(doc => ({
        ...doc.data(),
        transaction_type: 'barter',
        transaction_id: doc.id,
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
      ...bartersAsRecipientSnapshot.docs.map(doc => ({
        ...doc.data(),
        transaction_type: 'barter',
        transaction_id: doc.id,
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
    ];

    // Fetch escrow transactions (as buyer or seller)
    const escrowsSnapshot = await adminDb
      .collection('escrow')
      .where('buyer_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const escrowsAsSellerSnapshot = await adminDb
      .collection('escrow')
      .where('seller_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const escrows = [
      ...escrowsSnapshot.docs.map(doc => ({
        ...doc.data(),
        transaction_type: 'escrow',
        transaction_id: doc.id,
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
      ...escrowsAsSellerSnapshot.docs.map(doc => ({
        ...doc.data(),
        transaction_type: 'escrow',
        transaction_id: doc.id,
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
    ];

    // Combine all transactions
    let allTransactions = [...payments, ...barters, ...escrows];

    // Filter by type if specified
    if (type && type !== 'all') {
      allTransactions = allTransactions.filter(t => t.transaction_type === type);
    }

    // US023-AC01: Sort by date descending
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: allTransactions.length,
        total_pages: Math.ceil(allTransactions.length / limit),
      },
    });

  } catch (error) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

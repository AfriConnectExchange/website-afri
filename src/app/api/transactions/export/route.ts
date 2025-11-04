
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
// Note: You may need to install puppeteer: npm install puppeteer
// import puppeteer from 'puppeteer';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/transactions/export
 * Export transaction history as CSV or PDF (US023-AC03)
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
    const { format, start_date, end_date } = body; 

    if (!format || !['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use: csv or pdf' },
        { status: 400 }
      );
    }

    const startDate = start_date ? new Date(start_date) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = end_date ? new Date(end_date) : new Date();

    const monthsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff > 12) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 12 months' },
        { status: 400 }
      );
    }

    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

    const paymentsSnapshot = await adminDb
      .collection('payments')
      .where('user_id', '==', userId)
      .where('created_at', '>=', startTimestamp)
      .where('created_at', '<=', endTimestamp)
      .orderBy('created_at', 'desc')
      .get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      type: 'Payment',
      transaction_id: doc.id,
      order_id: doc.data().order_id || 'N/A',
      method: doc.data().payment_method || 'N/A',
      amount: doc.data().amount || 0,
      currency: doc.data().currency || 'GBP',
      status: doc.data().status || 'Unknown',
      date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
    }));

    const bartersAsProposerSnapshot = await adminDb
      .collection('barters')
      .where('proposer_id', '==', userId)
      .where('created_at', '>=', startTimestamp)
      .where('created_at', '<=', endTimestamp)
      .orderBy('created_at', 'desc')
      .get();

    const bartersAsRecipientSnapshot = await adminDb
      .collection('barters')
      .where('recipient_id', '==', userId)
      .where('created_at', '>=', startTimestamp)
      .where('created_at', '<=', endTimestamp)
      .orderBy('created_at', 'desc')
      .get();

    const barters = [
      ...bartersAsProposerSnapshot.docs.map(doc => ({
        type: 'Barter',
        transaction_id: doc.id,
        order_id: 'N/A',
        method: 'Exchange',
        amount: doc.data().offer_estimated_value || 0,
        currency: 'GBP',
        status: doc.data().status || 'Unknown',
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
      ...bartersAsRecipientSnapshot.docs.map(doc => ({
        type: 'Barter',
        transaction_id: doc.id,
        order_id: 'N/A',
        method: 'Exchange',
        amount: doc.data().offer_estimated_value || 0,
        currency: 'GBP',
        status: doc.data().status || 'Unknown',
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
    ];

    const escrowsSnapshot = await adminDb
      .collection('escrow')
      .where('buyer_id', '==', userId)
      .where('created_at', '>=', startTimestamp)
      .where('created_at', '<=', endTimestamp)
      .orderBy('created_at', 'desc')
      .get();

    const escrowsAsSellerSnapshot = await adminDb
      .collection('escrow')
      .where('seller_id', '==', userId)
      .where('created_at', '>=', startTimestamp)
      .where('created_at', '<=', endTimestamp)
      .orderBy('created_at', 'desc')
      .get();

    const escrows = [
      ...escrowsSnapshot.docs.map(doc => ({
        type: 'Escrow',
        transaction_id: doc.id,
        order_id: doc.data().order_id || 'N/A',
        method: 'Escrow Payment',
        amount: doc.data().amount || 0,
        currency: doc.data().currency || 'GBP',
        status: doc.data().status || 'Unknown',
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
      ...escrowsAsSellerSnapshot.docs.map(doc => ({
        type: 'Escrow',
        transaction_id: doc.id,
        order_id: doc.data().order_id || 'N/A',
        method: 'Escrow Payment',
        amount: doc.data().amount || 0,
        currency: doc.data().currency || 'GBP',
        status: doc.data().status || 'Unknown',
        date: doc.data().created_at?.toDate().toISOString() || new Date().toISOString(),
      })),
    ];

    const allTransactions = [...payments, ...barters, ...escrows].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (format === 'csv') {
      const csv = generateCSV(allTransactions);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions_${Date.now()}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      const html = generatePDFHTML(allTransactions, userId);
      // For Vercel Serverless Functions, you might not have Puppeteer.
      // Returning HTML for the client to print is a robust alternative.
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

  } catch (error) {
    console.error('Export transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    );
  }
}

function generateCSV(transactions: any[]): string {
  const headers = ['Type', 'Transaction ID', 'Order ID', 'Method', 'Amount', 'Currency', 'Status', 'Date'];
  const rows = transactions.map(t => [
    t.type,
    t.transaction_id,
    t.order_id,
    t.method,
    t.amount.toFixed(2),
    t.currency,
    t.status,
    new Date(t.date).toLocaleDateString(),
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  return csvContent;
}

function generatePDFHTML(transactions: any[], userId: string): string {
  const rows = transactions.map(t => `
    <tr>
      <td>${t.type}</td>
      <td>${t.transaction_id}</td>
      <td>${t.order_id}</td>
      <td>${t.method}</td>
      <td>${t.currency} ${t.amount.toFixed(2)}</td>
      <td>${t.status}</td>
      <td>${new Date(t.date).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transaction History</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2C2A4A; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #F4B400; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>AfriConnect Transaction History</h1>
      <p>User ID: ${userId}</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Transaction ID</th>
            <th>Order ID</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Total Transactions: ${transactions.length}</p>
        <p>This is an official record from AfriConnect Exchange.</p>
      </div>
      
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;
}

import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * GET /api/adverts
 * List adverts with filters (US024, US025)
 * 
 * @query status - Filter by 'active', 'expired', 'all'
 * @query user_id - Filter by SME user (for manage page)
 * @query category - Filter by category
 * @query page - Page number
 * @query limit - Results per page
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const userId = searchParams.get('user_id');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query: admin.firestore.Query = adminDb.collection('adverts');

    // Filter by user (for SME manage page)
    if (userId) {
      query = query.where('user_id', '==', userId);
    }

    // Filter by status
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Filter by category
    if (category) {
      query = query.where('category', '==', category);
    }

    // Sort by creation date descending
    query = query.orderBy('created_at', 'desc');

    const snapshot = await query.get();

    // Check expiry and update if needed
    const now = new Date();
    const adverts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const expiryDate = data.expires_at?.toDate();

        // Auto-expire if past expiry date
        if (data.status === 'active' && expiryDate && now > expiryDate) {
          await doc.ref.update({
            status: 'expired',
            expired_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          return {
            ...data,
            advert_id: doc.id,
            status: 'expired',
            expired_at: now.toISOString(),
          };
        }

        return {
          ...data,
          advert_id: doc.id,
          created_at: data.created_at?.toDate().toISOString(),
          expires_at: data.expires_at?.toDate().toISOString(),
        };
      })
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAdverts = adverts.slice(startIndex, endIndex);

    return NextResponse.json({
      adverts: paginatedAdverts,
      pagination: {
        page,
        limit,
        total: adverts.length,
        total_pages: Math.ceil(adverts.length / limit),
      },
    });

  } catch (error) {
    console.error('Fetch adverts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adverts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/adverts
 * Create a new advert (US024)
 * 
 * Acceptance Criteria:
 * - US024-AC01: Save and display live within 60 seconds
 * - US024-AC02: Validate title ≥5 chars, description ≥20 chars, image ≤2MB, duration ≤30 days
 * - US024-AC03: Display as "Sponsored" in search results
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

    // Verify user is SME
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists || !['sme', 'seller', 'admin'].includes(userDoc.data()?.account_type)) {
      return NextResponse.json(
        { error: 'Only SMEs and sellers can create adverts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      images, // Array of image URLs (already uploaded to Firebase Storage)
      category,
      duration_days, // 1-30 days
      product_id, // Optional: Link to specific product
      target_url, // Optional: Custom landing URL
    } = body;

    // US024-AC02: Validation
    if (!title || title.length < 5) {
      return NextResponse.json(
        { error: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!description || description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    if (!images || images.length < 1) {
      return NextResponse.json(
        { error: 'At least 1 image is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const durationDays = parseInt(duration_days);
    if (durationDays < 1 || durationDays > 30) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 30 days' },
        { status: 400 }
      );
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    // Create advert
    const advertRef = adminDb.collection('adverts').doc();
    const advertData = {
      advert_id: advertRef.id,
      user_id: userId,
      title,
      description,
      images,
      category,
      duration_days: durationDays,
      product_id: product_id || null,
      target_url: target_url || null,
      status: 'active', // active, expired, deleted
      is_sponsored: true, // US024-AC03
      views: 0,
      clicks: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: admin.firestore.Timestamp.fromDate(expiryDate),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await advertRef.set(advertData);

    // US024-AC01: Respond within 60 seconds (instant)
    return NextResponse.json({
      success: true,
      advert_id: advertRef.id,
      status: 'active',
      expires_at: expiryDate.toISOString(),
      message: 'Advert created successfully and is now live',
    });

  } catch (error) {
    console.error('Create advert error:', error);
    return NextResponse.json(
      { error: 'Failed to create advert' },
      { status: 500 }
    );
  }
}

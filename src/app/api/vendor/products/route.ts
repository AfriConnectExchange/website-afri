
import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'

const adminDb = admin.firestore();
const adminAuth = admin.auth();


export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // Build query
    let query = adminDb.collection('products').where('seller_id', '==', userId)

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.get()
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      products = products.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate metrics
    const metrics = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      views: products.reduce((sum, p) => sum + (p.views || 0), 0),
      sales: products.filter(p => p.status === 'sold').length
    }

    return NextResponse.json({ success: true, products, metrics })
  } catch (error) {
    console.error('Vendor products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

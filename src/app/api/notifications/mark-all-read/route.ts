import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebaseAdmin'

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get all unread notifications for user
    const snapshot = await adminDb.collection('notifications')
      .where('user_id', '==', userId)
      .where('read', '==', false)
      .get()

    // Batch update
    const batch = adminDb.batch()
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        read_at: new Date().toISOString()
      })
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      count: snapshot.size
    })
  } catch (error) {
    console.error('Mark all read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}

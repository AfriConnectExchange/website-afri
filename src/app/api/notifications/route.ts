import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let query = adminDb.collection('notifications')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(50)

    if (type && type !== 'all') {
      query = query.where('type', '==', type)
    }

    const snapshot = await query.get()
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, type, title, message, action_url } = body

    // Create notification
    const notificationData = {
      user_id,
      type,
      title,
      message,
      action_url: action_url || null,
      read: false,
      created_at: new Date().toISOString(),
      delivered_at: new Date().toISOString()
    }

    const notifRef = await adminDb.collection('notifications').add(notificationData)

    // TODO: Send push notification, email, SMS based on user preferences
    // await sendPushNotification(user_id, title, message)
    // await sendEmail(user_id, title, message)
    // await sendSMS(user_id, message)

    return NextResponse.json({
      success: true,
      notification_id: notifRef.id
    })
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

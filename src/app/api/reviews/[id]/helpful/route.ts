import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await adminDb.collection('reviews').doc(params.id).update({
      helpful_count: FieldValue.increment(1)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Helpful error:', error)
    return NextResponse.json({ error: 'Failed to mark as helpful' }, { status: 500 })
  }
}

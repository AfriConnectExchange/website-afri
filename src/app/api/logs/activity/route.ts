import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const event_type = body?.event_type || body?.type || 'visit'
    const payload = body?.payload ?? null

    const ua = req.headers.get('user-agent') || null
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null

    // Try to resolve a signed-in user via NextAuth session (optional)
    let userId: string | null = null
    try {
      const session = (await getServerSession(authOptions as any)) as any
      if (session?.user?.id) userId = session.user.id
    } catch (e) {
      // ignore — session optional for activity logs
      userId = null
    }

    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: event_type,
        changes: payload as any,
        ipAddress: ip || null,
        userAgent: ua || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getServerAuthSession } from '../../../../lib/get-server-session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const event_type = body?.event_type || body?.type || 'visit'
    const payload = body?.payload ?? null

    const ua = req.headers.get('user-agent') || null
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null

    const resolved = await getServerAuthSession(req);

    await prisma.activityLog.create({
      data: {
        userId: resolved?.userId ?? null,
        sessionId: resolved?.sessionId ?? null,
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

import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

const isAllowed = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_SEED === 'true'

export async function GET(req: Request) {
  if (!isAllowed) return NextResponse.json({ error: 'not-allowed' }, { status: 403 })

  try {
    const data = await prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    return NextResponse.json({ ok: true, logs: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}

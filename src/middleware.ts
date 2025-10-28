import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(_request: NextRequest) {
    // Session handling migrated to Firebase; keep this middleware as a passthrough
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
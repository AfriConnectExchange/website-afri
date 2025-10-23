import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Supabase middleware removed — preserve a pass-through middleware so
    // existing route matcher behavior continues to work.
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
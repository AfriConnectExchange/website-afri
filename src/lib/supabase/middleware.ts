// REMOVED: Supabase middleware cleared. Export a fallback that indicates
// Supabase is not available.

import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  throw new Error('updateSession is unavailable: Supabase backend removed.');
}
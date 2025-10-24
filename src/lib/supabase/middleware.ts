import { NextResponse } from "next/server";

// Stub updateSession middleware replacement. The original project used the
// Supabase middleware to sync cookies and sessions. If you want to fully
// remove Supabase, this file avoids importing any Supabase code and simply
// forwards the request. It intentionally does not modify cookies.

export async function updateSession(request: Request) {
  // No-op: keep existing middleware chain working.
  return NextResponse.next();
}

export default updateSession;

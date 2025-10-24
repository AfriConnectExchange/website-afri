import { type NextRequest } from "next/server"
import { updateSession } from "./lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Delegate to `updateSession` which handles creating the server client,
  // syncing cookies onto the NextResponse, and returning the response.
  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

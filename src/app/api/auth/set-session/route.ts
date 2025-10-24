import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

interface Body {
  access_token?: string | null
  refresh_token?: string | null
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json()

    const access_token = body.access_token ?? null
    const refresh_token = body.refresh_token ?? null

    if (!access_token || !refresh_token) {
      return NextResponse.json({ ok: false, error: "Missing tokens" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // setSession will cause the SSR client to emit Set-Cookie instructions
    // which the server's cookie store will apply to the outgoing response.
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })

    if (error) {
      console.error("[v0] Failed to set session on server:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[v0] set-session error:", err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}

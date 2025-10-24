import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle errors
            }
          },
        },
      },
    )

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        {
          valid: false,
          error: sessionError?.message || "No session found",
          session: null,
          user: null,
        },
        { status: 401 },
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          valid: false,
          error: userError?.message || "User not found",
          session: {
            access_token: session.access_token ? "***" : null,
            refresh_token: session.refresh_token ? "***" : null,
            expires_at: session.expires_at,
            user_id: session.user?.id,
          },
          user: null,
        },
        { status: 401 },
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    const { data: onboarding, error: onboardingError } = await supabase
      .from("user_onboarding_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    return NextResponse.json({
      valid: true,
      session: {
        access_token: session.access_token ? "***" : null,
        refresh_token: session.refresh_token ? "***" : null,
        expires_at: session.expires_at,
        user_id: session.user?.id,
      },
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: {
        data: profile,
        error: profileError?.message,
      },
      onboarding: {
        data: onboarding,
        error: onboardingError?.message,
      },
    })
  } catch (error) {
    console.error("[v0] Session verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

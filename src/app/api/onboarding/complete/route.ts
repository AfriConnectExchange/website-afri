import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity-logger"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("[v0] Auth error:", userError.message)
      return NextResponse.json({ error: "Authentication failed", details: userError.message }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] No user found in session")
      return NextResponse.json({ error: "No authenticated user found" }, { status: 401 })
    }

    console.log("[v0] Authenticated user:", user.id)

    // Mark onboarding as complete
    const { error: onboardingError } = await supabase.from("user_onboarding_progress").upsert(
      {
        user_id: user.id,
        walkthrough_completed: true,
        completed_steps: ["welcome", "role_selection", "personal_details"],
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (onboardingError) {
      console.error("[v0] Onboarding error:", onboardingError)
      return NextResponse.json(
        { error: "Failed to complete onboarding", details: onboardingError.message },
        { status: 500 },
      )
    }

    // Log activity
    await logActivity({
      user_id: user.id,
      action: "onboarding_completed",
      entity_type: "user_onboarding_progress",
      entity_id: user.id,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[v0] Onboarding complete error:", err)
    return NextResponse.json(
      { error: "Invalid request", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    )
  }
}

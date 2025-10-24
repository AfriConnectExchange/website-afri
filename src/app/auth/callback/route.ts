import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createServerClient()
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError)
      return NextResponse.redirect(new URL("/auth/signin?error=auth_error", request.url))
    }

    const user = sessionData.user

    if (user) {
      // Create or update user profile in public.users table
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error checking user existence:", fetchError)
      }

      if (!existingUser) {
        // New user - create profile
        const { error: createError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
          profile_picture_url: user.user_metadata?.avatar_url,
          roles: ["buyer"],
          status: "pending",
          verification_status: "unverified",
          email_verified: user.email_confirmed_at ? true : false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (createError) {
          console.error("Error creating user profile:", createError)
        }

        // Create onboarding progress record for new user
        const { error: onboardingError } = await supabase.from("user_onboarding_progress").insert({
          user_id: user.id,
          walkthrough_completed: false,
          completed_steps: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (onboardingError) {
          console.error("Error creating onboarding progress:", onboardingError)
        }
      }

      // Log sign-in activity
      await logActivity({
        user_id: user.id,
        action: "user_signed_in",
        entity_type: "user_session",
        entity_id: user.id,
        ip_address: request.headers.get("x-forwarded-for"),
        user_agent: request.headers.get("user-agent"),
      })

      // Check if onboarding is complete
      const { data: onboardingProgress, error: onboardingError } = await supabase
        .from("user_onboarding_progress")
        .select("walkthrough_completed")
        .eq("user_id", user.id)
        .single()

      if (onboardingError && onboardingError.code !== "PGRST116") {
        console.error("Error fetching onboarding progress:", onboardingError)
      }

      if (!onboardingProgress || !onboardingProgress.walkthrough_completed) {
        // New user or incomplete onboarding, redirect to onboarding flow
        return NextResponse.redirect(new URL("/onboarding", request.url))
      }
    }

    // Existing user with completed onboarding, redirect to the app
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If no code is provided, redirect to login
  return NextResponse.redirect(new URL("/auth/signin", request.url))
}

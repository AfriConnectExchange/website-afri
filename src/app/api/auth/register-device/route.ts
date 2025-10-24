import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity-logger"

interface RegisterDevicePayload {
  device_id: string
  device_type: string
  device_name: string
  browser: string
  os: string
  ip_address?: string | null
  user_agent: string
  location_data?: Record<string, any> | null
  session_token: string
  refresh_token: string
  fingerprint?: string
}

export async function POST(req: Request) {
  try {
    const body: RegisterDevicePayload = await req.json()
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

    // Extract IP from headers
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    // Register device
    // Defensive: truncate values to match DB column sizes to avoid errors
    const safeDeviceType = body.device_type ? String(body.device_type).slice(0, 50) : null
    const safeDeviceName = body.device_name ? String(body.device_name).slice(0, 255) : null
    const safePlatform = body.os ? String(body.os).slice(0, 50) : null
    const safeOsName = body.os ? String(body.os).slice(0, 100) : null
    const safeBrowserName = body.browser ? String(body.browser).slice(0, 100) : null
    const safeUserAgent = body.user_agent ? String(body.user_agent) : null

    const { data: deviceData, error: deviceError } = await supabase
      .from("device_info")
      .upsert(
        {
          user_id: user.id,
          device_id: body.device_id,
          device_type: safeDeviceType,
          device_name: safeDeviceName,
          platform: safePlatform,
          os_name: safeOsName,
          browser_name: safeBrowserName,
          ip_address: ip,
          user_agent: safeUserAgent,
          fingerprint_hash: body.fingerprint ? Buffer.from(body.fingerprint).toString("base64") : null,
          last_authenticated_at: new Date().toISOString(),
          is_trusted: false,
        },
        { onConflict: "device_id" },
      )
      .select()
      .single()

    if (deviceError) {
      console.error("[v0] Device registration error:", deviceError)
      return NextResponse.json({ error: "Failed to register device", details: deviceError.message }, { status: 500 })
    }

    // Create user session
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .insert({
        user_id: user.id,
        device_id: body.device_id,
        device_type: safeDeviceType,
        device_name: safeDeviceName,
        browser: safeBrowserName,
        os: safeOsName,
        ip_address: ip,
        user_agent: safeUserAgent,
        location_data: body.location_data,
        session_token_hash: Buffer.from(body.session_token).toString("base64"),
        refresh_token_hash: Buffer.from(body.refresh_token).toString("base64"),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("[v0] Session creation error:", sessionError)
      return NextResponse.json({ error: "Failed to create session", details: sessionError.message }, { status: 500 })
    }

    // Log activity
    await logActivity({
      user_id: user.id,
      action: "device_registered",
      entity_type: "device_info",
      entity_id: deviceData?.id,
      ip_address: ip,
      user_agent: body.user_agent,
    })

    return NextResponse.json({
      ok: true,
      device_id: deviceData?.id,
      session_id: sessionData?.id,
    })
  } catch (err) {
    console.error("[v0] Register device error:", err)
    return NextResponse.json(
      { error: "Invalid request", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    )
  }
}

"use server"

import { createServerClient } from "./supabase/server"

interface ActivityLogPayload {
  user_id?: string | null
  action: string
  entity_type?: string
  entity_id?: string
  changes?: Record<string, any>
  ip_address?: string | null
  user_agent?: string | null
}

export async function logActivity(payload: ActivityLogPayload) {
  try {
    const supabase = await createServerClient()

    // Log to database
    const { error } = await supabase.from("activity_logs").insert({
      user_id: payload.user_id,
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      changes: payload.changes,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[activity-log] Database error:", error)
    }
  } catch (err) {
    console.error("[activity-log] Failed to log activity:", err)
  }
}

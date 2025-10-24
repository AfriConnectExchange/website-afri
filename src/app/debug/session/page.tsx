"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"

interface SessionData {
  valid: boolean
  error?: string
  session?: {
    access_token: string | null
    refresh_token: string | null
    expires_at: number | null
    user_id: string | null
  }
  user?: {
    id: string
    email: string
    created_at: string
  }
  profile?: {
    data: any
    error?: string
  }
  onboarding?: {
    data: any
    error?: string
  }
}

export default function SessionDebugPage() {
  const { user, profile, isOnboardingComplete, isLoading } = useAuth()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    const verifySession = async () => {
      try {
        addLog("Verifying session...")
        const response = await fetch("/api/auth/verify-session", {
          credentials: "include",
        })

        const data = await response.json()
        setSessionData(data)

        if (data.valid) {
          addLog("✓ Session is valid")
          addLog(`User ID: ${data.user?.id}`)
          addLog(`Email: ${data.user?.email}`)
          if (data.profile?.data) {
            addLog(`✓ Profile found: ${data.profile.data.full_name}`)
          } else {
            addLog(`✗ Profile not found: ${data.profile?.error}`)
          }
          if (data.onboarding?.data) {
            addLog(`✓ Onboarding status: ${data.onboarding.data.walkthrough_completed ? "Complete" : "Incomplete"}`)
          } else {
            addLog(`✗ Onboarding not found: ${data.onboarding?.error}`)
          }
        } else {
          addLog(`✗ Session invalid: ${data.error}`)
        }
      } catch (error) {
        addLog(`✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Debug Page</h1>

        {/* Auth Context Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Context Status</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-400">Loading:</span> {isLoading ? "true" : "false"}
            </div>
            <div>
              <span className="text-gray-400">User ID:</span> {user?.id || "null"}
            </div>
            <div>
              <span className="text-gray-400">Email:</span> {user?.email || "null"}
            </div>
            <div>
              <span className="text-gray-400">Profile:</span> {profile ? JSON.stringify(profile) : "null"}
            </div>
            <div>
              <span className="text-gray-400">Onboarding Complete:</span> {isOnboardingComplete ? "true" : "false"}
            </div>
          </div>
        </div>

        {/* Session Verification */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Verification</h2>
          {loading ? (
            <div className="text-gray-400">Verifying...</div>
          ) : sessionData ? (
            <div className="space-y-2 font-mono text-sm">
              <div>
                <span className="text-gray-400">Valid:</span>{" "}
                <span className={sessionData.valid ? "text-green-400" : "text-red-400"}>
                  {sessionData.valid ? "true" : "false"}
                </span>
              </div>
              {sessionData.error && (
                <div>
                  <span className="text-gray-400">Error:</span>{" "}
                  <span className="text-red-400">{sessionData.error}</span>
                </div>
              )}
              {sessionData.session && (
                <>
                  <div>
                    <span className="text-gray-400">Access Token:</span> {sessionData.session.access_token}
                  </div>
                  <div>
                    <span className="text-gray-400">Refresh Token:</span> {sessionData.session.refresh_token}
                  </div>
                  <div>
                    <span className="text-gray-400">Expires At:</span> {sessionData.session.expires_at}
                  </div>
                </>
              )}
              {sessionData.profile && (
                <div>
                  <span className="text-gray-400">Profile Error:</span>{" "}
                  <span className={sessionData.profile.error ? "text-red-400" : "text-green-400"}>
                    {sessionData.profile.error || "No error"}
                  </span>
                </div>
              )}
              {sessionData.onboarding && (
                <div>
                  <span className="text-gray-400">Onboarding Error:</span>{" "}
                  <span className={sessionData.onboarding.error ? "text-red-400" : "text-green-400"}>
                    {sessionData.onboarding.error || "No error"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400">No data</div>
          )}
        </div>

        {/* Live Logs */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Live Logs</h2>
          <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

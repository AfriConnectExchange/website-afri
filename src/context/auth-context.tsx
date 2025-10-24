"use client"

import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from 'next/navigation'
import { createSPAClient } from "@/lib/supabase/client"
import type { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  roles: string[]
  avatar_url?: string
  status?: string
}

interface AuthContextType {
  isLoading: boolean
  user: SupabaseUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isOnboardingComplete: boolean
  login: (emailOrOptions: string | { email: string; password?: string }, password?: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<SupabaseUser>) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  sendPasswordResetEmail: (email: string) => Promise<void>
  resetPassword: (password: string) => Promise<void>
  handleNeedsOtp: (phone: string, resend: () => Promise<void>) => void
  handleOtpSuccess: (user: SupabaseUser) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSPAClient(), [])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        const { data: userProfile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle()

        if (error) {
          console.error("[v0] Error fetching user profile:", error)
          return null
        }

        return userProfile as UserProfile | null
      } catch (err) {
        console.error("[v0] Failed to fetch user profile:", err)
        return null
      }
    },
    [supabase],
  )

  const checkOnboardingStatus = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const { data: onboarding, error } = await supabase
          .from("user_onboarding_progress")
          .select("walkthrough_completed")
          .eq("user_id", userId)
          .maybeSingle()

        if (error) {
          console.error("[v0] Error checking onboarding:", error)
          return false
        }

        return onboarding?.walkthrough_completed ?? false
      } catch (err) {
        console.error("[v0] Failed to check onboarding status:", err)
        return false
      }
    },
    [supabase],
  )

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)

          const isComplete = await checkOnboardingStatus(session.user.id)
          setIsOnboardingComplete(isComplete)
        }
      } catch (err) {
        console.error("[v0] Failed to initialize auth:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)

        const isComplete = await checkOnboardingStatus(session.user.id)
        setIsOnboardingComplete(isComplete)

        // If the sign-in happened from an auth page (signin/signup), navigate
        // the user to the appropriate next step. We avoid forcing navigation
        // when the user signed in from elsewhere (so we don't interrupt flows).
        try {
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname || ""
            const fromAuthPage = currentPath.startsWith("/auth") || currentPath === "/auth" || currentPath === "/auth/signin"

            if (fromAuthPage) {
              if (!userProfile || !isComplete) {
                console.debug("[v0] Redirecting to onboarding after sign-in")
                router.push("/onboarding")
              } else {
                console.debug("[v0] Redirecting to home after sign-in")
                router.push("/")
              }
            }
          }
        } catch (err) {
          console.warn("[v0] Navigation after sign-in failed:", err)
        }

        try {
          // Ensure the server has HttpOnly auth cookies so server-side
          // endpoints can read the session. The SPA client stores the
          // session in localStorage by default, so we POST the tokens to
          // a server route which will set the cookies via the SSR client.
          if (session.access_token && session.refresh_token) {
            try {
              // Await to ensure server cookies are set before subsequent
              // server-side requests (like register-device or verify-session)
              const res = await fetch("/api/auth/set-session", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                }),
              })

              if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                console.warn("[v0] set-session returned non-ok status:", res.status, body)
              }
            } catch (err) {
              console.warn("[v0] set-session failed (non-critical):", err)
            }
          }

          const fingerprint =
            typeof window !== "undefined"
              ? localStorage.getItem("device_fingerprint") ||
                (() => {
                  const v = crypto.getRandomValues(new Uint32Array(4)).join("-")
                  localStorage.setItem("device_fingerprint", v)
                  return v
                })()
              : null

          await fetch("/api/auth/register-device", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              device_id: fingerprint,
              device_type: navigator?.platform || "web",
              device_name: navigator?.platform || "web",
              browser: navigator?.userAgent || "",
              os: navigator?.platform || "",
              ip_address: null,
              user_agent: navigator?.userAgent || "",
              location_data: null,
              remember: false,
              session_token: session.access_token,
              refresh_token: session.refresh_token,
              fingerprint,
            }),
          }).catch((err) => {
            console.warn("[v0] Device registration failed (non-critical):", err)
          })
        } catch (err) {
          console.warn("[v0] Device registration error:", err)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setIsOnboardingComplete(false)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile, checkOnboardingStatus])

  const login = useCallback(
    async (emailOrOptions: string | { email: string; password?: string }, password?: string) => {
      let email: string
      let pwd: string | undefined
      if (typeof emailOrOptions === "string") {
        email = emailOrOptions
        pwd = password
      } else {
        email = emailOrOptions.email
        pwd = emailOrOptions.password
      }
      // Debug: log sign-in attempt and result to help diagnose hanging calls
      console.debug("[v0] Attempting signInWithPassword for:", email)

      try {
        const result = await supabase.auth.signInWithPassword({ email, password: pwd ?? "" })
        console.debug("[v0] signInWithPassword result:", result)

        const { error } = result
        if (error) {
          console.error("[v0] signInWithPassword error:", error)
          throw new Error(error.message)
        }
      } catch (err) {
        console.error("[v0] signInWithPassword threw:", err)
        throw err
      }
    },
    [supabase],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        throw new Error(error.message)
      }
    },
    [supabase],
  )

  const sendPasswordResetEmail = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        throw new Error(error.message)
      }
    },
    [supabase],
  )

  const resetPassword = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        throw new Error(error.message)
      }
    },
    [supabase],
  )

  const logout = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("device_fingerprint")
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      setUser(null)
      setProfile(null)
      setIsOnboardingComplete(false)
      router.push("/auth/signin")

      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      })
    } catch (err) {
      console.error("[v0] Logout failed:", err)
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Failed to sign out. Please try again.",
      })
    }
  }, [supabase, router, toast])

  const updateUser = useCallback(
    async (data: Partial<SupabaseUser>) => {
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase.auth.updateUser(data)
      if (error) throw new Error(error.message)
    },
    [user, supabase],
  )

  const handleNeedsOtp = (phone: string, resend: () => Promise<void>) => {
    console.log("OTP needed for:", phone)
  }

  const handleOtpSuccess = (user: SupabaseUser) => {
    setUser(user)
  }

  const value = useMemo(
    () => ({
      isLoading,
      user,
      profile,
      isAuthenticated: !!user,
      isOnboardingComplete,
      login,
      logout,
      updateUser,
      signUp,
      sendPasswordResetEmail,
      resetPassword,
      handleNeedsOtp,
      handleOtpSuccess,
    }),
    [
      isLoading,
      user,
      profile,
      isOnboardingComplete,
      login,
      logout,
      updateUser,
      signUp,
      sendPasswordResetEmail,
      resetPassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

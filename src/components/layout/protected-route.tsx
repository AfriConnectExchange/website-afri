"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Spinner } from "@/components/ui/spinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, isOnboardingComplete } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push("/auth/signin")
      return
    }

    if (requireOnboarding && !isOnboardingComplete) {
      router.push("/onboarding")
      return
    }

    if (!requireOnboarding && !isOnboardingComplete) {
      router.push("/onboarding?redirect=true")
      return
    }
  }, [isLoading, isAuthenticated, isOnboardingComplete, requireOnboarding, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!requireOnboarding && !isOnboardingComplete) {
    return null
  }

  return <>{children}</>
}

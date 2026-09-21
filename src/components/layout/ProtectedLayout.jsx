"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardShell from "./DashboardShell"
import { useAuth } from "@/components/providers/AppProvider"

export default function ProtectedLayout({ children }) {
  const router = useRouter()
  const { ready, currentUser } = useAuth()

  useEffect(() => {
    if (ready && !currentUser) {
      router.replace("/login")
    }
  }, [ready, currentUser, router])

  if (!ready || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg-main)] text-[color:var(--text-secondary)]">
        Loading secure workspace...
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}

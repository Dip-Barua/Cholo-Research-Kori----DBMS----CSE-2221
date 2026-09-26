"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AppProvider"
import SectionPage from "@/components/pages/SectionPage"

export default function Page() {
  const router = useRouter()
  const { currentUser, ready } = useAuth()

  useEffect(() => {
    if (ready && currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [currentUser, ready, router])

  if (!ready || !currentUser) {
    return null
  }

  if (currentUser.role !== "admin") {
    return null
  }

  return <SectionPage section="admin" />
}

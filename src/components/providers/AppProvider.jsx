"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { authService, notificationService, settingsService, userService } from "@/lib/services"
import { getDatabase, hydrateDatabase, hydrateSession, getSession } from "@/lib/storage/storage"

const AuthContext = createContext(null)

const emptyState = {
  users: [],
  projects: [],
  labs: [],
  collaborationRequests: [],
  collaborations: [],
  conversations: [],
  messages: [],
  tasks: [],
  milestones: [],
  publications: [],
  notifications: [],
  settings: {},
}

async function safeJson(response) {
  if (!response) return null

  if (typeof response === "string") {
    try {
      return JSON.parse(response)
    } catch {
      return null
    }
  }

  if (typeof response === "object") {
    if (typeof response.json === "function") {
      try {
        return await response.json()
      } catch {
        try {
          const text = await response.text()
          if (!text) return null
          return JSON.parse(text)
        } catch {
          return null
        }
      }
    }

    if (typeof response.text === "function") {
      try {
        const text = await response.text()
        if (!text) return null
        return JSON.parse(text)
      } catch {
        return null
      }
    }

    return response
  }

  return null
}

function AppProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

function AuthProvider({ children }) {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [dbVersion, setDbVersion] = useState(0)

  const applyServerState = (state, userOverride) => {
    const normalizedState = state || emptyState
    hydrateDatabase(normalizedState)
    setDbVersion((version) => version + 1)

    const nextSession = getSession()
    const resolvedUser = userOverride !== undefined
      ? userOverride
      : (nextSession.currentUserId ? userService.getUser(nextSession.currentUserId) : null)

    setSession(nextSession)
    setCurrentUser(resolvedUser)
    return resolvedUser
  }

  useEffect(() => {
    let active = true

    const sync = async () => {
      const [bootstrapResponse, meResponse] = await Promise.all([
        fetch("/api/bootstrap"),
        fetch("/api/auth/me"),
      ])

      const bootstrap = (await safeJson(bootstrapResponse)) || { state: emptyState }
      const sessionPayload = (await safeJson(meResponse)) || { user: null, state: emptyState }

      if (!active) return

      hydrateSession({ currentUserId: sessionPayload.user?.id || null })
      applyServerState(bootstrap.state || sessionPayload.state || emptyState, sessionPayload.user || null)
      setReady(true)
    }

    sync().catch(() => setReady(true))

    const syncOnChange = () => {
      const nextSession = getSession()
      const user = nextSession.currentUserId ? userService.getUser(nextSession.currentUserId) : null
      setSession(nextSession)
      setCurrentUser(user)
      setDbVersion((version) => version + 1)
    }

    window.addEventListener("cholo-storage-change", syncOnChange)
    return () => {
      active = false
      window.removeEventListener("cholo-storage-change", syncOnChange)
    }
  }, [])

  useEffect(() => {
    if (!ready) return undefined

    let active = true

    const pollServerState = async () => {
      try {
        const response = await fetch("/api/bootstrap", { cache: "no-store" })
        const payload = (await safeJson(response)) || { state: emptyState }
        if (!active || !payload.state) return

        const local = getDatabase() || emptyState
        const serverTime = new Date(payload.state.updatedAt || 0).getTime()
        const localTime = new Date(local.updatedAt || 0).getTime()
        if (serverTime > localTime + 500) {
          const mergedNotifications = (payload.state.notifications || []).map((notification) => {
            const localNotification = (local.notifications || []).find((item) => item.id === notification.id)
            if (localNotification?.read && !notification.read) {
              return { ...notification, read: true }
            }
            return notification
          })
          applyServerState({ ...payload.state, notifications: mergedNotifications })
        }
      } catch {
        // ignore transient polling errors
      }
    }

    const intervalId = window.setInterval(pollServerState, 2000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [ready])

  const authActions = useMemo(() => ({
    login: async (credentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      const payload = (await safeJson(response)) || { error: "Login failed" }
      if (!response.ok) {
        throw new Error(payload.error || "Login failed")
      }

      hydrateSession({ currentUserId: payload.user?.id || null })
      applyServerState(payload.state || emptyState, payload.user || null)
      return payload.user
    },
    register: async (payload) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await safeJson(response)) || { error: "Registration failed" }
      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      hydrateSession({ currentUserId: data.user?.id || null })
      applyServerState(data.state || emptyState, data.user || null)
      return data.user
    },
    logout: async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" })
      } catch {
        // ignore logout API errors, still clear client-side session
      }

      authService.logout()
      setSession({ currentUserId: null })
      setCurrentUser(null)
      router.push("/login")
    },
    refreshUser: async () => {
      const meResponse = await fetch("/api/auth/me")
      const mePayload = (await safeJson(meResponse)) || { user: null, state: getDatabase() || emptyState }
      hydrateSession({ currentUserId: mePayload.user?.id || null })
      applyServerState(mePayload.state || getDatabase() || emptyState, mePayload.user || null)
      return mePayload.user || null
    },
    syncFromServer: async () => {
      const bootstrapResponse = await fetch("/api/bootstrap", { cache: "no-store" })
      const bootstrap = (await safeJson(bootstrapResponse)) || { state: getDatabase() || emptyState }
      applyServerState(bootstrap.state || emptyState)
      return bootstrap.state || emptyState
    },
    updateProfile: async (updates) => {
      if (!currentUser) throw new Error("No active session")
      const user = userService.updateProfile(currentUser.id, updates)
      setCurrentUser(user)
      setDbVersion((version) => version + 1)
      return user
    },
    updateSettings: async (updates) => {
      if (!currentUser) throw new Error("No active session")
      settingsService.updateSettings(currentUser.id, updates)
      return settingsService.getSettings(currentUser.id)
    },
  }), [currentUser, router])

  const value = useMemo(() => ({
    ready,
    session,
    currentUser,
    dbVersion,
    unreadCount: currentUser ? notificationService.getUnreadNotificationCount(currentUser.id) : 0,
    ...authActions,
  }), [ready, session, currentUser, dbVersion, authActions])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AppProvider")
  return context
}

export { AppProvider, AuthProvider, useAuth }

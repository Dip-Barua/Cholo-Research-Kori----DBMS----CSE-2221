import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loadAppState, saveAppState } from "@/lib/server/state"

function nowIso() {
  return new Date().toISOString()
}

export async function POST(request) {
  try {
    const payload = await request.json()
    const state = await loadAppState()
    const duplicate = state.users.some((user) => user.email.toLowerCase() === String(payload.email || "").toLowerCase())

    if (duplicate) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const user = {
      id: `user-${Math.random().toString(36).slice(2, 10)}`,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      university: payload.university,
      department: payload.department,
      role: "researcher",
      bio: "",
      researchInterests: [],
      skills: [],
      avatarSeed: String(payload.name || "CR").slice(0, 2).toUpperCase(),
      joinedAt: nowIso(),
      active: true,
    }

    state.users.push(user)
    state.settings[user.id] = {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    }

    await saveAppState(state)

    const cookieStore = await cookies()
    cookieStore.set("cholo_session", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })

    return NextResponse.json({ user, state })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 })
  }
}

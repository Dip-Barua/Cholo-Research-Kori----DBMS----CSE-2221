import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loadAppState } from "@/lib/server/state"

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const state = await loadAppState()
    const user = state.users.find((item) => item.email.toLowerCase() === String(email || "").toLowerCase() && item.password === password && item.active !== false)

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("cholo_session", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })

    return NextResponse.json({ user, state })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 })
  }
}

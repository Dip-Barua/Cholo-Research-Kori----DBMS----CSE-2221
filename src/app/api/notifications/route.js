import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  markAllNotificationsReadOnState,
  markNotificationReadOnState,
} from "@/lib/notification-mutations"
import { loadAppState, saveAppState } from "@/lib/server/state"

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("cholo_session")?.value || null
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const state = await loadAppState()

    if (body.action === "markAllRead") {
      markAllNotificationsReadOnState(state, userId)
    } else if (body.action === "markRead" && body.notificationId) {
      markNotificationReadOnState(state, body.notificationId, userId)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await saveAppState(state)
    return NextResponse.json({ state, ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not update notifications" }, { status: 400 })
  }
}

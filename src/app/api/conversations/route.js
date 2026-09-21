import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  ensureDirectConversation,
  ensureLabConversation,
  ensureProjectConversation,
} from "@/lib/message-mutations"
import { isConnected } from "@/lib/connections"
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
    let conversation = null

    if (body.type === "direct" && body.otherUserId) {
      if (!isConnected(() => state, userId, body.otherUserId)) {
        return NextResponse.json({ error: "You must be connected before starting a direct message" }, { status: 403 })
      }
      conversation = ensureDirectConversation(state, userId, body.otherUserId)
    } else if (body.type === "project" && body.projectId) {
      conversation = ensureProjectConversation(state, body.projectId)
    } else if (body.type === "lab" && body.labId) {
      conversation = ensureLabConversation(state, body.labId)
    } else {
      return NextResponse.json({ error: "Invalid conversation request" }, { status: 400 })
    }

    if (!conversation.participantIds.includes(userId)) {
      return NextResponse.json({ error: "Not authorized for this conversation" }, { status: 403 })
    }

    await saveAppState(state)
    return NextResponse.json({ state, conversation })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not open conversation" }, { status: 400 })
  }
}

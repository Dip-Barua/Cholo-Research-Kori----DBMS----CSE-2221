import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sendCollaborationRequestOnState } from "@/lib/collaboration-mutations"
import { loadAppState, saveAppState } from "@/lib/server/state"

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const senderId = cookieStore.get("cholo_session")?.value || null
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const receiverId = body.receiverId
    const message = body.message || ""
    const projectId = body.projectId ?? null
    const labId = body.labId ?? null

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 })
    }
    if (!message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const state = await loadAppState()
    const createdRequest = sendCollaborationRequestOnState(state, {
      senderId,
      receiverId,
      projectId,
      labId,
      message: message.trim(),
    })

    await saveAppState(state)
    return NextResponse.json({ state, request: createdRequest })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not send request" }, { status: 400 })
  }
}

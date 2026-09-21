import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sendMessageOnState } from "@/lib/message-mutations"
import { loadAppState, saveAppState } from "@/lib/server/state"

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const senderId = cookieStore.get("cholo_session")?.value || null
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const state = await loadAppState()
    const result = sendMessageOnState(state, {
      senderId,
      content: body.content,
      receiverId: body.receiverId || null,
      conversationId: body.conversationId || null,
    })

    await saveAppState(state)
    return NextResponse.json({ state, message: result.message, conversation: result.conversation })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not send message" }, { status: 400 })
  }
}

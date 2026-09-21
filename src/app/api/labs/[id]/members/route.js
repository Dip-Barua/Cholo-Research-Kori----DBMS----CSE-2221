import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loadAppState, saveAppState } from "@/lib/server/state"
import { ensureLabConversation } from "@/lib/message-mutations"

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const nowIso = () => new Date().toISOString()

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const actorId = cookieStore.get("cholo_session")?.value || null
    if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolved = await params
    const labId = resolved?.id
    if (!labId) return NextResponse.json({ error: "Missing lab id" }, { status: 400 })

    const body = await request.json()
    const userId = body?.userId
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const state = await loadAppState()
    const lab = state.labs.find((l) => l.id === labId)
    if (!lab) return NextResponse.json({ error: "Lab not found" }, { status: 404 })

    const actor = state.users.find((u) => u.id === actorId)
    if (lab.supervisorId !== actorId && actor?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const user = state.users.find((u) => u.id === userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    lab.memberIds = lab.memberIds || []
    if (!lab.memberIds.includes(userId)) {
      lab.memberIds.push(userId)
    }

    const conversation = ensureLabConversation(state, labId)
    conversation.participantIds = conversation.participantIds || []
    if (!conversation.participantIds.includes(userId)) conversation.participantIds.push(userId)

    state.notifications = state.notifications || []
    state.notifications.unshift({
      id: idFrom("notification"),
      userId,
      type: "lab_invite",
      title: "Added to research lab",
      message: `You were added to ${lab.name}.`,
      read: false,
      relatedId: labId,
      href: `/labs/${labId}`,
      createdAt: nowIso(),
    })

    await saveAppState(state)
    return NextResponse.json({ state, lab })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not add member" }, { status: 500 })
  }
}

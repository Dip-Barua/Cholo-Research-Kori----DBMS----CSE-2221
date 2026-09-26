import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loadAppState, saveAppState } from "@/lib/server/state"
import { ensureProjectConversation } from "@/lib/message-mutations"

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const nowIso = () => new Date().toISOString()

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const actorId = cookieStore.get("cholo_session")?.value || null
    if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolved = await params
    const projectId = resolved?.id
    if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 })

    const body = await request.json()
    const userId = body?.userId
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const state = await loadAppState()
    const project = state.projects.find((p) => p.id === projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    const actor = state.users.find((u) => u.id === actorId)
    if (project.supervisorId !== actorId && actor?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const user = state.users.find((u) => u.id === userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    project.memberIds = project.memberIds || []
    if (!project.memberIds.includes(userId)) project.memberIds.push(userId)

    const conversation = ensureProjectConversation(state, projectId)
    conversation.participantIds = conversation.participantIds || []
    if (!conversation.participantIds.includes(userId)) conversation.participantIds.push(userId)

    state.notifications = state.notifications || []
    state.notifications.unshift({
      id: idFrom("notification"),
      userId,
      type: "project_invite",
      title: "Added to project",
      message: `You were added to ${project.title}.`,
      read: false,
      relatedId: projectId,
      href: `/projects/${projectId}`,
      createdAt: nowIso(),
    })

    await saveAppState(state)
    return NextResponse.json({ state, project })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not add member" }, { status: 500 })
  }
}

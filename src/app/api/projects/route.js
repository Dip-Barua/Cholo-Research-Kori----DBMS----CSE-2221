import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loadAppState, saveAppState } from "@/lib/server/state"
import { ensureProjectConversation } from "@/lib/message-mutations"

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const nowIso = () => new Date().toISOString()

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const actorId = cookieStore.get("cholo_session")?.value || null
    if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!body || !body.title || !body.labId) {
      return NextResponse.json({ error: "Missing required project fields" }, { status: 400 })
    }

    const state = await loadAppState()
    const lab = state.labs.find((l) => l.id === body.labId)
    if (!lab) return NextResponse.json({ error: "Lab not found" }, { status: 404 })
    if (lab.supervisorId !== actorId && state.users.find((u) => u.id === actorId)?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized to create project for this lab" }, { status: 403 })
    }

    const project = {
      id: idFrom("project"),
      title: body.title,
      description: body.description || "",
      supervisorId: actorId,
      memberIds: [actorId],
      field: body.field || "",
      skills: Array.isArray(body.skills) ? body.skills : (typeof body.skills === 'string' ? body.skills.split(',').map(s=>s.trim()).filter(Boolean) : []),
      status: body.status || "Recruiting",
      progress: body.progress || 0,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      createdAt: nowIso(),
      labId: body.labId,
      maxMembers: body.maxMembers || null,
    }

    state.projects = state.projects || []
    state.projects.push(project)
    lab.projectIds = lab.projectIds || []
    if (!lab.projectIds.includes(project.id)) lab.projectIds.push(project.id)
    // ensure conversation
    try { ensureProjectConversation(state, project.id) } catch (e) { /* ignore */ }

    await saveAppState(state)
    return NextResponse.json({ state, project })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not create project" }, { status: 500 })
  }
}

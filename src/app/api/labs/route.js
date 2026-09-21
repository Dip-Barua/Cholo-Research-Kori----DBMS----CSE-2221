import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { loadAppState, saveAppState } from "@/lib/server/state"
import { ensureLabConversation } from "@/lib/message-mutations"

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const nowIso = () => new Date().toISOString()

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const actorId = cookieStore.get("cholo_session")?.value || null
    if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!body || !body.name || !body.department) {
      return NextResponse.json({ error: "Missing required lab fields" }, { status: 400 })
    }

    const state = await loadAppState()

    const extraMembers = Array.isArray(body.memberIds) ? body.memberIds.filter((m) => m && m !== actorId) : []
    const memberIds = Array.from(new Set([actorId, ...extraMembers]))

    const lab = {
      id: idFrom("lab"),
      name: body.name,
      supervisorId: actorId,
      department: body.department,
      description: body.description || "",
      researchAreas: Array.isArray(body.researchAreas) ? body.researchAreas : (typeof body.researchAreas === 'string' ? body.researchAreas.split(',').map(s=>s.trim()).filter(Boolean) : []),
      memberIds,
      projectIds: [],
      openProjects: 0,
      createdAt: nowIso(),
    }

    state.labs = state.labs || []
    state.labs.push(lab)
    // create conversation for lab
    try { ensureLabConversation(state, lab.id) } catch (e) { /* ignore */ }

    // notify added members
    state.notifications = state.notifications || []
    memberIds.forEach((memberId) => {
      if (memberId === actorId) return
      state.notifications.unshift({
        id: idFrom("notification"),
        userId: memberId,
        type: "lab_invite",
        title: "Added to research lab",
        message: `You were added to ${lab.name}.`,
        read: false,
        relatedId: lab.id,
        href: `/labs/${lab.id}`,
        createdAt: nowIso(),
      })
    })

    await saveAppState(state)
    return NextResponse.json({ state, lab })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not create lab" }, { status: 500 })
  }
}

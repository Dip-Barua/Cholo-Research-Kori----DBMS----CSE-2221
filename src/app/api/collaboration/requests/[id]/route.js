import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { acceptRequestOnState, rejectRequestOnState } from "@/lib/collaboration-mutations"
import { loadAppState, saveAppState } from "@/lib/server/state"

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const actorId = cookieStore.get("cholo_session")?.value || null
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const requestId = resolvedParams?.id
    if (!requestId) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 })
    }

    const body = await request.json()
    const action = body.action

    const state = await loadAppState()
    if (action === "accept") {
      acceptRequestOnState(state, requestId, actorId)
    } else if (action === "reject") {
      rejectRequestOnState(state, requestId, actorId)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await saveAppState(state)
    return NextResponse.json({ state, ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not update request" }, { status: 400 })
  }
}

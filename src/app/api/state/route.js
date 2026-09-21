import { NextResponse } from "next/server"
import { saveAppState } from "@/lib/server/state"

export async function POST(request) {
  try {
    const { state } = await request.json()
    if (!state) {
      return NextResponse.json({ error: "Missing state" }, { status: 400 })
    }

    await saveAppState(state)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message || "State save failed" }, { status: 500 })
  }
}

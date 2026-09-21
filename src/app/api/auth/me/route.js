import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromCookie, loadAppState } from "@/lib/server/state"

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("cholo_session")?.value || null
  const state = await loadAppState()
  const user = userId ? state.users.find((item) => item.id === userId) || null : null
  return NextResponse.json({ user, state })
}

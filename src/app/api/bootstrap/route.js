import { NextResponse } from "next/server"
import { loadAppState } from "@/lib/server/state"

export async function GET() {
  const state = await loadAppState()
  return NextResponse.json(
    { state },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}

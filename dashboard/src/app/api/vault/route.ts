import { NextResponse } from "next/server"

const TREASURY_URL = process.env.TREASURY_URL || "http://localhost:4003"

export async function GET() {
  try {
    const res = await fetch(`${TREASURY_URL}/vault`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "backend unreachable" }, { status: 503 })
  }
}

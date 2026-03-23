import { NextResponse } from "next/server"

const API_URL = process.env.API_URL || "http://localhost:4000"

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/ledger`, {
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

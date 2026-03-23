import type { LedgerResponse, VaultResponse } from "./types"
import { mockLedger, mockVault } from "./mock-data"

export async function fetchLedger(): Promise<{
  data: LedgerResponse
  live: boolean
}> {
  try {
    const res = await fetch("/api/ledger", { cache: "no-store" })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = (await res.json()) as LedgerResponse
    return { data, live: true }
  } catch {
    return { data: mockLedger, live: false }
  }
}

export async function fetchVault(): Promise<{
  data: VaultResponse
  live: boolean
}> {
  try {
    const res = await fetch("/api/vault", { cache: "no-store" })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = (await res.json()) as VaultResponse
    return { data, live: true }
  } catch {
    return { data: mockVault, live: false }
  }
}

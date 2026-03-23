"use client"

import { useEffect, useState, useCallback } from "react"
import { Separator } from "@/components/ui/separator"
import { HealthStatus } from "@/components/health-status"
import { VaultState } from "@/components/vault-state"
import { QueryEconomics } from "@/components/query-economics"
import { CompoundingLoop } from "@/components/compounding-loop"
import { TransactionLog } from "@/components/transaction-log"
import { fetchLedger, fetchVault } from "@/lib/api"
import type { LedgerResponse, VaultResponse } from "@/lib/types"
import { mockLedger, mockVault } from "@/lib/mock-data"

export default function Dashboard() {
  const [ledger, setLedger] = useState<LedgerResponse>(mockLedger)
  const [vault, setVault] = useState<VaultResponse>(mockVault)
  const [live, setLive] = useState(false)

  const refresh = useCallback(async () => {
    const [l, v] = await Promise.all([fetchLedger(), fetchVault()])
    setLedger(l.data)
    setVault(v.data)
    setLive(l.live || v.live)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Chrysalis</h1>
          <p className="text-sm text-muted-foreground">
            Self-compounding AI agent — earn, deposit, compound forever
          </p>
        </div>
        <HealthStatus live={live} />
      </div>

      <Separator className="mb-6" />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <VaultState
          principal={ledger.aave.principal}
          aTokenBalance={ledger.aave.aTokenBalance}
          availableYield={ledger.aave.availableYield}
          yieldToNextQuery={ledger.aave.yieldToNextQuery}
          pool={ledger.aave.pool}
          aToken={ledger.aave.aToken}
          canTrigger={ledger.aave.canTriggerAutonomousQuery}
        />
        <QueryEconomics
          earned={ledger.earned}
          deposited={ledger.deposited}
          humanQueries={ledger.humanQueries}
          autonomousQueries={ledger.autonomousQueries}
          wallet={ledger.wallet}
        />
      </div>

      {/* Compounding loop diagram */}
      <div className="mb-4">
        <CompoundingLoop />
      </div>

      {/* Transaction log */}
      <TransactionLog logs={vault.recentLog ?? []} />

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          All Aave interactions are real on-chain transactions on Base Sepolia —{" "}
          <a
            href={`https://sepolia.basescan.org/address/${ledger.wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            verify on Basescan
          </a>
        </p>
      </div>
    </main>
  )
}

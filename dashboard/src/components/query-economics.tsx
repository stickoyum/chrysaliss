"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function QueryEconomics({
  earned,
  deposited,
  humanQueries,
  autonomousQueries,
  wallet,
}: {
  earned: string
  deposited: string
  humanQueries: number
  autonomousQueries: number
  wallet: string
}) {
  const total = humanQueries + autonomousQueries

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Query Economics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-mono font-semibold tracking-tight text-emerald-400">
              {earned}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Deposited</p>
            <p className="text-2xl font-mono font-semibold tracking-tight text-blue-400">
              {deposited}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 rounded-full bg-emerald-500/20 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
          </div>
          <span>100% deposited to Aave</span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-mono font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono font-semibold">{humanQueries}</p>
            <p className="text-xs text-muted-foreground">Human</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono font-semibold text-amber-400">
              {autonomousQueries}
            </p>
            <p className="text-xs text-muted-foreground">Autonomous</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-0.5">Agent Wallet</p>
          <a
            href={`https://sepolia.basescan.org/address/${wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-400 hover:underline"
          >
            {wallet}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

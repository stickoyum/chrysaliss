"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const BASESCAN = "https://sepolia.basescan.org"
const THRESHOLD = 0.08

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function parseUsdcValue(str: string): number {
  const match = str.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

export function VaultState({
  principal,
  aTokenBalance,
  availableYield,
  yieldToNextQuery,
  pool,
  aToken,
  canTrigger,
}: {
  principal: string
  aTokenBalance: string
  availableYield: string
  yieldToNextQuery: string
  pool: string
  aToken: string
  canTrigger: boolean
}) {
  const yieldValue = parseUsdcValue(availableYield)
  const progress = Math.min((yieldValue / THRESHOLD) * 100, 100)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aave v3 Vault
          </CardTitle>
          <Badge
            variant="secondary"
            className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs"
          >
            Base Sepolia
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">aToken Balance</p>
          <p className="text-2xl font-mono font-semibold tracking-tight">
            {aTokenBalance}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Principal</p>
            <p className="text-sm font-mono">{principal}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Yield</p>
            <p className="text-sm font-mono text-emerald-400">
              {availableYield}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Yield to next query</span>
            <span className="font-mono">
              {canTrigger ? "READY" : yieldToNextQuery}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                canTrigger
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-blue-600 to-blue-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Pool</p>
            <a
              href={`${BASESCAN}/address/${pool}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-blue-400 hover:underline"
            >
              {truncateAddress(pool)}
            </a>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">aUSDC</p>
            <a
              href={`${BASESCAN}/address/${aToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-blue-400 hover:underline"
            >
              {truncateAddress(aToken)}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CompoundingLoop() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Self-Compounding Loop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3 text-center w-full max-w-2xl">
            {/* Step 1 */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Step 1</div>
              <div className="text-sm font-medium">Human pays $0.08</div>
              <div className="text-xs text-muted-foreground mt-1">
                via x402 / ampersend
              </div>
            </div>

            <Arrow />

            {/* Step 2 */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="text-xs text-emerald-400 mb-1">Step 2</div>
              <div className="text-sm font-medium">Coordinator deposits</div>
              <div className="text-xs text-muted-foreground mt-1">
                Pool.supply() on Aave v3
              </div>
            </div>

            <Arrow />

            {/* Step 3 */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <div className="text-xs text-blue-400 mb-1">Step 3</div>
              <div className="text-sm font-medium">aToken grows</div>
              <div className="text-xs text-muted-foreground mt-1">
                real yield via Aave index
              </div>
            </div>
          </div>
        </div>

        {/* Return path */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="flex items-center justify-center -mt-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2">
                <div className="text-xs text-amber-400 mb-0.5">
                  Autonomous Loop
                </div>
                <div className="text-xs text-muted-foreground">
                  yield &ge; $0.08 → TreasuryAgent withdraws → pays Coordinator
                  → deposits back → repeat forever
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Arrow() {
  return (
    <div className="hidden sm:flex items-center justify-center text-muted-foreground">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
        <path d="M5 12h14m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

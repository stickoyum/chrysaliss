"use client"

import { Badge } from "@/components/ui/badge"

export function HealthStatus({ live }: { live: boolean }) {
  return (
    <Badge
      variant={live ? "default" : "secondary"}
      className={
        live
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
      }
    >
      <span
        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
          live ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
        }`}
      />
      {live ? "Live" : "Demo Data"}
    </Badge>
  )
}

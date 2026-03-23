"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const BASESCAN = "https://sepolia.basescan.org"

function extractTxHashes(text: string): { before: string; hash: string; after: string }[] {
  const pattern = /0x[a-fA-F0-9]{8,}/g
  const segments: { before: string; hash: string; after: string }[] = []
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    segments.push({
      before: text.slice(lastIndex, match.index),
      hash: match[0],
      after: "",
    })
    lastIndex = pattern.lastIndex
  }

  if (segments.length === 0) return [{ before: text, hash: "", after: "" }]
  segments[segments.length - 1].after = text.slice(lastIndex)
  return segments
}

export function TransactionLog({ logs }: { logs: string[] }) {
  const displayLogs = logs.slice(-10)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Vault Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {displayLogs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No activity yet
            </p>
          )}
          {displayLogs.map((entry, i) => {
            const tsMatch = entry.match(/^\[([^\]]+)\]\s*/)
            const timestamp = tsMatch ? tsMatch[1] : null
            const rest = tsMatch ? entry.slice(tsMatch[0].length) : entry
            const segments = extractTxHashes(rest)

            return (
              <div key={i} className="flex gap-2 text-xs font-mono leading-relaxed">
                {timestamp && (
                  <span className="text-muted-foreground shrink-0">{timestamp}</span>
                )}
                <span className="text-foreground/80">
                  {segments.map((seg, j) => (
                    <span key={j}>
                      {seg.before}
                      {seg.hash && (
                        <a
                          href={`${BASESCAN}/tx/${seg.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {seg.hash.slice(0, 10)}...
                        </a>
                      )}
                      {seg.after}
                    </span>
                  ))}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

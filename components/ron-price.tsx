"use client"

import useSWR from "swr"
import { TrendingUp, TrendingDown } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface RonData {
  price_usd: number
  price_change_24h: number
  volume_usd_24h: number
}

export function RonPrice() {
  const { data, isLoading } = useSWR<RonData>("/api/ron-price", fetcher, {
    refreshInterval: 60 * 1000, // 1 minute
    revalidateOnFocus: false,
    dedupingInterval: 30 * 1000,
  })

  const price = data?.price_usd
  const change = data?.price_change_24h

  if (isLoading || typeof price !== "number") {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2">
        <span className="text-xs font-semibold text-secondary-foreground">RON</span>
        <span className="h-3 w-10 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const isPositive = (change ?? 0) >= 0

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2">
      <span className="text-xs font-semibold text-secondary-foreground">RON</span>
      <span className="text-xs font-mono font-bold text-card-foreground">
        {'$'}{price.toFixed(2)}
      </span>
      {typeof change === "number" && (
        <div className={`flex items-center gap-0.5 ${isPositive ? "text-primary" : "text-destructive"}`}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span className="text-xs font-mono font-semibold">
            {isPositive ? "+" : ""}{change.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

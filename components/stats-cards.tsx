"use client"

import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  getAllResources,
  PRODUCTION_COSTS,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
} from "@/lib/craft-data"

interface StatsCardsProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
  isLoading?: boolean
}

export function StatsCards({ prices, isLoading }: StatsCardsProps) {
  const resources = getAllResources()
  const priceKeys = Object.keys(prices)

  let buyOpportunities = 0
  let sellOpportunities = 0
  let totalVolume = 0
  let totalMarketCap = 0

  for (const res of resources) {
    const priceData = prices[res.symbol]
    if (!priceData) continue

    const cost = PRODUCTION_COSTS[res.symbol]?.cost_usd ?? 0
    const marketPrice = priceData.price_usd

    if (cost > 0 && marketPrice > 0) {
      const deviation = ((marketPrice - cost) / cost) * 100
      if (deviation < -BUY_THRESHOLD) buyOpportunities++
      if (deviation > SELL_THRESHOLD) sellOpportunities++
    }

    totalVolume += priceData.volume_usd_24h
    totalMarketCap += priceData.price_usd
  }

  const stats = [
    {
      label: "Pools Ativas",
      value: priceKeys.length.toString(),
      icon: BarChart3,
      description: `de ${resources.length} total`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Oportunidades Compra",
      value: buyOpportunities.toString(),
      icon: TrendingDown,
      description: `abaixo de -${BUY_THRESHOLD}%`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Oportunidades Venda",
      value: sellOpportunities.toString(),
      icon: TrendingUp,
      description: `acima de +${SELL_THRESHOLD}%`,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Volume 24h",
      value: formatPrice(totalVolume),
      icon: DollarSign,
      description: "total combinado",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card">
          <CardContent className="flex items-start gap-3 p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-card-foreground font-mono">
                {isLoading ? (
                  <span className="inline-block h-5 w-12 animate-pulse rounded bg-secondary" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  getAllResources,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
} from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"

interface StatsCardsProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
  isLoading?: boolean
  productionCosts?: Record<string, number>
  thresholds?: { buy: number; sell: number }
  alertsConfig?: Record<string, { enabled: boolean; priority: string; category: string }>
}

export function StatsCards({ prices, isLoading, productionCosts: dynCosts, thresholds: dynThresholds }: StatsCardsProps) {
  const { t } = useI18n()
  const resources = getAllResources()
  const priceKeys = Object.keys(prices)

  let buyOpportunities = 0
  let sellOpportunities = 0
  let totalVolume = 0
  let totalMarketCap = 0

  for (const res of resources) {
    const priceData = prices[res.symbol]
    if (!priceData) continue

    const cost = dynCosts?.[res.symbol] ?? 0
    const marketPrice = priceData.price_usd
    const buyTh = dynThresholds?.buy ?? BUY_THRESHOLD
    const sellTh = dynThresholds?.sell ?? SELL_THRESHOLD

    if (cost > 0 && marketPrice > 0) {
      const deviation = ((marketPrice - cost) / cost) * 100
      if (deviation < -buyTh) buyOpportunities++
      if (deviation > sellTh) sellOpportunities++
    }

    totalVolume += priceData.volume_usd_24h
    totalMarketCap += priceData.price_usd
  }

  const stats = [
    {
      label: t("stats.activePools"),
      value: priceKeys.length.toString(),
      icon: BarChart3,
      description: `${t("stats.ofTotal").replace("{0}", resources.length.toString())}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t("stats.buyOpportunities"),
      value: buyOpportunities.toString(),
      icon: TrendingDown,
      description: `${t("stats.belowThreshold")} -${dynThresholds?.buy ?? BUY_THRESHOLD}%`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t("stats.sellOpportunities"),
      value: sellOpportunities.toString(),
      icon: TrendingUp,
      description: `${t("stats.aboveThreshold")} +${dynThresholds?.sell ?? SELL_THRESHOLD}%`,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: t("stats.volume24h"),
      value: formatPrice(totalVolume),
      icon: DollarSign,
      description: t("stats.totalCombined"),
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

"use client"

import { useMemo } from "react"
import { TrendingDown, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getAllResources,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
} from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"

interface OpportunitiesPanelProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
  isLoading?: boolean
  productionCosts?: Record<string, number>
  thresholds?: { buy: number; sell: number }
  alertsConfig?: Record<string, { enabled: boolean; priority: string; category: string }>
  dynoCoinPriceUsd?: number
}

interface Opportunity {
  symbol: string
  marketPrice: number
  cost: number
  deviation: number
  type: "buy" | "sell"
  priority: string
  volume: number
}

export function OpportunitiesPanel({ prices, isLoading, productionCosts: dynCosts, thresholds: dynThresholds, dynoCoinPriceUsd = 0 }: OpportunitiesPanelProps) {
  const { t } = useI18n()
  const opportunities = useMemo(() => {
    const resources = getAllResources()
    const opps: Opportunity[] = []
    const buyTh = dynThresholds?.buy ?? BUY_THRESHOLD
    const sellTh = dynThresholds?.sell ?? SELL_THRESHOLD

    for (const res of resources) {
      const priceData = prices[res.symbol]
      if (!priceData) continue

      const cost = dynCosts?.[res.symbol] ?? 0
      const marketPrice = priceData.price_usd

      if (cost <= 0 || marketPrice <= 0) continue

      const deviation = ((marketPrice - cost) / cost) * 100

      if (deviation < -buyTh) {
        opps.push({
          symbol: res.symbol,
          marketPrice,
          cost,
          deviation,
          type: "buy",
          priority: res.priority,
          volume: priceData.volume_usd_24h,
        })
      } else if (deviation > sellTh) {
        opps.push({
          symbol: res.symbol,
          marketPrice,
          cost,
          deviation,
          type: "sell",
          priority: res.priority,
          volume: priceData.volume_usd_24h,
        })
      }
    }

    // Sort by absolute deviation (strongest opportunities first)
    opps.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

    return opps
  }, [prices, dynCosts, dynThresholds])

  const buyOpps = opportunities.filter((o) => o.type === "buy")
  const sellOpps = opportunities.filter((o) => o.type === "sell")

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold text-card-foreground">
            {t("opps.title")}
          </CardTitle>
          {opportunities.length > 0 && (
            <Badge className="bg-primary/20 text-primary text-xs ml-auto">
              {opportunities.length} {t("opps.active")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
            <p className="text-xs text-center text-muted-foreground pt-2">{t("opps.loading")}</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("opps.noOpportunities")}</p>
            <p className="text-xs text-muted-foreground">
              {t("opps.noOpportunitiesDesc")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {buyOpps.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {t("opps.buySignals")}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {buyOpps.map((opp) => (
                    <div
                      key={opp.symbol}
                      className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-sm font-bold text-card-foreground">
                          {opp.symbol}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t("opps.market")}: {formatPrice(opp.marketPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("opps.cost")}: {formatPrice(opp.cost)}
                          </span>
                        </div>
                        {dynoCoinPriceUsd > 0 && opp.symbol !== "DYNO COIN" && (
                          <span className="font-mono text-[10px] font-semibold text-amber-400">
                            {(opp.marketPrice / dynoCoinPriceUsd).toFixed(2)} DYNO
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-sm font-bold text-primary">
                          {opp.deviation.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("opps.vol")}: {formatPrice(opp.volume)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sellOpps.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                    {t("opps.sellSignals")}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {sellOpps.map((opp) => (
                    <div
                      key={opp.symbol}
                      className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-sm font-bold text-card-foreground">
                          {opp.symbol}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t("opps.market")}: {formatPrice(opp.marketPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("opps.cost")}: {formatPrice(opp.cost)}
                          </span>
                        </div>
                        {dynoCoinPriceUsd > 0 && opp.symbol !== "DYNO COIN" && (
                          <span className="font-mono text-[10px] font-semibold text-amber-400">
                            {(opp.marketPrice / dynoCoinPriceUsd).toFixed(2)} DYNO
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-sm font-bold text-destructive">
                          +{opp.deviation.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("opps.vol")}: {formatPrice(opp.volume)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

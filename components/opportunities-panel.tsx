"use client"

import { useMemo } from "react"
import { TrendingDown, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getAllResources,
  PRODUCTION_COSTS,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
} from "@/lib/craft-data"

interface OpportunitiesPanelProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
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

export function OpportunitiesPanel({ prices }: OpportunitiesPanelProps) {
  const opportunities = useMemo(() => {
    const resources = getAllResources()
    const opps: Opportunity[] = []

    for (const res of resources) {
      const priceData = prices[res.symbol]
      if (!priceData) continue

      const cost = PRODUCTION_COSTS[res.symbol]?.cost_usd ?? 0
      const marketPrice = priceData.price_usd

      if (cost <= 0 || marketPrice <= 0) continue

      const deviation = ((marketPrice - cost) / cost) * 100

      if (deviation < -BUY_THRESHOLD) {
        opps.push({
          symbol: res.symbol,
          marketPrice,
          cost,
          deviation,
          type: "buy",
          priority: res.priority,
          volume: priceData.volume_usd_24h,
        })
      } else if (deviation > SELL_THRESHOLD) {
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
  }, [prices])

  const buyOpps = opportunities.filter((o) => o.type === "buy")
  const sellOpps = opportunities.filter((o) => o.type === "sell")

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold text-card-foreground">
            Oportunidades Ativas
          </CardTitle>
          {opportunities.length > 0 && (
            <Badge className="bg-primary/20 text-primary text-xs ml-auto">
              {opportunities.length} ativas
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sem oportunidades no momento</p>
            <p className="text-xs text-muted-foreground">
              Alertas aparecem quando o desvio ultrapassa os thresholds
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {buyOpps.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Oportunidades de Compra
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
                            Mercado: {formatPrice(opp.marketPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Custo: {formatPrice(opp.cost)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-sm font-bold text-primary">
                          {opp.deviation.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Vol: {formatPrice(opp.volume)}
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
                    Oportunidades de Venda
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
                            Mercado: {formatPrice(opp.marketPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Custo: {formatPrice(opp.cost)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-sm font-bold text-destructive">
                          +{opp.deviation.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Vol: {formatPrice(opp.volume)}
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

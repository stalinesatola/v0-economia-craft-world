"use client"

import { useState, useMemo } from "react"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Pickaxe,
  Factory,
  Coins,
  Layers,
  Zap,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getAllResources,
  POOLS,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
  type ResourceCategory,
  type Priority,
} from "@/lib/craft-data"
import { AssetChart } from "@/components/asset-chart"
import { useI18n } from "@/lib/i18n"
import { getResourceColor } from "@/lib/resource-images"

interface PriceTableProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number; image_url?: string; token_name?: string }>
  isLoading?: boolean
  productionCosts?: Record<string, number>
  thresholds?: { buy: number; sell: number }
  alertsConfig?: Record<string, { enabled: boolean; priority: string; category: string }>
}

type SortField = "symbol" | "market_price" | "cost" | "deviation" | "volume" | "priority"
type SortDir = "asc" | "desc"

const categoryIcons: Record<ResourceCategory, typeof Pickaxe> = {
  mine: Pickaxe,
  factory: Factory,
  token: Coins,
  base: Layers,
  advanced: Zap,
  defi: TrendingUp,
}

const priorityColors: Record<Priority, string> = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-warning/20 text-warning",
  low: "bg-muted text-muted-foreground",
}

export function PriceTable({ prices, isLoading, productionCosts: dynCosts, thresholds: dynThresholds, alertsConfig: dynAlerts }: PriceTableProps) {
  const { t } = useI18n()

  const categoryLabels: Record<ResourceCategory, string> = {
    mine: t("table.mine"),
    factory: t("table.factory"),
    token: t("table.token"),
    base: "Base",
    advanced: "Avancado",
    defi: "DeFi",
  }

  const priorityLabels: Record<Priority, string> = {
    high: t("table.high"),
    medium: t("table.medium"),
    low: t("table.low"),
  }
  const [selectedAsset, setSelectedAsset] = useState<{
    symbol: string
    poolAddress: string
    currentPrice: number
    cost: number
    deviation: number
    signal: "buy" | "sell" | "neutral"
  } | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all")
  const [sortField, setSortField] = useState<SortField>("priority")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const resources = getAllResources()

  const enrichedResources = useMemo(() => {
    return resources.map((res) => {
      const priceData = prices[res.symbol]
      const marketPrice = priceData?.price_usd ?? 0
      const cost = dynCosts?.[res.symbol] ?? 0
      const deviation = cost > 0 && marketPrice > 0 ? ((marketPrice - cost) / cost) * 100 : 0
      const volume = priceData?.volume_usd_24h ?? 0
      const change24h = priceData?.price_change_24h ?? 0
      const buyTh = dynThresholds?.buy ?? BUY_THRESHOLD
      const sellTh = dynThresholds?.sell ?? SELL_THRESHOLD

      let signal: "buy" | "sell" | "neutral" = "neutral"
      if (deviation < -buyTh) signal = "buy"
      else if (deviation > sellTh) signal = "sell"

      return {
        ...res,
        marketPrice,
        cost,
        deviation,
        volume,
        change24h,
        signal,
        hasPrice: !!priceData,
        imageUrl: priceData?.image_url,
        tokenName: priceData?.token_name,
      }
    })
  }, [resources, prices, dynCosts, dynThresholds])

  const filtered = useMemo(() => {
    let list = enrichedResources

    if (search) {
      const term = search.toLowerCase()
      list = list.filter((r) => r.symbol.toLowerCase().includes(term))
    }

    if (categoryFilter !== "all") {
      list = list.filter((r) => r.category === categoryFilter)
    }

    if (priorityFilter !== "all") {
      list = list.filter((r) => r.priority === priorityFilter)
    }

    const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 }

    list.sort((a, b) => {
      let compare = 0
      switch (sortField) {
        case "symbol":
          compare = a.symbol.localeCompare(b.symbol)
          break
        case "market_price":
          compare = a.marketPrice - b.marketPrice
          break
        case "cost":
          compare = a.cost - b.cost
          break
        case "deviation":
          compare = a.deviation - b.deviation
          break
        case "volume":
          compare = a.volume - b.volume
          break
        case "priority":
          compare = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
      }
      return sortDir === "asc" ? compare : -compare
    })

    return list
  }, [enrichedResources, search, categoryFilter, priorityFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {t("table.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("table.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 pl-8 text-xs bg-secondary"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(["all", "mine", "factory", "token", "base", "advanced", "defi"] as const).map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "all" ? t("table.all") : categoryLabels[cat]}
            </Button>
          ))}
          <div className="mx-1 h-7 w-px bg-border" />
          {(["all", "high", "medium", "low"] as const).map((pri) => (
            <Button
              key={pri}
              variant={priorityFilter === pri ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setPriorityFilter(pri)}
            >
              {pri === "all" ? t("table.allPriorities") : priorityLabels[pri]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-2.5 text-left">
                  <button onClick={() => toggleSort("symbol")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    {t("table.resource")} <SortIcon field="symbol" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <button onClick={() => toggleSort("market_price")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    {t("table.marketPrice")} <SortIcon field="market_price" />
                  </button>
                </th>
                <th className="hidden px-3 py-2.5 text-right sm:table-cell">
                  <button onClick={() => toggleSort("cost")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    {t("table.productionCost")} <SortIcon field="cost" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <button onClick={() => toggleSort("deviation")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    {t("table.deviation")} <SortIcon field="deviation" />
                  </button>
                </th>
                <th className="hidden px-3 py-2.5 text-right md:table-cell">
                  <button onClick={() => toggleSort("volume")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    {t("table.volume24h")} <SortIcon field="volume" />
                  </button>
                </th>
                <th className="hidden px-3 py-2.5 text-center lg:table-cell">
                  <button onClick={() => toggleSort("priority")} className="mx-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    {t("table.priority")} <SortIcon field="priority" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-center">
                  <span className="font-medium text-muted-foreground">{t("table.signal")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => {
                const CategoryIcon = categoryIcons[res.category]
                return (
                  <tr
                    key={res.symbol}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/30 cursor-pointer"
                    onClick={() =>
                      setSelectedAsset({
                        symbol: res.symbol,
                        poolAddress: POOLS[res.symbol] ?? "",
                        currentPrice: res.marketPrice,
                        cost: res.cost,
                        deviation: res.deviation,
                        signal: res.signal,
                      })
                    }
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {res.imageUrl ? (
                          <img
                            src={res.imageUrl}
                            alt={res.symbol}
                            className="h-6 w-6 rounded-full shrink-0 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                          />
                        ) : (
                          <div
                            className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: getResourceColor(res.symbol) }}
                          >
                            {res.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold text-card-foreground leading-tight">{res.symbol}</span>
                          {res.tokenName && (
                            <span className="text-[10px] text-muted-foreground leading-tight">{res.tokenName}</span>
                          )}
                        </div>
                        <CategoryIcon className="h-3 w-3 text-muted-foreground/50 shrink-0 ml-auto hidden sm:block" />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-card-foreground">
                      {res.hasPrice ? formatPrice(res.marketPrice) : isLoading ? (
                        <span className="inline-block h-4 w-16 animate-pulse rounded bg-secondary ml-auto" />
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right font-mono text-muted-foreground sm:table-cell">
                      {formatPrice(res.cost)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {res.hasPrice && res.cost > 0 ? (
                        <span
                          className={`font-mono font-semibold ${
                            res.signal === "buy"
                              ? "text-primary"
                              : res.signal === "sell"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {res.deviation > 0 ? "+" : ""}
                          {res.deviation.toFixed(1)}%
                        </span>
                      ) : isLoading ? (
                        <span className="inline-block h-4 w-14 animate-pulse rounded bg-secondary ml-auto" />
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right font-mono text-muted-foreground md:table-cell">
                      {res.hasPrice ? formatPrice(res.volume) : isLoading ? (
                        <span className="inline-block h-4 w-14 animate-pulse rounded bg-secondary ml-auto" />
                      ) : "--"}
                    </td>
                    <td className="hidden px-3 py-2.5 text-center lg:table-cell">
                      <Badge variant="secondary" className={`text-xs ${priorityColors[res.priority]}`}>
                        {priorityLabels[res.priority]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {res.signal === "buy" ? (
                        <Badge className="bg-primary/20 text-primary text-xs font-semibold">
                          {t("table.buy")}
                        </Badge>
                      ) : res.signal === "sell" ? (
                        <Badge className="bg-destructive/20 text-destructive text-xs font-semibold">
                          {t("table.sell")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    {t("table.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Asset Chart Modal */}
      {selectedAsset && (
        <AssetChart
          symbol={selectedAsset.symbol}
          poolAddress={selectedAsset.poolAddress}
          currentPrice={selectedAsset.currentPrice}
          cost={selectedAsset.cost}
          deviation={selectedAsset.deviation}
          signal={selectedAsset.signal}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </Card>
  )
}

"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/craft-data"
import { AssetChart } from "@/components/asset-chart"
import { useI18n } from "@/lib/i18n"
import { getResourceColor } from "@/lib/resource-images"
import { ShareButton } from "@/components/share-card"
import useSWR from "swr"

const configFetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

interface PriceTableProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number; image_url?: string; token_name?: string }>
  pools?: Record<string, string>
  isLoading?: boolean
  productionCosts?: Record<string, number>
  thresholds?: { buy: number; sell: number }
  alertsConfig?: Record<string, { enabled: boolean; priority: string; category: string; imageUrl?: string }>
  dynoCoinPriceUsd?: number
}

export function PriceTable({ prices, pools: poolMap, isLoading, productionCosts: dynCosts, thresholds: dynThresholds, alertsConfig: dynAlerts, dynoCoinPriceUsd = 0 }: PriceTableProps) {
  const { t } = useI18n()

  const [selectedAsset, setSelectedAsset] = useState<{
    symbol: string
    poolAddress: string
    currentPrice: number
    cost: number
    deviation: number
    signal: "buy" | "sell" | "neutral"
  } | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [signalFilter, setSignalFilter] = useState<string>("all")

  // Fetch dynamic categories from config
  const { data: catData } = useSWR("/api/categories", configFetcher, { revalidateOnFocus: false, dedupingInterval: 60000 })
  const dynamicCategories: { id: string; label: string; color: string; enabled: boolean }[] = catData ?? []

  // Fetch recipes for production chain details
  const { data: recipesData } = useSWR("/api/recipes", configFetcher, { revalidateOnFocus: false, dedupingInterval: 60000 })
  const recipes: { output: string; inputs: { resource: string; quantity: number }[] }[] = recipesData ?? []

  // Build a map of recipes by output symbol
  const recipeMap = useMemo(() => {
    const map: Record<string, { resource: string; quantity: number }[]> = {}
    for (const r of recipes) {
      map[r.output] = r.inputs
    }
    return map
  }, [recipes])

  // Build resource list purely from prices (dynamic, from admin-registered pools)
  const resources = useMemo(() => {
    return Object.entries(prices).map(([symbol, priceData]) => {
      const cost = dynCosts?.[symbol] ?? 0
      const marketPrice = priceData.price_usd
      const deviation = cost > 0 && marketPrice > 0 ? ((marketPrice - cost) / cost) * 100 : 0
      const buyTh = dynThresholds?.buy ?? 15
      const sellTh = dynThresholds?.sell ?? 20
      const alertCfg = dynAlerts?.[symbol]

      let signal: "buy" | "sell" | "neutral" = "neutral"
      if (deviation < -buyTh) signal = "buy"
      else if (deviation > sellTh) signal = "sell"

      const finalImageUrl = alertCfg?.imageUrl || priceData.image_url

      return {
        symbol,
        marketPrice,
        cost,
        deviation,
        volume: priceData.volume_usd_24h,
        change24h: priceData.price_change_24h,
        signal,
        imageUrl: finalImageUrl,
        tokenName: priceData.token_name,
        category: alertCfg?.category ?? "factory",
        priority: alertCfg?.priority ?? "low",
        enabled: alertCfg?.enabled ?? true,
        poolAddress: poolMap?.[symbol] ?? "",
      }
    })
  }, [prices, dynCosts, dynThresholds, dynAlerts, poolMap])

  const filtered = useMemo(() => {
    let list = resources

    if (search) {
      const term = search.toLowerCase()
      list = list.filter((r) => r.symbol.toLowerCase().includes(term) || (r.tokenName?.toLowerCase().includes(term)))
    }

    if (categoryFilter !== "all") {
      list = list.filter((r) => r.category === categoryFilter)
    }

    if (signalFilter !== "all") {
      list = list.filter((r) => r.signal === signalFilter)
    }

    // Sort: buy signals first, then sell, then neutral. Within each, by absolute deviation desc
    list.sort((a, b) => {
      const signalOrder = { buy: 0, sell: 1, neutral: 2 }
      const orderDiff = signalOrder[a.signal] - signalOrder[b.signal]
      if (orderDiff !== 0) return orderDiff
      return Math.abs(b.deviation) - Math.abs(a.deviation)
    })

    return list
  }, [resources, search, categoryFilter, signalFilter])

  // Active category list from dynamic categories or unique categories in data
  const activeCategories = useMemo(() => {
    if (dynamicCategories.length > 0) {
      return dynamicCategories.filter(c => c.enabled)
    }
    const unique = [...new Set(resources.map(r => r.category))]
    return unique.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1), color: "", enabled: true }))
  }, [dynamicCategories, resources])

  if (resources.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-card-foreground">{t("table.noResources")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("table.noResourcesDesc")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-56 pl-8 text-xs bg-card border-border"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* Category filters */}
          <Button
            variant={categoryFilter === "all" ? "default" : "secondary"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setCategoryFilter("all")}
          >
            {t("table.all")}
          </Button>
          {activeCategories.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs px-2.5 gap-1.5"
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
              {cat.label}
            </Button>
          ))}
          <div className="mx-1 h-7 w-px bg-border" />
          {/* Signal filters */}
          {(["all", "buy", "sell"] as const).map((sig) => (
            <Button
              key={sig}
              variant={signalFilter === sig ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSignalFilter(sig)}
            >
              {sig === "all" ? t("table.allSignals") : sig === "buy" ? t("table.buy") : t("table.sell")}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && resources.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-card border border-border" />
          ))}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((res) => {
          const signalConfig = {
            buy: { bg: "border-primary/40 bg-primary/5", badge: "bg-primary/20 text-primary", icon: TrendingUp, label: t("table.buy") },
            sell: { bg: "border-destructive/40 bg-destructive/5", badge: "bg-destructive/20 text-destructive", icon: TrendingDown, label: t("table.sell") },
            neutral: { bg: "border-border bg-card", badge: "bg-secondary text-muted-foreground", icon: Minus, label: "-" },
          }
          const cfg = signalConfig[res.signal]
          const SignalIcon = cfg.icon
          const catConfig = dynamicCategories.find(c => c.id === res.category)

          return (
            <Card
              key={res.symbol}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${cfg.bg}`}
              onClick={() =>
                setSelectedAsset({
                  symbol: res.symbol,
                  poolAddress: res.poolAddress,
                  currentPrice: res.marketPrice,
                  cost: res.cost,
                  deviation: res.deviation,
                  signal: res.signal,
                })
              }
            >
              <CardContent className="p-4">
                {/* Top row: image + name + signal */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {res.imageUrl ? (
                      <img
                        src={res.imageUrl}
                        alt={res.symbol}
                        className="h-9 w-9 rounded-full shrink-0 object-cover ring-2 ring-border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <div
                        className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ring-2 ring-border"
                        style={{ backgroundColor: getResourceColor(res.symbol) }}
                      >
                        {res.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold text-card-foreground leading-tight">{res.symbol}</span>
                      {res.tokenName && (
                        <span className="text-[10px] text-muted-foreground leading-tight">{res.tokenName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {catConfig && (
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: catConfig.color }} title={catConfig.label} />
                    )}
                    {res.signal !== "neutral" && (
                      <Badge className={`text-[10px] px-1.5 py-0 ${cfg.badge}`}>
                        <SignalIcon className="h-3 w-3 mr-0.5" />
                        {cfg.label}
                      </Badge>
                    )}
                    <ShareButton
                      data={{
                        symbol: res.symbol,
                        marketPrice: res.marketPrice,
                        cost: res.cost,
                        deviation: res.deviation,
                        signal: res.signal,
                        change24h: res.change24h,
                        volume: res.volume,
                        imageUrl: res.imageUrl,
                        coinPrice: dynoCoinPriceUsd,
                        inputs: recipeMap[res.symbol]?.map(inp => ({
                          resource: inp.resource,
                          quantity: inp.quantity,
                          unitPrice: prices[inp.resource]?.price_usd ?? 0,
                          subtotal: (prices[inp.resource]?.price_usd ?? 0) * inp.quantity,
                        })),
                      }}
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <p className="font-mono text-lg font-bold text-card-foreground leading-none">
                    {formatPrice(res.marketPrice)}
                  </p>
                  {/* DYNO COIN value */}
                  {dynoCoinPriceUsd > 0 && res.symbol !== "DYNO COIN" && (
                    <p className="font-mono text-[11px] font-semibold text-amber-400 leading-tight mt-0.5">
                      {(res.marketPrice / dynoCoinPriceUsd).toFixed(2)} DYNO
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    {res.change24h !== 0 && (
                      <span className={`flex items-center gap-0.5 text-[11px] font-medium ${res.change24h > 0 ? "text-primary" : "text-destructive"}`}>
                        {res.change24h > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(res.change24h).toFixed(1)}%
                      </span>
                    )}
                    {res.cost > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {t("table.cost")}: {formatPrice(res.cost)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Production inputs */}
                {recipeMap[res.symbol] && recipeMap[res.symbol].length > 0 && (() => {
                  const inputs = recipeMap[res.symbol]
                  const inputsTotal = inputs.reduce((sum, inp) => {
                    return sum + (prices[inp.resource]?.price_usd ?? 0) * inp.quantity
                  }, 0)
                  return (
                    <div className="mb-2 rounded-lg bg-secondary/40 border border-border/30 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.inputs")}</span>
                        <span className="text-[9px] font-mono font-semibold text-card-foreground">
                          = {inputsTotal > 0 ? formatPrice(inputsTotal) : "--"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {inputs.map((inp) => {
                          const inputPrice = prices[inp.resource]?.price_usd ?? 0
                          const subtotal = inputPrice * inp.quantity
                          return (
                            <div key={inp.resource} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                {prices[inp.resource]?.image_url ? (
                                  <img
                                    src={prices[inp.resource].image_url}
                                    alt={inp.resource}
                                    className="h-3.5 w-3.5 rounded-full object-cover"
                                  />
                                ) : (
                                  <span
                                    className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[6px] font-bold text-white"
                                    style={{ backgroundColor: getResourceColor(inp.resource) }}
                                  >
                                    {inp.resource.slice(0, 1)}
                                  </span>
                                )}
                                <span className="font-mono text-muted-foreground">
                                  {inp.quantity}x {inp.resource}
                                </span>
                                <span className="text-muted-foreground/60">
                                  ({inputPrice > 0 ? `$${inputPrice.toFixed(6)}` : "?"} {t("table.unitPrice")})
                                </span>
                              </div>
                              <span className="font-mono font-medium text-card-foreground">
                                {subtotal > 0 ? formatPrice(subtotal) : "--"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Bottom row: deviation + volume */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  {res.cost > 0 ? (
                    <span className={`font-mono text-xs font-semibold ${
                      res.signal === "buy" ? "text-primary" : res.signal === "sell" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {res.deviation > 0 ? "+" : ""}{res.deviation.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {t("table.vol")}: {formatPrice(res.volume)}
                  </span>
                </div>

                {/* Hover hint */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-primary font-medium">{t("table.viewChart")} →</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("table.noResults")}</p>
        </div>
      )}

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
    </div>
  )
}

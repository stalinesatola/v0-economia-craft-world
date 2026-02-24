"use client"

import { useState, useMemo } from "react"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Pickaxe,
  Factory,
  Coins,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getAllResources,
  PRODUCTION_COSTS,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
  type ResourceCategory,
  type Priority,
} from "@/lib/craft-data"

interface PriceTableProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
}

type SortField = "symbol" | "market_price" | "cost" | "deviation" | "volume" | "priority"
type SortDir = "asc" | "desc"

const categoryIcons: Record<ResourceCategory, typeof Pickaxe> = {
  mine: Pickaxe,
  factory: Factory,
  token: Coins,
}

const categoryLabels: Record<ResourceCategory, string> = {
  mine: "Mina",
  factory: "Fabrica",
  token: "Token",
}

const priorityColors: Record<Priority, string> = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-warning/20 text-warning",
  low: "bg-muted text-muted-foreground",
}

const priorityLabels: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
}

export function PriceTable({ prices }: PriceTableProps) {
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
      const cost = PRODUCTION_COSTS[res.symbol]?.cost_usd ?? 0
      const deviation = cost > 0 && marketPrice > 0 ? ((marketPrice - cost) / cost) * 100 : 0
      const volume = priceData?.volume_usd_24h ?? 0
      const change24h = priceData?.price_change_24h ?? 0

      let signal: "buy" | "sell" | "neutral" = "neutral"
      if (deviation < -BUY_THRESHOLD) signal = "buy"
      else if (deviation > SELL_THRESHOLD) signal = "sell"

      return {
        ...res,
        marketPrice,
        cost,
        deviation,
        volume,
        change24h,
        signal,
        hasPrice: !!priceData,
      }
    })
  }, [resources, prices])

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
            Tabela de Precos
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 pl-8 text-xs bg-secondary"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(["all", "mine", "factory", "token"] as const).map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "all" ? "Todos" : categoryLabels[cat]}
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
              {pri === "all" ? "Todas" : priorityLabels[pri]}
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
                    Recurso <SortIcon field="symbol" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <button onClick={() => toggleSort("market_price")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Preco Mercado <SortIcon field="market_price" />
                  </button>
                </th>
                <th className="hidden px-3 py-2.5 text-right sm:table-cell">
                  <button onClick={() => toggleSort("cost")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Custo Prod. <SortIcon field="cost" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <button onClick={() => toggleSort("deviation")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Desvio <SortIcon field="deviation" />
                  </button>
                </th>
                <th className="hidden px-3 py-2.5 text-right md:table-cell">
                  <button onClick={() => toggleSort("volume")} className="ml-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Vol. 24h <SortIcon field="volume" />
                  </button>
                </th>
                <th className="hidden px-3 py-2.5 text-center lg:table-cell">
                  <button onClick={() => toggleSort("priority")} className="mx-auto flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Prioridade <SortIcon field="priority" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-center">
                  <span className="font-medium text-muted-foreground">Sinal</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => {
                const CategoryIcon = categoryIcons[res.category]
                return (
                  <tr
                    key={res.symbol}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono font-semibold text-card-foreground">{res.symbol}</span>
                        {res.input && (
                          <span className="hidden text-muted-foreground sm:inline">
                            {res.ratio}x {res.input}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-card-foreground">
                      {res.hasPrice ? formatPrice(res.marketPrice) : (
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
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right font-mono text-muted-foreground md:table-cell">
                      {res.hasPrice ? formatPrice(res.volume) : "--"}
                    </td>
                    <td className="hidden px-3 py-2.5 text-center lg:table-cell">
                      <Badge variant="secondary" className={`text-xs ${priorityColors[res.priority]}`}>
                        {priorityLabels[res.priority]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {res.signal === "buy" ? (
                        <Badge className="bg-primary/20 text-primary text-xs font-semibold">
                          COMPRAR
                        </Badge>
                      ) : res.signal === "sell" ? (
                        <Badge className="bg-destructive/20 text-destructive text-xs font-semibold">
                          VENDER
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
                    Nenhum recurso encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

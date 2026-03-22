"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, ArrowRight, TrendingDown, TrendingUp, Minus, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
} from "@/lib/craft-data"
import { getResourceColor, RECIPES as FALLBACK_RECIPES, type Recipe } from "@/lib/resource-images"
import { useI18n } from "@/lib/i18n"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url)
  .then(r => r.ok ? r.json().catch(() => []) : [])
  .catch(() => [])


interface ProductionChainProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number; image_url?: string; token_name?: string }>
  pools?: Record<string, string>
  productionCosts?: Record<string, number>
}

// Calcula custo de producao directo: soma(preco_pool_input * quantidade)
// NAO recursivo - usa o preco real da pool de cada materia-prima
function calcCost(
  symbol: string,
  prices: Record<string, { price_usd: number }>,
  recipes: Recipe[],
): number {
  const recipe = recipes.find(r => r.output === symbol)
  if (!recipe) return 0 // Recurso base - sem custo de producao

  let totalCost = 0
  for (const inp of recipe.inputs) {
    const inputPoolPrice = prices[inp.resource]?.price_usd ?? 0
    totalCost += inputPoolPrice * inp.quantity
  }

  return totalCost
}

function ResourceIcon({ symbol, size = 28, imageUrl }: { symbol: string; size?: number; imageUrl?: string }) {
  const color = getResourceColor(symbol)
  const initials = symbol.slice(0, 2)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={symbol}
        className="rounded-md shrink-0 shadow-sm object-cover"
        style={{ width: size, height: size }}
        crossOrigin="anonymous"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-md font-mono text-[9px] font-bold text-white shrink-0 shadow-sm"
      style={{ width: size, height: size, backgroundColor: color, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      title={symbol}
    >
      {initials}
    </div>
  )
}

function ResourceCard({
  recipe,
  prices,
  pools,
  productionCost,
  t,
}: {
  recipe: Recipe
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number; image_url?: string }>
  pools?: Record<string, string>
  productionCost: number
  t: (key: string) => string
}) {
  const outputPrice = prices[recipe.output]?.price_usd ?? 0
  const cost = productionCost
  const deviation = cost > 0 && outputPrice > 0 ? ((outputPrice - cost) / cost) * 100 : 0

  let signal: "buy" | "sell" | "neutral" = "neutral"
  if (deviation < -BUY_THRESHOLD) signal = "buy"
  else if (deviation > SELL_THRESHOLD) signal = "sell"

  const SignalIcon = signal === "buy" ? TrendingDown : signal === "sell" ? TrendingUp : Minus
  const poolAddress = pools?.[recipe.output]

  return (
    <div className={`rounded-lg border p-3 transition-all hover:shadow-md ${
      signal === "buy"
        ? "border-primary/40 bg-primary/5"
        : signal === "sell"
        ? "border-destructive/40 bg-destructive/5"
        : "border-border bg-card"
    }`}>
      {/* Header: recurso produzido */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <ResourceIcon symbol={recipe.output} size={32} imageUrl={prices[recipe.output]?.image_url} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono font-bold text-card-foreground">{recipe.output}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono border-muted-foreground/30">
                LVL {recipe.level}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground">{t("chain.outputResource")}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <SignalIcon className={`h-4 w-4 ${
            signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : "text-muted-foreground"
          }`} />
          {cost > 0 && outputPrice > 0 && (
            <span className={`text-xs font-mono font-bold ${
              signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {deviation > 0 ? "+" : ""}{deviation.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Materias-Primas com precos da pool */}
      <div className="flex flex-col gap-1.5 mb-2.5">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("chain.rawMaterials")}</span>
        {recipe.inputs.map((inp) => {
          const inputPrice = prices[inp.resource]?.price_usd ?? 0
          const inputTotal = inputPrice * inp.quantity
          const inputPool = pools?.[inp.resource]
          return (
            <div key={inp.resource} className="flex items-center justify-between gap-1 rounded-md bg-secondary/40 px-2 py-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <ResourceIcon symbol={inp.resource} size={18} imageUrl={prices[inp.resource]?.image_url} />
                <span className="text-xs font-mono text-card-foreground truncate">{inp.resource}</span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">x{inp.quantity}</span>
                {inputPool && (
                  <a
                    href={`https://geckoterminal.com/ronin/pools/${inputPool}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
                    title={t("chain.viewPool")}
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {inputPrice > 0 ? `$${inputPrice.toFixed(6)}` : "N/A"}
                </span>
                <span className="text-[10px] font-mono font-medium text-card-foreground">
                  = {inputTotal > 0 ? formatPrice(inputTotal) : "N/A"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Custo vs Mercado */}
      <div className="border-t border-border pt-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">{t("chain.productionCost")}</span>
          <span className="text-sm font-mono font-bold text-card-foreground">
            {cost > 0 ? formatPrice(cost) : "N/A"}
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-1" />
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{t("chain.marketPrice")}</span>
            {poolAddress && (
              <a
                href={`https://geckoterminal.com/ronin/pools/${poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/50 hover:text-primary transition-colors"
                title={t("chain.viewPool")}
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          <span className={`text-sm font-mono font-bold ${
            signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : "text-card-foreground"
          }`}>
            {outputPrice > 0 ? formatPrice(outputPrice) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  )
}

// Categorias fallback
const FALLBACK_GROUPS = [
  { id: "earth", label: "Earth", color: "#8B4513", symbols: ["MUD", "CLAY", "SAND", "COPPER", "STEEL", "SCREWS"] },
  { id: "water", label: "Water", color: "#4A90D9", symbols: ["SEAWATER", "ALGAE", "OXYGEN", "GAS", "FUEL", "OIL"] },
  { id: "fire", label: "Fire", color: "#FF5722", symbols: ["HEAT", "LAVA", "GLASS", "SULFUR", "FIBERGLASS"] },
  { id: "advanced", label: "Advanced", color: "#FFD600", symbols: ["CERAMICS", "STONE", "CEMENT", "ACID", "STEAM", "ENERGY", "HYDROGEN", "PLASTICS", "DYNAMITE"] },
]

export function ProductionChain({ prices, pools }: ProductionChainProps) {
  const { t } = useI18n()
  const [activeGroup, setActiveGroup] = useState(0)
  const [expanded, setExpanded] = useState(true)

  // Buscar receitas e categorias do DB
  const { data: dbRecipes, isLoading: loadingRecipes } = useSWR<Recipe[]>("/api/recipes", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
  const { data: dbCategories } = useSWR<{ id: string; label: string; color: string; enabled: boolean }[]>("/api/categories", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const recipes = dbRecipes && dbRecipes.length > 0 ? dbRecipes : FALLBACK_RECIPES

  // Calcular custos de producao: soma(preco_pool_input * quantidade) para cada input
  const productionCosts = useMemo(() => {
    const costs: Record<string, number> = {}
    for (const recipe of recipes) {
      costs[recipe.output] = calcCost(recipe.output, prices, recipes)
    }
    return costs
  }, [recipes, prices])

  // Agrupar recursos por categoria
  const groups = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      const enabledCats = dbCategories.filter(c => c.enabled)
      const catGroups = enabledCats.map(cat => ({
        id: cat.id,
        label: cat.label,
        color: cat.color,
        recipes: recipes.filter(r => {
          const fallback = FALLBACK_GROUPS.find(fg => fg.symbols.includes(r.output))
          return fallback?.id === cat.id
        }),
      }))
      const assignedOutputs = new Set(catGroups.flatMap(g => g.recipes.map(r => r.output)))
      const unassigned = recipes.filter(r => !assignedOutputs.has(r.output))
      if (unassigned.length > 0) {
        catGroups.push({ id: "_other", label: t("chain.others"), color: "#9E9E9E", recipes: unassigned })
      }
      return catGroups.filter(g => g.recipes.length > 0)
    }

    return FALLBACK_GROUPS.map(fg => ({
      id: fg.id,
      label: fg.label,
      color: fg.color,
      recipes: recipes.filter(r => fg.symbols.includes(r.output)),
    })).filter(g => g.recipes.length > 0)
  }, [dbCategories, recipes])

  const safeActiveGroup = Math.min(activeGroup, Math.max(groups.length - 1, 0))
  const group = groups[safeActiveGroup]

  if (loadingRecipes) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">{t("chain.loading")}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {t("chain.title")}
          </CardTitle>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? t("chain.collapseAll") : t("chain.expandAll")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("chain.description")} {t("chain.costFormula")}
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-3">
          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {groups.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(i)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                  i === safeActiveGroup
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: g.color }} />
                {g.label}
                <span className="text-[10px] opacity-70">({g.recipes.length})</span>
              </button>
            ))}
          </div>

          {/* Resource cards grid */}
          {group && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
              {group.recipes.map((recipe) => (
                <ResourceCard
                  key={recipe.output}
                  recipe={recipe}
                  prices={prices}
                  pools={pools}
                  productionCost={productionCosts[recipe.output] ?? 0}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 border-t border-border pt-2">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">{t("chain.buySignalDesc")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-destructive" />
              <span className="text-[10px] text-muted-foreground">{t("chain.sellSignalDesc")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("chain.neutral")}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

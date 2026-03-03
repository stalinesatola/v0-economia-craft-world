"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, ArrowRight, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react"
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

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : [])

interface ProductionChainProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number; image_url?: string; token_name?: string }>
  productionCosts?: Record<string, number>
}

// Calcula custo de producao recursivo usando precos reais das pools
function calcCost(
  symbol: string,
  prices: Record<string, { price_usd: number }>,
  recipes: Recipe[],
  cache: Map<string, number>
): number {
  if (cache.has(symbol)) return cache.get(symbol)!

  const recipe = recipes.find(r => r.output === symbol)
  if (!recipe) {
    // Recurso base (EARTH, FIRE, WATER) - custo = preco da pool
    const cost = prices[symbol]?.price_usd ?? 0
    cache.set(symbol, cost)
    return cost
  }

  let totalCost = 0
  for (const inp of recipe.inputs) {
    const inputPrice = calcCost(inp.resource, prices, recipes, cache)
    totalCost += inputPrice * inp.quantity
  }

  cache.set(symbol, totalCost)
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

function RecipeCard({
  recipe,
  prices,
  productionCost,
}: {
  recipe: Recipe
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number; image_url?: string }>
  productionCost: number
}) {
  const outputPrice = prices[recipe.output]?.price_usd ?? 0
  const cost = productionCost
  const deviation = cost > 0 && outputPrice > 0 ? ((outputPrice - cost) / cost) * 100 : 0

  let signal: "buy" | "sell" | "neutral" = "neutral"
  if (deviation < -BUY_THRESHOLD) signal = "buy"
  else if (deviation > SELL_THRESHOLD) signal = "sell"

  const SignalIcon = signal === "buy" ? TrendingDown : signal === "sell" ? TrendingUp : Minus

  return (
    <div className={`rounded-lg border p-3 transition-all hover:shadow-md ${
      signal === "buy"
        ? "border-primary/40 bg-primary/5"
        : signal === "sell"
        ? "border-destructive/40 bg-destructive/5"
        : "border-border bg-card"
    }`}>
      {/* Header: output + signal */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ResourceIcon symbol={recipe.output} size={30} imageUrl={prices[recipe.output]?.image_url} />
          <div>
            <span className="text-sm font-mono font-bold text-card-foreground">{recipe.output}</span>
            <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 h-4 font-mono border-muted-foreground/30">
              LVL {recipe.level}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <SignalIcon className={`h-3.5 w-3.5 ${
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

      {/* Inputs */}
      <div className="flex flex-col gap-1 mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Materias-Primas</span>
        {recipe.inputs.map((inp) => {
          const inputPrice = prices[inp.resource]?.price_usd ?? 0
          const inputTotal = inputPrice * inp.quantity
          return (
            <div key={inp.resource} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ResourceIcon symbol={inp.resource} size={20} imageUrl={prices[inp.resource]?.image_url} />
                <span className="text-xs font-mono text-card-foreground">{inp.resource}</span>
                <span className="text-[10px] font-mono text-muted-foreground">x{inp.quantity}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {inputPrice > 0 ? formatPrice(inputPrice) : "N/A"}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  = {inputTotal > 0 ? formatPrice(inputTotal) : "N/A"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">Custo Producao</span>
          <span className="text-xs font-mono font-bold text-card-foreground">
            {cost > 0 ? formatPrice(cost) : "N/A"}
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Preco Mercado</span>
          <span className={`text-xs font-mono font-bold ${
            signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : "text-card-foreground"
          }`}>
            {outputPrice > 0 ? formatPrice(outputPrice) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  )
}

// Categorias fallback caso nao haja categorias no DB
const FALLBACK_GROUPS = [
  { id: "earth", label: "Earth", color: "#8B4513", symbols: ["MUD", "CLAY", "SAND", "COPPER", "STEEL", "SCREWS"] },
  { id: "water", label: "Water", color: "#4A90D9", symbols: ["SEAWATER", "ALGAE", "OXYGEN", "GAS", "FUEL", "OIL"] },
  { id: "fire", label: "Fire", color: "#FF5722", symbols: ["HEAT", "LAVA", "GLASS", "SULFUR", "FIBERGLASS"] },
  { id: "advanced", label: "Advanced", color: "#FFD600", symbols: ["CERAMICS", "STONE", "CEMENT", "ACID", "STEAM", "ENERGY", "HYDROGEN", "PLASTICS", "DYNAMITE"] },
]

export function ProductionChain({ prices }: ProductionChainProps) {
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

  // Usar receitas do DB ou fallback
  const recipes = dbRecipes && dbRecipes.length > 0 ? dbRecipes : FALLBACK_RECIPES

  // Calcular custos de producao com precos reais das pools
  const productionCosts = useMemo(() => {
    const cache = new Map<string, number>()
    const costs: Record<string, number> = {}
    for (const recipe of recipes) {
      costs[recipe.output] = calcCost(recipe.output, prices, recipes, cache)
    }
    return costs
  }, [recipes, prices])

  // Agrupar receitas por categoria
  // Se existem categorias no DB, agrupar por elas (usando alertsConfig dos pools)
  // Senao, usar FALLBACK_GROUPS
  const groups = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      const enabledCats = dbCategories.filter(c => c.enabled)
      // Mapear receitas para categorias:
      // Uma receita pertence a uma categoria se o seu output foi atribuido a essa categoria no alertsConfig
      // Por enquanto, distribui por todas as categorias existentes com base no output
      const catGroups = enabledCats.map(cat => ({
        id: cat.id,
        label: cat.label,
        color: cat.color,
        recipes: recipes.filter(r => {
          // Verificar se o recurso output esta atribuido a esta categoria
          // Usando o FALLBACK_GROUPS como referencia se nao ha mapeamento explicito
          const fallback = FALLBACK_GROUPS.find(fg => fg.symbols.includes(r.output))
          return fallback?.id === cat.id
        }),
      }))
      // Adicionar um grupo "Outros" para receitas sem categoria
      const assignedOutputs = new Set(catGroups.flatMap(g => g.recipes.map(r => r.output)))
      const unassigned = recipes.filter(r => !assignedOutputs.has(r.output))
      if (unassigned.length > 0) {
        catGroups.push({ id: "_other", label: "Outros", color: "#9E9E9E", recipes: unassigned })
      }
      return catGroups.filter(g => g.recipes.length > 0)
    }

    // Fallback: usar FALLBACK_GROUPS
    return FALLBACK_GROUPS.map(fg => ({
      id: fg.id,
      label: fg.label,
      color: fg.color,
      recipes: recipes.filter(r => fg.symbols.includes(r.output)),
    })).filter(g => g.recipes.length > 0)
  }, [dbCategories, recipes])

  const safeActiveGroup = Math.min(activeGroup, groups.length - 1)
  const group = groups[safeActiveGroup]

  if (loadingRecipes) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">A carregar receitas...</span>
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
          Precos calculados com base nas pools cadastradas em tempo real. Custo = soma(preco_pool x quantidade).
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

          {/* Recipe cards - grid */}
          {group && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto">
              {group.recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.output}
                  recipe={recipe}
                  prices={prices}
                  productionCost={productionCosts[recipe.output] ?? 0}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 border-t border-border pt-2">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Comprar (mercado {"<"} custo -{BUY_THRESHOLD}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-destructive" />
              <span className="text-[10px] text-muted-foreground">Vender (mercado {">"} custo +{SELL_THRESHOLD}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Neutro</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

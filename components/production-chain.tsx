"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
} from "@/lib/craft-data"
import { RECIPES, getResourceColor, calculateProductionCost, type Recipe } from "@/lib/resource-images"
import { useI18n } from "@/lib/i18n"

interface ProductionChainProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
  productionCosts?: Record<string, { cost_usd: number; input?: string; ratio?: number }>
}

function ResourceIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const color = getResourceColor(symbol)
  const initials = symbol.slice(0, 2)
  return (
    <div
      className="flex items-center justify-center rounded-md font-mono text-[9px] font-bold text-white shrink-0 shadow-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}
      title={symbol}
    >
      {initials}
    </div>
  )
}

function RecipeCard({
  recipe,
  prices,
}: {
  recipe: Recipe
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
}) {
  const outputPrice = prices[recipe.output]?.price_usd ?? 0
  const cost = calculateProductionCost(recipe.output, prices)
  const deviation = cost > 0 && outputPrice > 0 ? ((outputPrice - cost) / cost) * 100 : 0

  let signal: "buy" | "sell" | "neutral" = "neutral"
  if (deviation < -BUY_THRESHOLD) signal = "buy"
  else if (deviation > SELL_THRESHOLD) signal = "sell"

  const borderClass = signal === "buy"
    ? "border-primary/40 bg-primary/5"
    : signal === "sell"
    ? "border-destructive/40 bg-destructive/5"
    : "border-border bg-card"

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:shadow-sm ${borderClass}`}>
      {/* Inputs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {recipe.inputs.map((inp, i) => (
          <div key={inp.resource} className="flex items-center gap-1">
            {i > 0 && <span className="text-[10px] text-muted-foreground font-bold">+</span>}
            <span className="text-[10px] font-mono font-bold text-muted-foreground">{inp.quantity}x</span>
            <ResourceIcon symbol={inp.resource} size={22} />
            <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">{inp.resource}</span>
          </div>
        ))}
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center gap-0 shrink-0">
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono border-muted-foreground/30">
          LVL 1
        </Badge>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Output */}
      <div className="flex items-center gap-1.5">
        <ResourceIcon symbol={recipe.output} size={26} />
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-card-foreground">{recipe.output}</span>
          <div className="flex flex-col gap-0.5">
            {outputPrice > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">Mercado: {formatPrice(outputPrice)}</span>
            )}
            {cost > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground/70">Custo: {formatPrice(cost)}</span>
            )}
          </div>
          {cost > 0 && outputPrice > 0 && (
            <span className={`text-[10px] font-mono font-semibold ${
              signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {deviation > 0 ? "+" : ""}{deviation.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Group recipes by chain for tab view
const CHAIN_GROUPS = [
  { name: "Earth", icon: "EA", color: "#8B4513", symbols: ["MUD", "CLAY", "SAND", "COPPER", "STEEL", "SCREWS"] },
  { name: "Water", icon: "WA", color: "#4A90D9", symbols: ["SEAWATER", "ALGAE", "OXYGEN", "GAS", "FUEL", "OIL"] },
  { name: "Fire", icon: "FI", color: "#FF5722", symbols: ["HEAT", "LAVA", "GLASS", "SULFUR", "FIBERGLASS"] },
  { name: "Advanced", icon: "AD", color: "#FFD600", symbols: ["CERAMICS", "STONE", "CEMENT", "ACID", "STEAM", "ENERGY", "HYDROGEN", "PLASTICS", "DYNAMITE"] },
]

export function ProductionChain({ prices }: ProductionChainProps) {
  const { t } = useI18n()
  const [activeGroup, setActiveGroup] = useState(0)
  const [expanded, setExpanded] = useState(true)

  const group = CHAIN_GROUPS[activeGroup]
  const groupRecipes = RECIPES.filter((r) => group.symbols.includes(r.output))

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
        <p className="text-xs text-muted-foreground">{t("chain.description")}</p>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-3">
          {/* Chain group tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CHAIN_GROUPS.map((g, i) => (
              <button
                key={g.name}
                onClick={() => setActiveGroup(i)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                  i === activeGroup
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: g.color }}
                />
                {g.name}
              </button>
            ))}
          </div>

          {/* Recipe cards */}
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {groupRecipes.map((recipe) => (
              <RecipeCard key={recipe.output} recipe={recipe} prices={prices} />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 border-t border-border pt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">{t("chain.buy")} ({"<"}-{BUY_THRESHOLD}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-[10px] text-muted-foreground">{t("chain.sell")} ({">"}+{SELL_THRESHOLD}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("chain.neutral")}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

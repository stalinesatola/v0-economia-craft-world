"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PRODUCTION_CHAINS,
  PRODUCTION_COSTS,
  BUY_THRESHOLD,
  SELL_THRESHOLD,
  formatPrice,
  type ChainNode,
} from "@/lib/craft-data"

interface ProductionChainProps {
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
  productionCosts?: Record<string, { cost_usd: number; input?: string; ratio?: number }>
}

function ChainNodeItem({
  node,
  prices,
  depth,
}: {
  node: ChainNode
  prices: Record<string, { price_usd: number; volume_usd_24h: number; price_change_24h: number }>
  depth: number
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const priceData = prices[node.symbol]
  const cost = PRODUCTION_COSTS[node.symbol]?.cost_usd ?? 0
  const marketPrice = priceData?.price_usd ?? 0
  const deviation = cost > 0 && marketPrice > 0 ? ((marketPrice - cost) / cost) * 100 : 0
  const ratio = PRODUCTION_COSTS[node.symbol]?.ratio
  const input = PRODUCTION_COSTS[node.symbol]?.input

  let signal: "buy" | "sell" | "neutral" = "neutral"
  if (deviation < -BUY_THRESHOLD) signal = "buy"
  else if (deviation > SELL_THRESHOLD) signal = "sell"

  const signalColors = {
    buy: "border-primary/50 bg-primary/5",
    sell: "border-destructive/50 bg-destructive/5",
    neutral: "border-border bg-card",
  }

  const dotColors = {
    buy: "bg-primary",
    sell: "bg-destructive",
    neutral: "bg-muted-foreground",
  }

  return (
    <div className="relative">
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 h-full w-px bg-border"
          style={{ left: `${depth * 20 - 10}px` }}
        />
      )}
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-secondary/50 ${signalColors[signal]}`}
        style={{ marginLeft: `${depth * 20}px` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <div className={`h-2 w-2 rounded-full ${dotColors[signal]} shrink-0`} />
        )}

        <span className="font-mono text-xs font-bold text-card-foreground">{node.symbol}</span>

        {input && ratio && (
          <span className="text-xs text-muted-foreground">
            ({ratio}x {input})
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          {marketPrice > 0 && (
            <span className="font-mono text-xs text-card-foreground">{formatPrice(marketPrice)}</span>
          )}
          {marketPrice > 0 && cost > 0 && (
            <span
              className={`font-mono text-xs font-semibold ${
                signal === "buy"
                  ? "text-primary"
                  : signal === "sell"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {deviation > 0 ? "+" : ""}
              {deviation.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {isOpen && hasChildren && (
        <div className="mt-1 flex flex-col gap-1">
          {node.children.map((child) => (
            <ChainNodeItem key={child.symbol} node={child} prices={prices} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProductionChain({ prices, productionCosts: dynCosts }: ProductionChainProps) {
  // Use dynamic costs if available for the legend
  void dynCosts
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Cadeia de Producao
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Expanda para ver a hierarquia de producao. Cores indicam oportunidades.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {PRODUCTION_CHAINS.map((chain) => (
          <ChainNodeItem key={chain.symbol} node={chain} prices={prices} depth={0} />
        ))}
        <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Comprar ({"<"}-{BUY_THRESHOLD}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Vender ({">"}+{SELL_THRESHOLD}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">Neutro</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

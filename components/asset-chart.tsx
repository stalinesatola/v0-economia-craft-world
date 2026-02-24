"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { formatPrice } from "@/lib/craft-data"

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface AssetChartProps {
  symbol: string
  poolAddress: string
  currentPrice: number
  cost: number
  deviation: number
  signal: "buy" | "sell" | "neutral"
  onClose: () => void
}

const TIMEFRAMES = [
  { label: "1H", timeframe: "minute", aggregate: "15", limit: "4" },
  { label: "24H", timeframe: "hour", aggregate: "1", limit: "24" },
  { label: "7D", timeframe: "day", aggregate: "1", limit: "7" },
  { label: "30D", timeframe: "day", aggregate: "1", limit: "30" },
] as const

export function AssetChart({
  symbol,
  poolAddress,
  currentPrice,
  cost,
  deviation,
  signal,
  onClose,
}: AssetChartProps) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState(2) // default 7D
  const [showVolume, setShowVolume] = useState(false)

  const fetchOHLCV = useCallback(async (tfIndex: number) => {
    setLoading(true)
    const tf = TIMEFRAMES[tfIndex]
    try {
      const res = await fetch(
        `/api/ohlcv/${poolAddress}?timeframe=${tf.timeframe}&aggregate=${tf.aggregate}&limit=${tf.limit}`
      )
      if (res.ok) {
        const data = await res.json()
        setCandles(data.candles ?? [])
      }
    } catch {
      setCandles([])
    } finally {
      setLoading(false)
    }
  }, [poolAddress])

  useEffect(() => {
    fetchOHLCV(activeTimeframe)
  }, [activeTimeframe, fetchOHLCV])

  const handleTimeframe = (index: number) => {
    setActiveTimeframe(index)
  }

  const priceChange = candles.length > 1 ? candles[candles.length - 1].close - candles[0].open : 0
  const priceChangePercent = candles.length > 1 && candles[0].open > 0
    ? ((priceChange / candles[0].open) * 100)
    : 0
  const isPositive = priceChange >= 0

  const chartData = candles.map((c) => ({
    date: new Date(c.timestamp).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      ...(activeTimeframe <= 1 ? { hour: "2-digit", minute: "2-digit" } : {}),
    }),
    price: c.close,
    volume: c.volume,
    high: c.high,
    low: c.low,
  }))

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.low)) * 0.98 : 0
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.high)) * 1.02 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl bg-card border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-card-foreground font-mono">
                  {symbol}
                </CardTitle>
                {signal === "buy" && (
                  <Badge className="bg-primary/20 text-primary text-xs">COMPRAR</Badge>
                )}
                {signal === "sell" && (
                  <Badge className="bg-destructive/20 text-destructive text-xs">VENDER</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Preco: <span className="font-mono text-card-foreground">{formatPrice(currentPrice)}</span></span>
                <span>Custo: <span className="font-mono">{formatPrice(cost)}</span></span>
                <span>Desvio: <span className={`font-mono font-semibold ${signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : ""}`}>{deviation > 0 ? "+" : ""}{deviation.toFixed(1)}%</span></span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>

          {/* Period indicator */}
          {!loading && candles.length > 1 && (
            <div className="flex items-center gap-2 pt-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className={`text-xs font-mono font-semibold ${isPositive ? "text-primary" : "text-destructive"}`}>
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">no periodo</span>
            </div>
          )}

          {/* Timeframe buttons */}
          <div className="flex items-center gap-1.5 pt-2">
            {TIMEFRAMES.map((tf, i) => (
              <Button
                key={tf.label}
                variant={activeTimeframe === i ? "default" : "secondary"}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => handleTimeframe(i)}
              >
                {tf.label}
              </Button>
            ))}
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant={showVolume ? "default" : "secondary"}
              size="sm"
              className="h-7 text-xs px-2.5 gap-1"
              onClick={() => setShowVolume(!showVolume)}
            >
              <BarChart3 className="h-3 w-3" />
              Vol
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-56">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : candles.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
              Sem dados disponiveis para este periodo.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Price chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "oklch(0.72 0.19 165)" : "oklch(0.60 0.20 25)"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isPositive ? "oklch(0.72 0.19 165)" : "oklch(0.60 0.20 25)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.015 260)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "oklch(0.65 0.02 250)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[minPrice, maxPrice]}
                      tick={{ fontSize: 10, fill: "oklch(0.65 0.02 250)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => formatPrice(v)}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.008 260)",
                        border: "1px solid oklch(0.26 0.015 260)",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "oklch(0.95 0.01 250)",
                      }}
                      formatter={(value: string | number) => [formatPrice(Number(value)), "Preco"]}
                      labelFormatter={(label: string) => `Data: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "oklch(0.72 0.19 165)" : "oklch(0.60 0.20 25)"}
                      strokeWidth={2}
                      fill={`url(#gradient-${symbol})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume chart */}
              {showVolume && (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.015 260)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "oklch(0.65 0.02 250)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "oklch(0.65 0.02 250)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.008 260)",
                          border: "1px solid oklch(0.26 0.015 260)",
                          borderRadius: "8px",
                          fontSize: "11px",
                          color: "oklch(0.95 0.01 250)",
                        }}
                        formatter={(value: string | number) => [`$${Number(value).toFixed(2)}`, "Volume"]}
                      />
                      <Bar dataKey="volume" fill="oklch(0.65 0.17 250)" radius={[3, 3, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cost line indicator */}
              {cost > 0 && cost >= minPrice && cost <= maxPrice && (
                <p className="text-xs text-muted-foreground text-center">
                  Linha de custo de producao: {formatPrice(cost)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

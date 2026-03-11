"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, TrendingDown, BarChart3, Loader2, CandlestickChart } from "lucide-react"
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
import { useI18n } from "@/lib/i18n"

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
  { label: "1M", timeframe: "minute", aggregate: "1", limit: "60" },
  { label: "5M", timeframe: "minute", aggregate: "5", limit: "60" },
  { label: "15M", timeframe: "minute", aggregate: "15", limit: "48" },
  { label: "30M", timeframe: "minute", aggregate: "30", limit: "48" },
  { label: "1H", timeframe: "minute", aggregate: "15", limit: "4" },
  { label: "24H", timeframe: "hour", aggregate: "1", limit: "24" },
  { label: "7D", timeframe: "day", aggregate: "1", limit: "7" },
  { label: "30D", timeframe: "day", aggregate: "1", limit: "30" },
] as const

// Candlestick SVG renderer
function CandlestickChart({ data, minPrice, maxPrice }: { data: any[]; minPrice: number; maxPrice: number }) {
  if (!data || data.length === 0) return null
  
  return (
    <div className="relative w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 20} 200`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.25 0.015 270)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="oklch(0.25 0.015 270)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 50, 100, 150, 200].map((y) => (
          <line key={`grid-${y}`} x1="0" y1={y} x2="100%" y2={y} stroke="oklch(0.25 0.015 270)" strokeWidth="0.5" opacity="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        
        {/* Candlesticks */}
        {data.map((candle, i) => {
          const priceRange = maxPrice - minPrice
          const yScale = (price: number) => 200 - ((price - minPrice) / priceRange) * 200
          
          const isUp = candle.close >= candle.open
          const color = isUp ? "oklch(0.75 0.18 145)" : "oklch(0.62 0.22 25)"
          
          const x = i * 20 + 10
          const yOpen = yScale(candle.open)
          const yClose = yScale(candle.close)
          const yHigh = yScale(candle.high)
          const yLow = yScale(candle.low)
          
          const bodyTop = Math.min(yOpen, yClose)
          const bodyHeight = Math.abs(yClose - yOpen) || 1
          
          return (
            <g key={i}>
              {/* Wick */}
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {/* Body */}
              <rect
                x={x - 4}
                y={bodyTop}
                width={8}
                height={Math.max(bodyHeight, 1)}
                fill={isUp ? color : "transparent"}
                stroke={color}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )
        })}
      </svg>
      
      {/* Y-axis labels */}
      <div className="absolute right-0 top-0 h-full w-16 flex flex-col justify-between text-[10px] text-muted-foreground pr-1 pointer-events-none">
        <span className="text-right">{formatPrice(maxPrice)}</span>
        <span className="text-right">{formatPrice((minPrice + maxPrice) / 2)}</span>
        <span className="text-right">{formatPrice(minPrice)}</span>
      </div>
    </div>
  )
}

export function AssetChart({
  symbol,
  poolAddress,
  currentPrice,
  cost,
  deviation,
  signal,
  onClose,
}: AssetChartProps) {
  const { t, locale } = useI18n()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState(5) // default 24H
  const [showVolume, setShowVolume] = useState(false)
  const [chartType, setChartType] = useState<"area" | "candle">("area")

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
    date: new Date(c.timestamp).toLocaleDateString(locale === "pt" ? "pt-PT" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      ...(activeTimeframe <= 4 ? { hour: "2-digit", minute: "2-digit" } : {}),
    }),
    price: c.close,
    volume: c.volume,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
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
                  <Badge className="bg-primary/20 text-primary text-xs">{t("table.buy")}</Badge>
                )}
                {signal === "sell" && (
                  <Badge className="bg-destructive/20 text-destructive text-xs">{t("table.sell")}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t("chart.price")}: <span className="font-mono text-card-foreground">{formatPrice(currentPrice)}</span></span>
                <span>{t("opps.cost")}: <span className="font-mono">{formatPrice(cost)}</span></span>
                <span>{t("opps.deviation")}: <span className={`font-mono font-semibold ${signal === "buy" ? "text-primary" : signal === "sell" ? "text-destructive" : ""}`}>{deviation > 0 ? "+" : ""}{deviation.toFixed(1)}%</span></span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">{t("chart.close")}</span>
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
              <span className="text-xs text-muted-foreground">{locale === "pt" ? "no periodo" : "in period"}</span>
            </div>
          )}

          {/* Timeframe buttons */}
          <div className="flex flex-wrap items-center gap-1 pt-2">
            {TIMEFRAMES.map((tf, i) => (
              <Button
                key={tf.label}
                variant={activeTimeframe === i ? "default" : "secondary"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => handleTimeframe(i)}
              >
                {tf.label}
              </Button>
            ))}
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant={chartType === "candle" ? "default" : "secondary"}
              size="sm"
              className="h-6 text-[10px] px-2 gap-1"
              onClick={() => setChartType(chartType === "area" ? "candle" : "area")}
              title={chartType === "area" ? "Velas" : "Area"}
            >
              <CandlestickChart className="h-3 w-3" />
            </Button>
            <Button
              variant={showVolume ? "default" : "secondary"}
              size="sm"
              className="h-6 text-[10px] px-2 gap-1"
              onClick={() => setShowVolume(!showVolume)}
            >
              <BarChart3 className="h-3 w-3" />
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
              {t("chart.noData")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Price chart */}
              <div className="h-48">
                {chartType === "area" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isPositive ? "oklch(0.75 0.18 55)" : "oklch(0.62 0.22 25)"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={isPositive ? "oklch(0.75 0.18 55)" : "oklch(0.62 0.22 25)"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 270)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "oklch(0.60 0.02 260)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[minPrice, maxPrice]}
                        tick={{ fontSize: 10, fill: "oklch(0.60 0.02 260)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => formatPrice(v)}
                        width={72}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.16 0.012 270)",
                          border: "1px solid oklch(0.25 0.015 270)",
                          borderRadius: "8px",
                          fontSize: "11px",
                          color: "oklch(0.95 0.005 90)",
                        }}
                        formatter={(value: string | number) => [formatPrice(Number(value)), t("chart.price")]}
                        labelFormatter={(label: string) => `${locale === "pt" ? "Data" : "Date"}: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "oklch(0.75 0.18 55)" : "oklch(0.62 0.22 25)"}
                        strokeWidth={2}
                        fill={`url(#gradient-${symbol})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <CandlestickChart data={chartData} minPrice={minPrice} maxPrice={maxPrice} />
                )}
              </div>

              {/* Volume chart */}
              {showVolume && (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 270)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "oklch(0.60 0.02 260)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "oklch(0.60 0.02 260)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.16 0.012 270)",
                          border: "1px solid oklch(0.25 0.015 270)",
                          borderRadius: "8px",
                          fontSize: "11px",
                          color: "oklch(0.95 0.005 90)",
                        }}
                        formatter={(value: string | number) => [`$${Number(value).toFixed(2)}`, "Volume"]}
                      />
                      <Bar dataKey="volume" fill="oklch(0.70 0.14 190)" radius={[3, 3, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cost line indicator */}
              {cost > 0 && cost >= minPrice && cost <= maxPrice && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("chart.prodCost")}: {formatPrice(cost)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

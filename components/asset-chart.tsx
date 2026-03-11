"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, TrendingDown, BarChart3, Loader2, CandlestickChart } from "lucide-react"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts"
import { formatPrice } from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"

// TradingView-inspired color palette
const TV_COLORS = {
  bg: "#131722",
  grid: "#1e222d",
  text: "#787b86",
  textLight: "#d1d4dc",
  bullish: "#26a69a",
  bearish: "#ef5350",
  bullishBg: "rgba(38, 166, 154, 0.12)",
  bearishBg: "rgba(239, 83, 80, 0.12)",
  line: "#2962ff",
  volume: "#5d606b",
  costLine: "#ff9800",
}

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface ChartDataPoint {
  date: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  isUp: boolean
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
  { label: "1m", timeframe: "minute", aggregate: "1", limit: "60" },
  { label: "5m", timeframe: "minute", aggregate: "5", limit: "60" },
  { label: "15m", timeframe: "minute", aggregate: "15", limit: "48" },
  { label: "30m", timeframe: "minute", aggregate: "30", limit: "48" },
  { label: "1H", timeframe: "minute", aggregate: "15", limit: "4" },
  { label: "1D", timeframe: "hour", aggregate: "1", limit: "24" },
  { label: "1W", timeframe: "day", aggregate: "1", limit: "7" },
  { label: "1M", timeframe: "day", aggregate: "1", limit: "30" },
] as const

// Custom Candlestick shape for recharts
function CandleShape(props: any) {
  const { x, y, width, height, payload, yAxisMap } = props
  if (!payload || !yAxisMap) return null

  const yAxis = yAxisMap.price
  if (!yAxis || typeof yAxis.scale !== "function") return null

  const { open, high, low, close, isUp } = payload
  const color = isUp ? TV_COLORS.bullish : TV_COLORS.bearish

  const yOpen = yAxis.scale(open)
  const yClose = yAxis.scale(close)
  const yHigh = yAxis.scale(high)
  const yLow = yAxis.scale(low)

  const bodyTop = Math.min(yOpen, yClose)
  const bodyHeight = Math.abs(yClose - yOpen) || 1
  const candleWidth = Math.min(width * 0.8, 12)
  const candleX = x + (width - candleWidth) / 2

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={yHigh}
        x2={x + width / 2}
        y2={yLow}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={candleX}
        y={bodyTop}
        width={candleWidth}
        height={Math.max(bodyHeight, 1)}
        fill={isUp ? color : "transparent"}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

// Professional tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload[0]) return null
  const data = payload[0].payload as ChartDataPoint

  return (
    <div className="rounded border border-[#363a45] bg-[#1e222d] px-3 py-2 text-xs shadow-lg">
      <div className="mb-1.5 text-[#787b86]">{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-[#787b86]">O</span>
        <span className="text-right font-mono text-[#d1d4dc]">{formatPrice(data.open)}</span>
        <span className="text-[#787b86]">H</span>
        <span className="text-right font-mono text-[#d1d4dc]">{formatPrice(data.high)}</span>
        <span className="text-[#787b86]">L</span>
        <span className="text-right font-mono text-[#d1d4dc]">{formatPrice(data.low)}</span>
        <span className="text-[#787b86]">C</span>
        <span className={`text-right font-mono ${data.isUp ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
          {formatPrice(data.close)}
        </span>
        {data.volume > 0 && (
          <>
            <span className="text-[#787b86]">Vol</span>
            <span className="text-right font-mono text-[#d1d4dc]">${data.volume.toFixed(0)}</span>
          </>
        )}
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

  const chartData: ChartDataPoint[] = candles.map((c) => ({
    date: new Date(c.timestamp).toLocaleString(locale === "pt" ? "pt-PT" : "en-US", {
      month: "short",
      day: "2-digit",
      ...(activeTimeframe <= 4 ? { hour: "2-digit", minute: "2-digit" } : {}),
    }),
    timestamp: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    isUp: c.close >= c.open,
  }))

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.low)) * 0.995 : 0
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.high)) * 1.005 : 0
  const maxVolume = chartData.length > 0 ? Math.max(...chartData.map((d) => d.volume)) * 1.2 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl border-[#363a45] shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: TV_COLORS.bg }}>
        <CardHeader className="pb-2 border-b border-[#363a45]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-semibold font-mono" style={{ color: TV_COLORS.textLight }}>
                  {symbol}/USD
                </CardTitle>
                {signal === "buy" && (
                  <Badge className="text-[10px] px-1.5 py-0" style={{ backgroundColor: TV_COLORS.bullishBg, color: TV_COLORS.bullish }}>
                    {t("table.buy").toUpperCase()}
                  </Badge>
                )}
                {signal === "sell" && (
                  <Badge className="text-[10px] px-1.5 py-0" style={{ backgroundColor: TV_COLORS.bearishBg, color: TV_COLORS.bearish }}>
                    {t("table.sell").toUpperCase()}
                  </Badge>
                )}
                {!loading && candles.length > 1 && (
                  <span className={`text-sm font-mono font-medium ${isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                    {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: TV_COLORS.text }}>
                <span>
                  <span className="opacity-70">Last: </span>
                  <span className="font-mono" style={{ color: TV_COLORS.textLight }}>{formatPrice(currentPrice)}</span>
                </span>
                <span>
                  <span className="opacity-70">Cost: </span>
                  <span className="font-mono" style={{ color: TV_COLORS.costLine }}>{formatPrice(cost)}</span>
                </span>
                <span>
                  <span className="opacity-70">Dev: </span>
                  <span className={`font-mono font-medium ${signal === "buy" ? "text-[#26a69a]" : signal === "sell" ? "text-[#ef5350]" : ""}`}>
                    {deviation > 0 ? "+" : ""}{deviation.toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 hover:bg-[#363a45]" style={{ color: TV_COLORS.text }}>
              <X className="h-4 w-4" />
              <span className="sr-only">{t("chart.close")}</span>
            </Button>
          </div>

          {/* Timeframe buttons - TradingView style */}
          <div className="flex flex-wrap items-center gap-0.5 pt-3">
            {TIMEFRAMES.map((tf, i) => (
              <button
                key={tf.label}
                className={`h-6 px-2 text-[11px] font-medium rounded transition-colors ${
                  activeTimeframe === i 
                    ? "bg-[#2962ff] text-white" 
                    : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
                }`}
                onClick={() => handleTimeframe(i)}
              >
                {tf.label}
              </button>
            ))}
            <div className="mx-2 h-4 w-px bg-[#363a45]" />
            <button
              className={`h-6 px-2 rounded transition-colors ${
                chartType === "candle" 
                  ? "bg-[#2962ff] text-white" 
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
              }`}
              onClick={() => setChartType(chartType === "area" ? "candle" : "area")}
              title="Candlestick"
            >
              <CandlestickChart className="h-3.5 w-3.5" />
            </button>
            <button
              className={`h-6 px-2 rounded transition-colors ${
                showVolume 
                  ? "bg-[#2962ff] text-white" 
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
              }`}
              onClick={() => setShowVolume(!showVolume)}
              title="Volume"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-72" style={{ backgroundColor: TV_COLORS.bg }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: TV_COLORS.line }} />
            </div>
          ) : candles.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-sm" style={{ backgroundColor: TV_COLORS.bg, color: TV_COLORS.text }}>
              {t("chart.noData")}
            </div>
          ) : (
            <div className="flex flex-col" style={{ backgroundColor: TV_COLORS.bg }}>
              {/* Main Price Chart */}
              <div className={showVolume ? "h-52" : "h-72"}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 60, bottom: 0, left: 0 }}>
                    {/* Grid */}
                    <defs>
                      <linearGradient id={`area-gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: TV_COLORS.text }}
                      dy={5}
                    />
                    <YAxis
                      yAxisId="price"
                      orientation="right"
                      domain={[minPrice, maxPrice]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: TV_COLORS.text }}
                      tickFormatter={(v: number) => formatPrice(v)}
                      width={55}
                    />
                    
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Cost reference line */}
                    {cost > 0 && cost >= minPrice && cost <= maxPrice && (
                      <ReferenceLine
                        yAxisId="price"
                        y={cost}
                        stroke={TV_COLORS.costLine}
                        strokeDasharray="4 2"
                        strokeWidth={1}
                        label={{
                          value: `Cost: ${formatPrice(cost)}`,
                          position: "left",
                          fill: TV_COLORS.costLine,
                          fontSize: 9,
                        }}
                      />
                    )}

                    {/* Chart type: Line or Candles */}
                    {chartType === "area" ? (
                      <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="close"
                        stroke={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3, fill: isPositive ? TV_COLORS.bullish : TV_COLORS.bearish }}
                      />
                    ) : (
                      <Bar
                        yAxisId="price"
                        dataKey="high"
                        shape={<CandleShape yAxisMap={{ price: { scale: (v: number) => v } }} />}
                        isAnimationActive={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              {showVolume && (
                <div className="h-20 border-t border-[#363a45]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 60, bottom: 5, left: 0 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis
                        yAxisId="volume"
                        orientation="right"
                        domain={[0, maxVolume]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: TV_COLORS.text }}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
                        width={55}
                      />
                      <Bar yAxisId="volume" dataKey="volume" isAnimationActive={false}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`vol-${index}`}
                            fill={entry.isUp ? TV_COLORS.bullish : TV_COLORS.bearish}
                            fillOpacity={0.5}
                          />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bottom bar with info */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-[#363a45] text-[10px]" style={{ color: TV_COLORS.text }}>
                <span>GeckoTerminal Data</span>
                <span>{TIMEFRAMES[activeTimeframe].label} Chart</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"

// TradingView-inspired colors
const TV_COLORS = {
  bg: "#131722",
  grid: "#1e222d",
  text: "#787b86",
  textLight: "#d1d4dc",
  bullish: "#26a69a",
  bearish: "#ef5350",
  line: "#2962ff",
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

interface DrawingLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface AssetChartProps {
  symbol: string
  poolAddress: string
  currentPrice: number
  cost: number
  deviation: number
  signal: "buy" | "sell" | "neutral"
  chartType?: "area" | "candlestick" | "line"
  onClose: () => void
}

const TIMEFRAMES = [
  { label: "1m", timeframe: "minute", aggregate: "1", limit: "60" },
  { label: "5m", timeframe: "minute", aggregate: "5", limit: "60" },
  { label: "15m", timeframe: "minute", aggregate: "15", limit: "48" },
  { label: "30m", timeframe: "minute", aggregate: "30", limit: "48" },
  { label: "1H", timeframe: "hour", aggregate: "1", limit: "24" },
  { label: "1D", timeframe: "day", aggregate: "1", limit: "30" },
  { label: "1W", timeframe: "day", aggregate: "7", limit: "52" },
  { label: "1M", timeframe: "day", aggregate: "30", limit: "12" },
] as const

export function AssetChart({ symbol, poolAddress, currentPrice, cost, deviation, signal, chartType: propChartType, onClose }: AssetChartProps) {
  const { t, locale } = useI18n()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState(4) // default 1H
  const [showVolume, setShowVolume] = useState(false)
  const [chartType, setChartType] = useState<"line" | "candle" | "area">(propChartType === "candlestick" ? "candle" : propChartType === "area" ? "area" : "line")
  const [isDrawing, setIsDrawing] = useState(false)
  const [lines, setLines] = useState<DrawingLine[]>([])
  const [currentLine, setCurrentLine] = useState<{ x1: number; y1: number } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!poolAddress) {
      setLoading(false)
      return
    }
    
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      const tf = TIMEFRAMES[activeTimeframe]
      try {
        const res = await fetch(`/api/ohlcv/${poolAddress}?timeframe=${tf.timeframe}&aggregate=${tf.aggregate}&limit=${tf.limit}`)
        if (!cancelled && res.ok) {
          const data = await res.json()
          setCandles(data.candles ?? [])
        } else if (!cancelled) {
          setCandles([])
        }
      } catch {
        if (!cancelled) setCandles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    fetchData()
    return () => { cancelled = true }
  }, [activeTimeframe, poolAddress])

  const priceChange = candles.length > 1 ? candles[candles.length - 1].close - candles[0].open : 0
  const priceChangePercent = candles.length > 1 && candles[0].open > 0
    ? ((priceChange / candles[0].open) * 100)
    : 0
  const isPositive = priceChange >= 0

  const allPrices = candles.flatMap(c => [c.high, c.low])
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.998 : 0
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.002 : 0
  const priceRange = maxPrice - minPrice

  const chartWidth = 800
  const chartHeight = showVolume ? 400 : 500
  const candleWidth = Math.max(chartWidth / candles.length * 0.6, 2)
  const spacing = chartWidth / Math.max(candles.length, 1)

  const yScale = (price: number) => {
    if (priceRange === 0) return chartHeight / 2
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentLine({ x1: x, y1: y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentLine || !isDrawing || !chartRef.current) return
    // Preview handled via canvas rendering
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!currentLine || !isDrawing || !chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLines([...lines, { x1: currentLine.x1, y1: currentLine.y1, x2: x, y2: y }])
    setCurrentLine(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl border-[#363a45] shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: TV_COLORS.bg }}>
        <CardHeader className="pb-2 border-b border-[#363a45]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-semibold font-mono" style={{ color: TV_COLORS.textLight }}>
                  {symbol}/USDC
                </CardTitle>
                {signal === "buy" && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400">BUY</Badge>}
                {signal === "sell" && <Badge className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400">SELL</Badge>}
                {!loading && candles.length > 1 && (
                  <span className={`text-sm font-mono font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: TV_COLORS.text }}>
                <span>Last: <span className="font-mono" style={{ color: TV_COLORS.textLight }}>{formatPrice(currentPrice)}</span></span>
                <span>Cost: <span className="font-mono" style={{ color: TV_COLORS.costLine }}>{formatPrice(cost)}</span></span>
                <span>Dev: <span className={`font-mono font-medium ${signal === "buy" ? "text-emerald-400" : signal === "sell" ? "text-red-400" : ""}`}>{deviation > 0 ? "+" : ""}{deviation.toFixed(1)}%</span></span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 hover:bg-[#363a45]" style={{ color: TV_COLORS.text }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-0.5 pt-3">
            {TIMEFRAMES.map((tf, i) => (
              <button
                key={tf.label}
                className={`h-6 px-2 text-[11px] font-medium rounded transition-colors ${
                  activeTimeframe === i ? "bg-blue-600 text-white" : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
                }`}
                onClick={() => setActiveTimeframe(i)}
              >
                {tf.label}
              </button>
            ))}
            <div className="mx-2 h-4 w-px bg-[#363a45]" />
            <button
              className={`h-6 px-2 rounded transition-colors text-[11px] font-medium ${
                chartType === "candle" ? "bg-blue-600 text-white" : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
              }`}
              onClick={() => setChartType(chartType === "line" ? "candle" : "line")}
            >
              Candles
            </button>
            <button
              className={`h-6 px-2 rounded transition-colors text-[11px] font-medium ${
                showVolume ? "bg-blue-600 text-white" : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
              }`}
              onClick={() => setShowVolume(!showVolume)}
            >
              <BarChart3 className="h-3.5 w-3.5 inline" />
            </button>
            <button
              className={`h-6 px-2 rounded transition-colors text-[11px] font-medium ${
                isDrawing ? "bg-yellow-600 text-white" : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
              }`}
              onClick={() => setIsDrawing(!isDrawing)}
            >
              Draw
            </button>
            {lines.length > 0 && (
              <button
                className="h-6 px-2 rounded text-[11px] font-medium text-[#787b86] hover:text-red-400"
                onClick={() => setLines([])}
              >
                Clear
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-96" style={{ backgroundColor: TV_COLORS.bg }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: TV_COLORS.line }} />
            </div>
          ) : candles.length === 0 ? (
            <div className="flex items-center justify-center h-96 text-sm" style={{ backgroundColor: TV_COLORS.bg, color: TV_COLORS.text }}>
              No data available for {symbol}
            </div>
          ) : (
            <div style={{ backgroundColor: TV_COLORS.bg }}>
              <div
                ref={chartRef}
                className="relative cursor-crosshair"
                style={{ width: "100%", aspectRatio: "2 / 1" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <svg 
                  width={chartWidth} 
                  height={chartHeight} 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id={`candle-gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  {/* Grid */}
                  {[0.25, 0.5, 0.75].map((pct, i) => (
                    <line
                      key={`grid-h-${i}`}
                      x1={0}
                      y1={chartHeight * pct}
                      x2={chartWidth}
                      y2={chartHeight * pct}
                      stroke={TV_COLORS.grid}
                      strokeWidth={1}
                      opacity={0.3}
                    />
                  ))}

                  {/* Cost reference line */}
                  {cost > 0 && cost >= minPrice && cost <= maxPrice && (
                    <>
                      <line
                        x1={0}
                        y1={yScale(cost)}
                        x2={chartWidth}
                        y2={yScale(cost)}
                        stroke={TV_COLORS.costLine}
                        strokeWidth={1}
                        strokeDasharray="4 2"
                      />
                      <text x={5} y={yScale(cost) - 3} fontSize={10} fill={TV_COLORS.costLine}>
                        Cost: {formatPrice(cost)}
                      </text>
                    </>
                  )}

                  {/* Candles or Line */}
                  {chartType === "candle" ? (
                    candles.map((candle, i) => {
                      const x = i * spacing + spacing / 2
                      const isUp = candle.close >= candle.open
                      const color = isUp ? TV_COLORS.bullish : TV_COLORS.bearish

                      const yOpen = yScale(candle.open)
                      const yClose = yScale(candle.close)
                      const yHigh = yScale(candle.high)
                      const yLow = yScale(candle.low)

                      const bodyTop = Math.min(yOpen, yClose)
                      const bodyHeight = Math.abs(yClose - yOpen) || 1

                      return (
                        <g key={i}>
                          <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth={1} />
                          <rect
                            x={x - candleWidth / 2}
                            y={bodyTop}
                            width={candleWidth}
                            height={Math.max(bodyHeight, 1)}
                            fill={isUp ? color : "transparent"}
                            stroke={color}
                            strokeWidth={1}
                          />
                        </g>
                      )
                    })
                  ) : (
                    <polyline
                      points={candles.map((c, i) => `${i * spacing + spacing / 2},${yScale(c.close)}`).join(" ")}
                      fill="none"
                      stroke={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish}
                      strokeWidth={2}
                    />
                  )}

                  {/* User drawn lines */}
                  {lines.map((line, i) => (
                    <line
                      key={i}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#ffeb3b"
                      strokeWidth={2}
                    />
                  ))}
                </svg>

                {/* Y-axis labels */}
                <div className="absolute right-0 top-0 h-full w-16 flex flex-col justify-between text-[10px] pr-1 pointer-events-none" style={{ color: TV_COLORS.text }}>
                  <span className="text-right">{formatPrice(maxPrice)}</span>
                  <span className="text-right">{formatPrice((minPrice + maxPrice) / 2)}</span>
                  <span className="text-right">{formatPrice(minPrice)}</span>
                </div>
              </div>

              {/* Volume chart */}
              {showVolume && (
                <div style={{ backgroundColor: TV_COLORS.bg, borderTop: `1px solid ${TV_COLORS.grid}`, position: "relative", width: "100%", aspectRatio: "6 / 1" }}>
                  <svg width={chartWidth} height={80} viewBox={`0 0 ${chartWidth} 80`} preserveAspectRatio="none" className="w-full h-full">
                    {(() => {
                      const maxVol = Math.max(...candles.map(c => c.volume), 1)
                      return candles.map((candle, i) => {
                        const x = i * spacing + spacing / 2
                        const isUp = candle.close >= candle.open
                        const h = (candle.volume / maxVol) * 70
                        return (
                          <rect
                            key={i}
                            x={x - candleWidth / 2}
                            y={80 - h}
                            width={candleWidth}
                            height={h}
                            fill={isUp ? TV_COLORS.bullish : TV_COLORS.bearish}
                            opacity={0.4}
                          />
                        )
                      })
                    })()}
                  </svg>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

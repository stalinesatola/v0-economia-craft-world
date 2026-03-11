"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, TrendingDown, BarChart3, Loader2, Minus, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"

// TradingView-inspired color palette
const TV_COLORS = {
  bg: "#131722",
  grid: "#1e222d",
  gridLine: "#363a45",
  text: "#787b86",
  textLight: "#d1d4dc",
  bullish: "#26a69a",
  bearish: "#ef5350",
  bullishBg: "rgba(38, 166, 154, 0.12)",
  bearishBg: "rgba(239, 83, 80, 0.12)",
  line: "#2962ff",
  volume: "#5d606b",
  costLine: "#ff9800",
  drawLine: "#ffeb3b",
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
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
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

// Candlestick Icon SVG component
function CandleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="9" y="6" width="2" height="12" rx="0.5" />
      <line x1="10" y1="3" x2="10" y2="6" />
      <line x1="10" y1="18" x2="10" y2="21" />
      <rect x="15" y="8" width="2" height="8" rx="0.5" fill="currentColor" />
      <line x1="16" y1="5" x2="16" y2="8" />
      <line x1="16" y1="16" x2="16" y2="19" />
    </svg>
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
  const [activeTimeframe, setActiveTimeframe] = useState(5)
  const [showVolume, setShowVolume] = useState(false)
  const [chartType, setChartType] = useState<"line" | "candle">("line")
  
  // Drawing tools state
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState(false)
  const [lines, setLines] = useState<DrawingLine[]>([])
  const [currentLine, setCurrentLine] = useState<{ x1: number; y1: number } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

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

  // Calculate price range
  const allPrices = candles.flatMap(c => [c.high, c.low])
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.998 : 0
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.002 : 0
  const priceRange = maxPrice - minPrice

  // Chart dimensions
  const chartWidth = 600
  const chartHeight = showVolume ? 200 : 260
  const volumeHeight = 60
  const padding = { top: 10, right: 60, bottom: 20, left: 10 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Scale functions
  const xScale = (index: number) => padding.left + (index / (candles.length - 1 || 1)) * innerWidth
  const yScale = (price: number) => padding.top + ((maxPrice - price) / (priceRange || 1)) * innerHeight
  const volumeScale = (vol: number) => {
    const maxVol = Math.max(...candles.map(c => c.volume)) || 1
    return volumeHeight - (vol / maxVol) * (volumeHeight - 10)
  }

  // Drawing handlers
  const getMousePos = (e: React.MouseEvent) => {
    if (!chartRef.current) return { x: 0, y: 0 }
    const rect = chartRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * chartWidth,
      y: ((e.clientY - rect.top) / rect.height) * chartHeight,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawingMode) return
    const pos = getMousePos(e)
    setCurrentLine({ x1: pos.x, y1: pos.y })
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentLine) return
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !currentLine) return
    const pos = getMousePos(e)
    const newLine: DrawingLine = {
      id: Date.now().toString(),
      x1: currentLine.x1,
      y1: currentLine.y1,
      x2: pos.x,
      y2: pos.y,
      color: TV_COLORS.drawLine,
    }
    setLines([...lines, newLine])
    setCurrentLine(null)
    setIsDrawing(false)
  }

  const clearLines = () => {
    setLines([])
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(locale === "pt" ? "pt-PT" : "en-US", {
      month: "short",
      day: "2-digit",
      ...(activeTimeframe <= 4 ? { hour: "2-digit", minute: "2-digit" } : {}),
    })
  }

  // Generate grid lines
  const gridLines = {
    horizontal: Array.from({ length: 5 }, (_, i) => minPrice + (priceRange * i) / 4),
    vertical: candles.length > 0 ? candles.filter((_, i) => i % Math.ceil(candles.length / 6) === 0) : [],
  }

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

          {/* Toolbar */}
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
              onClick={() => setChartType(chartType === "line" ? "candle" : "line")}
              title="Candlestick"
            >
              <CandleIcon className="h-3.5 w-3.5" />
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
            <div className="mx-2 h-4 w-px bg-[#363a45]" />
            <button
              className={`h-6 px-2 rounded transition-colors flex items-center gap-1 ${
                drawingMode 
                  ? "bg-[#ffeb3b] text-black" 
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
              }`}
              onClick={() => setDrawingMode(!drawingMode)}
              title="Draw Line"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            {lines.length > 0 && (
              <button
                className="h-6 px-2 rounded transition-colors text-[#787b86] hover:text-[#ef5350] hover:bg-[#2a2e39]"
                onClick={clearLines}
                title="Clear Lines"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
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
              {/* Main Chart SVG */}
              <div 
                ref={chartRef}
                className={`relative ${drawingMode ? "cursor-crosshair" : ""}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full"
                  style={{ height: showVolume ? "200px" : "260px" }}
                >
                  {/* Grid */}
                  {gridLines.horizontal.map((price, i) => (
                    <g key={`h-${i}`}>
                      <line
                        x1={padding.left}
                        y1={yScale(price)}
                        x2={chartWidth - padding.right}
                        y2={yScale(price)}
                        stroke={TV_COLORS.gridLine}
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={chartWidth - padding.right + 5}
                        y={yScale(price) + 3}
                        fill={TV_COLORS.text}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {formatPrice(price)}
                      </text>
                    </g>
                  ))}

                  {/* Cost reference line */}
                  {cost > 0 && cost >= minPrice && cost <= maxPrice && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={yScale(cost)}
                        x2={chartWidth - padding.right}
                        y2={yScale(cost)}
                        stroke={TV_COLORS.costLine}
                        strokeWidth="1"
                        strokeDasharray="4,2"
                      />
                      <text
                        x={padding.left + 5}
                        y={yScale(cost) - 5}
                        fill={TV_COLORS.costLine}
                        fontSize="9"
                      >
                        Cost: {formatPrice(cost)}
                      </text>
                    </g>
                  )}

                  {/* Chart Data */}
                  {chartType === "line" ? (
                    // Line chart
                    <path
                      d={candles.map((c, i) => 
                        `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(c.close)}`
                      ).join(" ")}
                      fill="none"
                      stroke={isPositive ? TV_COLORS.bullish : TV_COLORS.bearish}
                      strokeWidth="1.5"
                    />
                  ) : (
                    // Candlestick chart
                    candles.map((c, i) => {
                      const x = xScale(i)
                      const isUp = c.close >= c.open
                      const color = isUp ? TV_COLORS.bullish : TV_COLORS.bearish
                      const candleWidth = Math.max(innerWidth / candles.length * 0.7, 2)
                      
                      return (
                        <g key={i}>
                          {/* Wick */}
                          <line
                            x1={x}
                            y1={yScale(c.high)}
                            x2={x}
                            y2={yScale(c.low)}
                            stroke={color}
                            strokeWidth="1"
                          />
                          {/* Body */}
                          <rect
                            x={x - candleWidth / 2}
                            y={yScale(Math.max(c.open, c.close))}
                            width={candleWidth}
                            height={Math.max(Math.abs(yScale(c.open) - yScale(c.close)), 1)}
                            fill={isUp ? color : "transparent"}
                            stroke={color}
                            strokeWidth="1"
                          />
                        </g>
                      )
                    })
                  )}

                  {/* Drawing lines */}
                  {lines.map((line) => (
                    <line
                      key={line.id}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={line.color}
                      strokeWidth="2"
                    />
                  ))}

                  {/* X-axis labels */}
                  {candles.filter((_, i) => i % Math.ceil(candles.length / 6) === 0).map((c, i, arr) => {
                    const idx = candles.indexOf(c)
                    return (
                      <text
                        key={i}
                        x={xScale(idx)}
                        y={chartHeight - 5}
                        fill={TV_COLORS.text}
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {formatDate(c.timestamp)}
                      </text>
                    )
                  })}
                </svg>

                {/* Crosshair tooltip would go here */}
              </div>

              {/* Volume Chart */}
              {showVolume && (
                <div className="border-t border-[#363a45]">
                  <svg viewBox={`0 0 ${chartWidth} ${volumeHeight}`} className="w-full" style={{ height: "60px" }}>
                    {candles.map((c, i) => {
                      const x = xScale(i)
                      const barWidth = Math.max(innerWidth / candles.length * 0.7, 2)
                      const isUp = c.close >= c.open
                      
                      return (
                        <rect
                          key={i}
                          x={x - barWidth / 2}
                          y={volumeScale(c.volume)}
                          width={barWidth}
                          height={volumeHeight - volumeScale(c.volume)}
                          fill={isUp ? TV_COLORS.bullish : TV_COLORS.bearish}
                          opacity={0.5}
                        />
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-[#363a45] text-[10px]" style={{ color: TV_COLORS.text }}>
                <span>GeckoTerminal Data</span>
                <div className="flex items-center gap-3">
                  {drawingMode && <span className="text-[#ffeb3b]">Drawing Mode ON - Click and drag to draw</span>}
                  <span>{TIMEFRAMES[activeTimeframe].label} Chart</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

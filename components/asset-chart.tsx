"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, BarChart3, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"

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
  const { t } = useI18n()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState(4)
  const [showVolume, setShowVolume] = useState(false)
  const [chartType, setChartType] = useState<"line" | "candle">(propChartType === "candlestick" ? "candle" : "line")
  const [isDrawing, setIsDrawing] = useState(false)
  const [lines, setLines] = useState<DrawingLine[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  useEffect(() => {
    if (!canvasRef.current || candles.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    try {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      // Background
      ctx.fillStyle = TV_COLORS.bg
      ctx.fillRect(0, 0, width, height)

      // Calculate prices - safeguard against empty arrays
      const allPrices = candles.flatMap(c => [c.high, c.low])
      if (allPrices.length === 0) return

      const minPrice = Math.min(...allPrices) * 0.998
      const maxPrice = Math.max(...allPrices) * 1.002
      const priceRange = maxPrice - minPrice

      if (priceRange === 0) return

      // Dimensions
      const chartLeft = 50
      const chartRight = width - 60
      const chartTop = 20
      const chartBottom = showVolume ? height - 100 : height - 40
      const chartW = chartRight - chartLeft
      const chartH = chartBottom - chartTop

      // Helper functions
      const yScale = (price: number) => chartBottom - ((price - minPrice) / priceRange) * chartH
      const xScale = (index: number) => {
        if (candles.length === 1) return chartLeft + chartW / 2
        return chartLeft + (index / (candles.length - 1)) * chartW
      }

      // Grid lines
      ctx.strokeStyle = TV_COLORS.grid
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.3
      for (let i = 0; i <= 4; i++) {
        const y = chartTop + (chartH / 4) * i
        ctx.beginPath()
        ctx.moveTo(chartLeft, y)
        ctx.lineTo(chartRight, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Cost line
      if (cost > 0 && cost >= minPrice && cost <= maxPrice) {
        ctx.strokeStyle = TV_COLORS.costLine
        ctx.lineWidth = 1
        ctx.setLineDash([4, 2])
        const y = yScale(cost)
        ctx.beginPath()
        ctx.moveTo(chartLeft, y)
        ctx.lineTo(chartRight, y)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = TV_COLORS.costLine
        ctx.font = "10px monospace"
        ctx.fillText(`Cost: ${formatPrice(cost)}`, chartLeft + 5, y - 5)
      }

      // Candles or line
      const candleWidth = Math.max(chartW / candles.length * 0.7, 2)
      const priceChange = candles[candles.length - 1].close - candles[0].open
      const isPositive = priceChange >= 0

      if (chartType === "candle") {
        candles.forEach((candle, i) => {
          const x = xScale(i)
          const isUp = candle.close >= candle.open
          const color = isUp ? TV_COLORS.bullish : TV_COLORS.bearish

          const yOpen = yScale(candle.open)
          const yClose = yScale(candle.close)
          const yHigh = yScale(candle.high)
          const yLow = yScale(candle.low)

          // Wick
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, yHigh)
          ctx.lineTo(x, yLow)
          ctx.stroke()

          // Body
          const bodyTop = Math.min(yOpen, yClose)
          const bodyHeight = Math.abs(yClose - yOpen) || 1

          if (isUp) {
            ctx.fillStyle = color
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
          } else {
            ctx.fillStyle = "transparent"
            ctx.strokeStyle = color
            ctx.lineWidth = 1
            ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
          }
        })
      } else {
        // Line chart
        ctx.strokeStyle = isPositive ? TV_COLORS.bullish : TV_COLORS.bearish
        ctx.lineWidth = 2
        ctx.beginPath()
        candles.forEach((c, i) => {
          const x = xScale(i)
          const y = yScale(c.close)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.stroke()

        // Fill under line
        ctx.lineTo(chartRight, chartBottom)
        ctx.lineTo(chartLeft, chartBottom)
        ctx.closePath()
        ctx.fillStyle = isPositive ? TV_COLORS.bullish + "20" : TV_COLORS.bearish + "20"
        ctx.fill()
      }

      // Volume
      if (showVolume) {
        const volTop = chartBottom + 10
        const volHeight = height - volTop - 30
        const maxVol = Math.max(...candles.map(c => c.volume), 1)

        if (maxVol > 0) {
          candles.forEach((c, i) => {
            const x = xScale(i)
            const isUp = c.close >= c.open
            const h = (c.volume / maxVol) * volHeight
            ctx.fillStyle = isUp ? TV_COLORS.bullish + "60" : TV_COLORS.bearish + "60"
            ctx.fillRect(x - candleWidth / 2, volTop + volHeight - h, candleWidth, h)
          })
        }
      }

      // User lines
      lines.forEach(line => {
        ctx.strokeStyle = "#ffeb3b"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()
      })

      // Y-axis labels
      ctx.fillStyle = TV_COLORS.text
      ctx.font = "10px monospace"
      ctx.textAlign = "right"
      for (let i = 0; i <= 4; i++) {
        const price = minPrice + (priceRange / 4) * i
        const y = chartBottom - (chartH / 4) * i
        ctx.fillText(formatPrice(price), chartRight + 10, y + 3)
      }
    } catch (err) {
      console.error("[v0] Canvas rendering error:", err)
    }
  }, [candles, showVolume, chartType, lines])

  const priceChange = candles.length > 1 ? candles[candles.length - 1].close - candles[0].open : 0
  const isPositive = priceChange >= 0

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const handleMove = (moveE: MouseEvent) => {
      // Live preview would go here
    }
    
    const handleUp = (upE: MouseEvent) => {
      const x2 = upE.clientX - rect.left
      const y2 = upE.clientY - rect.top
      setLines([...lines, { x1: x, y1: y, x2, y2 }])
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
    }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-5xl border-[#363a45] shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: TV_COLORS.bg }}>
        <CardHeader className="pb-2 border-b border-[#363a45]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-semibold font-mono" style={{ color: TV_COLORS.textLight }}>
                  {symbol}/USDC
                </CardTitle>
                {signal === "buy" && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400">BUY</Badge>}
                {signal === "sell" && <Badge className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400">SELL</Badge>}
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
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: showVolume ? "500px" : "400px", backgroundColor: TV_COLORS.bg }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={() => {}}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

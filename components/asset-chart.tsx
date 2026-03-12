"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { createChart, ColorType, type IChartApi, type ISeriesApi, type SeriesMarker } from "lightweight-charts"
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

export function AssetChart({
  symbol,
  poolAddress,
  currentPrice,
  cost,
  deviation,
  signal,
  chartType: propChartType,
  onClose,
}: AssetChartProps) {
  const { t } = useI18n()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState(4)
  const [showVolume, setShowVolume] = useState(false)
  const [chartType, setChartType] = useState<"line" | "candle">(
    propChartType === "candlestick" ? "candle" : "line"
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  // Initialize chart on mount
  useLayoutEffect(() => {
    if (!containerRef.current || chartRef.current) return

    try {
      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: TV_COLORS.bg },
          textColor: TV_COLORS.text,
          fontSize: 12,
          fontFamily: "monospace",
        },
        width: containerRef.current.clientWidth,
        height: showVolume ? 500 : 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
        },
        grid: {
          horzLines: { color: TV_COLORS.grid, visible: true },
          vertLines: { color: TV_COLORS.grid, visible: false },
        },
        crosshair: {
          mode: 2, // Both price and time
          vertLine: { color: TV_COLORS.grid, width: 1, style: 2 },
          horzLine: { color: TV_COLORS.grid, width: 1, style: 2 },
        },
      })

      chartRef.current = chart

      // Handle window resize
      const handleResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
        }
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    } catch (err) {
      console.error("[v0] Chart creation error:", err)
    }
  }, [])

  // Fetch OHLCV data
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
        const res = await fetch(
          `/api/ohlcv/${poolAddress}?timeframe=${tf.timeframe}&aggregate=${tf.aggregate}&limit=${tf.limit}`
        )
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            setCandles(data.candles ?? [])
          } else {
            setCandles([])
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setCandles([])
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [activeTimeframe, poolAddress])

  // Initialize and manage chart using useLayoutEffect to avoid flicker
  useLayoutEffect(() => {
    if (!chartRef.current || candles.length === 0) return

    try {
      const chart = chartRef.current

      // Verify chart exists before using it
      if (!chart) {
        console.error("[v0] Chart reference is null")
        return
      }

      // Update chart height when volume visibility changes
      chart.applyOptions({
        height: showVolume ? 500 : 400,
      })

      // Remove existing series safely
      if (candlestickSeriesRef.current && chart) {
        try {
          chart.removeSeries(candlestickSeriesRef.current)
        } catch (e) {
          console.warn("[v0] Error removing candlestick series:", e)
        }
        candlestickSeriesRef.current = null
      }
      if (lineSeriesRef.current && chart) {
        try {
          chart.removeSeries(lineSeriesRef.current)
        } catch (e) {
          console.warn("[v0] Error removing line series:", e)
        }
        lineSeriesRef.current = null
      }
      if (volumeSeriesRef.current && chart) {
        try {
          chart.removeSeries(volumeSeriesRef.current)
        } catch (e) {
          console.warn("[v0] Error removing volume series:", e)
        }
        volumeSeriesRef.current = null
      }

      // Transform candles to chart format (time in seconds)
      const chartData = candles.map((c) => ({
        time: Math.floor(c.timestamp / 1000) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))

      const volumeData = candles.map((c) => ({
        time: Math.floor(c.timestamp / 1000) as any,
        value: c.volume,
        color: c.close >= c.open ? TV_COLORS.bullish + "80" : TV_COLORS.bearish + "80",
      }))

      // Add appropriate series based on chart type
      if (chartType === "candle") {
        candlestickSeriesRef.current = chart.addCandlestickSeries({
          upColor: TV_COLORS.bullish,
          downColor: TV_COLORS.bearish,
          borderUpColor: TV_COLORS.bullish,
          borderDownColor: TV_COLORS.bearish,
          wickUpColor: TV_COLORS.bullish,
          wickDownColor: TV_COLORS.bearish,
        })
        candlestickSeriesRef.current.setData(chartData)

        // Add markers
        const markers: SeriesMarker<any>[] = []
        if (cost > 0) {
          markers.push({
            time: chartData[0].time,
            position: "inBar",
            color: TV_COLORS.costLine,
            shape: "square",
            text: `Cost: ${formatPrice(cost)}`,
          })
        }
        candlestickSeriesRef.current.setMarkers(markers)
      } else {
        lineSeriesRef.current = chart.addLineSeries({
          color: TV_COLORS.line,
          lineWidth: 2,
          crosshairMarkerVisible: true,
        })
        lineSeriesRef.current.setData(chartData)
      }

      // Add volume series if visible
      if (showVolume) {
        volumeSeriesRef.current = chart.addHistogramSeries({
          color: TV_COLORS.bullish,
          priceFormat: {
            type: "volume",
          },
        })
        volumeSeriesRef.current.setData(volumeData)
      }

      // Fit content
      chart.timeScale().fitContent()

      // Ensure proper rendering
      chart.applyOptions({})
    } catch (err) {
      console.error("[v0] Chart rendering error:", err)
    }
  }, [candles, chartType, showVolume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (err) {
          console.warn("[v0] Error cleaning up chart:", err)
        }
        chartRef.current = null
      }
    }
  }, [])

  const priceChange =
    candles.length > 1 ? candles[candles.length - 1].close - candles[0].open : 0
  const chartIsPositive = priceChange >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card
        className="w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: TV_COLORS.bg, borderColor: "#363a45" }}
      >
        <CardHeader className="pb-2 border-b" style={{ borderColor: "#363a45" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-base font-semibold font-mono" style={{ color: TV_COLORS.textLight }}>
                  {symbol}/USDC
                </CardTitle>
                {signal === "buy" && (
                  <Badge
                    className="text-[10px] px-1.5 py-0"
                    style={{ backgroundColor: TV_COLORS.bullish + "20", color: TV_COLORS.bullish }}
                  >
                    BUY
                  </Badge>
                )}
                {signal === "sell" && (
                  <Badge
                    className="text-[10px] px-1.5 py-0"
                    style={{ backgroundColor: TV_COLORS.bearish + "20", color: TV_COLORS.bearish }}
                  >
                    SELL
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: TV_COLORS.text }}>
                <span>
                  Last:{" "}
                  <span className="font-mono" style={{ color: TV_COLORS.textLight }}>
                    {formatPrice(currentPrice)}
                  </span>
                </span>
                <span>
                  Cost:{" "}
                  <span className="font-mono" style={{ color: TV_COLORS.costLine }}>
                    {formatPrice(cost)}
                  </span>
                </span>
                <span>
                  Dev:{" "}
                  <span
                    className="font-mono font-medium"
                    style={{
                      color:
                        signal === "buy"
                          ? TV_COLORS.bullish
                          : signal === "sell"
                            ? TV_COLORS.bearish
                            : TV_COLORS.text,
                    }}
                  >
                    {deviation > 0 ? "+" : ""}
                    {deviation.toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 flex-shrink-0"
              style={{ color: TV_COLORS.text }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeframe buttons */}
          <div className="flex flex-wrap items-center gap-0.5 pt-3">
            {TIMEFRAMES.map((tf, i) => (
              <button
                key={tf.label}
                className="h-6 px-2 text-[11px] font-medium rounded transition-colors"
                style={{
                  backgroundColor: activeTimeframe === i ? TV_COLORS.line : "transparent",
                  color: activeTimeframe === i ? "white" : TV_COLORS.text,
                }}
                onClick={() => setActiveTimeframe(i)}
              >
                {tf.label}
              </button>
            ))}
            <div className="mx-2 h-4 w-px" style={{ backgroundColor: TV_COLORS.grid }} />

            {/* Chart type toggle */}
            <button
              className="h-6 px-2 rounded transition-colors text-[11px] font-medium"
              style={{
                backgroundColor: chartType === "candle" ? TV_COLORS.line : "transparent",
                color: chartType === "candle" ? "white" : TV_COLORS.text,
              }}
              onClick={() => setChartType(chartType === "line" ? "candle" : "line")}
            >
              {chartType === "candle" ? "📊" : "📈"}
            </button>

            {/* Volume toggle */}
            <button
              className="h-6 px-2 rounded transition-colors text-[11px] font-medium"
              style={{
                backgroundColor: showVolume ? TV_COLORS.line : "transparent",
                color: showVolume ? "white" : TV_COLORS.text,
              }}
              onClick={() => setShowVolume(!showVolume)}
            >
              <BarChart3 className="h-3.5 w-3.5 inline" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-96" style={{ backgroundColor: TV_COLORS.bg }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: TV_COLORS.line }} />
            </div>
          ) : candles.length === 0 ? (
            <div
              className="flex items-center justify-center h-96 text-sm"
              style={{ backgroundColor: TV_COLORS.bg, color: TV_COLORS.text }}
            >
              No data available
            </div>
          ) : (
            <div
              ref={containerRef}
              style={{ width: "100%", height: showVolume ? "500px" : "400px" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

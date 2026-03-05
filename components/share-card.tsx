"use client"

import { useCallback, useState } from "react"
import { Share2, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/craft-data"
import { useI18n } from "@/lib/i18n"
import { RESOURCE_COLORS } from "@/lib/resource-images"

// Extract direct asset URL from GeckoTerminal proxy URLs for CORS-safe canvas usage
// e.g. "https://www.geckoterminal.com/_next/image?url=https%3A%2F%2Fassets.geckoterminal.com%2Fxyz&w=64&q=75"
// becomes "https://assets.geckoterminal.com/xyz"
function getDirectImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    if (url.includes("/_next/image")) {
      const parsed = new URL(url)
      const inner = parsed.searchParams.get("url")
      if (inner) return inner
    }
    return url
  } catch {
    return url
  }
}

interface ShareCardProps {
  symbol: string
  marketPrice: number
  cost: number
  deviation: number
  signal: "buy" | "sell" | "neutral"
  change24h: number
  volume: number
  imageUrl?: string
  coinPrice?: number
  inputs?: { resource: string; quantity: number; unitPrice: number; subtotal: number }[]
}

// Canvas-based image generator
function generateCardImage(data: ShareCardProps, locale: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 600
    const hasCoin = data.coinPrice && data.coinPrice > 0 && data.symbol !== "DYNO COIN"
    const coinExtraH = hasCoin ? 20 : 0
    const H = data.inputs && data.inputs.length > 0 ? 440 + coinExtraH + data.inputs.length * 28 : 380 + coinExtraH
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")
    if (!ctx) return reject(new Error("Canvas not supported"))

    // Helper to draw the rest of the card (called after optional image load)
    const drawCard = (img?: HTMLImageElement) => {
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, "#0f1019")
      bg.addColorStop(1, "#161825")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Border
      ctx.strokeStyle = data.signal === "buy" ? "#e8a63a" : data.signal === "sell" ? "#e05252" : "#2a2d3e"
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, W - 2, H - 2)

      // Top accent bar
      ctx.fillStyle = data.signal === "buy" ? "#e8a63a" : data.signal === "sell" ? "#e05252" : "#3b82f6"
      ctx.fillRect(0, 0, W, 4)

      // Header
      ctx.font = "bold 13px 'JetBrains Mono', monospace"
      ctx.fillStyle = "#8b8fa3"
      ctx.textAlign = "left"
      ctx.fillText("CRAFT WORLD - ECONOMY", 24, 36)

      // Signal badge
      if (data.signal !== "neutral") {
        const badgeText = data.signal === "buy"
          ? (locale === "pt" ? "COMPRAR" : "BUY")
          : (locale === "pt" ? "VENDER" : "SELL")
        const badgeColor = data.signal === "buy" ? "#e8a63a" : "#e05252"
        ctx.font = "bold 12px 'JetBrains Mono', monospace"
        const tw = ctx.measureText(badgeText).width
        const bx = W - 24 - tw - 16
        ctx.fillStyle = badgeColor + "30"
        ctx.beginPath()
        ctx.roundRect(bx, 20, tw + 16, 24, 4)
        ctx.fill()
        ctx.fillStyle = badgeColor
        ctx.fillText(badgeText, bx + 8, 37)
      }

      // Resource icon (always drawn) + Symbol
      const iconCx = 24 + 22
      const iconCy = 72
      const iconR = 22
      const symbolX = 24 + 44 + 10

      if (img) {
        // Draw image in circular clip
        ctx.save()
        ctx.beginPath()
        ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, 24, 50, 44, 44)
        ctx.restore()
      } else {
        // Draw colored circle with initials as fallback
        const color = RESOURCE_COLORS[data.symbol] ?? "#666666"
        ctx.save()
        ctx.beginPath()
        ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()
        // Initials
        ctx.font = "bold 16px 'JetBrains Mono', monospace"
        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(data.symbol.slice(0, 2), iconCx, iconCy)
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"
      }
      // Ring around icon
      ctx.strokeStyle = "#2a2d3e"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
      ctx.stroke()

      ctx.font = "bold 28px 'JetBrains Mono', monospace"
      ctx.fillStyle = "#f0f0f5"
      ctx.fillText(data.symbol, symbolX, 80)

      // Price
      ctx.font = "bold 36px 'JetBrains Mono', monospace"
      ctx.fillStyle = "#ffffff"
      ctx.fillText(formatPrice(data.marketPrice), 24, 128)

      // COIN value below USD price
      let coinOffsetY = 0
      if (hasCoin && data.coinPrice && data.symbol !== "DYNO COIN") {
        const coinValue = data.marketPrice / data.coinPrice
        ctx.font = "bold 14px 'JetBrains Mono', monospace"
        ctx.fillStyle = "#FFD700"
        ctx.fillText(`${coinValue.toFixed(2)} DYNO`, 24, 148)
        coinOffsetY = 20
      }

      // Change 24h
      const changeText = `${data.change24h >= 0 ? "+" : ""}${data.change24h.toFixed(1)}% (24h)`
      ctx.font = "bold 14px 'JetBrains Mono', monospace"
      ctx.fillStyle = data.change24h >= 0 ? "#e8a63a" : "#e05252"
      ctx.fillText(changeText, 24, 155 + coinOffsetY)

      // Separator
      ctx.strokeStyle = "#2a2d3e"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(24, 170 + coinOffsetY)
      ctx.lineTo(W - 24, 170 + coinOffsetY)
      ctx.stroke()

      // Cost + Deviation + Volume
      let y = 195 + coinOffsetY
      ctx.font = "13px 'JetBrains Mono', monospace"
      ctx.fillStyle = "#8b8fa3"

      const costLabel = locale === "pt" ? "Custo de Producao" : "Production Cost"
      ctx.fillText(costLabel, 24, y)
      ctx.fillStyle = "#f0f0f5"
      ctx.textAlign = "right"
      ctx.fillText(data.cost > 0 ? formatPrice(data.cost) : "--", W - 24, y)
      ctx.textAlign = "left"

      y += 26
      ctx.fillStyle = "#8b8fa3"
      const devLabel = locale === "pt" ? "Desvio" : "Deviation"
      ctx.fillText(devLabel, 24, y)
      ctx.fillStyle = data.signal === "buy" ? "#e8a63a" : data.signal === "sell" ? "#e05252" : "#8b8fa3"
      ctx.textAlign = "right"
      ctx.fillText(data.cost > 0 ? `${data.deviation > 0 ? "+" : ""}${data.deviation.toFixed(1)}%` : "--", W - 24, y)
      ctx.textAlign = "left"

      y += 26
      ctx.fillStyle = "#8b8fa3"
      ctx.fillText("Volume 24h", 24, y)
      ctx.fillStyle = "#f0f0f5"
      ctx.textAlign = "right"
      ctx.fillText(formatPrice(data.volume), W - 24, y)
      ctx.textAlign = "left"

      // Inputs
      if (data.inputs && data.inputs.length > 0) {
        y += 20
        ctx.strokeStyle = "#2a2d3e"
        ctx.beginPath()
        ctx.moveTo(24, y)
        ctx.lineTo(W - 24, y)
        ctx.stroke()

        y += 22
        ctx.font = "bold 11px 'JetBrains Mono', monospace"
        ctx.fillStyle = "#8b8fa3"
        ctx.fillText("INPUTS", 24, y)

        ctx.font = "12px 'JetBrains Mono', monospace"
        for (const inp of data.inputs) {
          y += 24
          ctx.fillStyle = "#8b8fa3"
          ctx.fillText(`${inp.quantity}x ${inp.resource}`, 36, y)
          ctx.fillStyle = "#5a5e73"
          const unitText = `($${inp.unitPrice.toFixed(6)} ${locale === "pt" ? "un." : "ea."})`
          ctx.fillText(unitText, 36 + ctx.measureText(`${inp.quantity}x ${inp.resource}  `).width, y)
          ctx.fillStyle = "#f0f0f5"
          ctx.textAlign = "right"
          ctx.fillText(inp.subtotal > 0 ? formatPrice(inp.subtotal) : "--", W - 24, y)
          ctx.textAlign = "left"
        }
      }

      // Footer
      ctx.fillStyle = "#2a2d3e"
      ctx.fillRect(0, H - 36, W, 36)
      ctx.font = "bold 11px 'JetBrains Mono', monospace"
      ctx.fillStyle = "#e8a63a"
      ctx.textAlign = "center"
      ctx.fillText("Craft World - Economy", W / 2, H - 13)

      // Timestamp
      ctx.font = "10px 'JetBrains Mono', monospace"
      ctx.fillStyle = "#5a5e73"
      ctx.textAlign = "right"
      const now = new Date().toLocaleString(locale === "pt" ? "pt-PT" : "en-US", { timeZone: "Europe/Lisbon" })
      ctx.fillText(now, W - 24, H - 13)

      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to generate image"))
      }, "image/png")
    }

    // Load resource image if available, then draw
    if (data.imageUrl) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => drawCard(img)
      img.onerror = () => drawCard() // Fallback without image
      img.src = data.imageUrl
    } else {
      drawCard()
    }
  })
}

export function ShareButton({ data }: { data: ShareCardProps }) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleShare = useCallback(async (platform: "x" | "telegram" | "download") => {
    setGenerating(true)
    try {
      const blob = await generateCardImage(data, locale)

      if (platform === "download") {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `craft-world-${data.symbol.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(url)
        setOpen(false)
        return
      }

      // Try Web Share API first (mobile)
      if (navigator.share && platform !== "x") {
        const file = new File([blob], `craft-world-${data.symbol}.png`, { type: "image/png" })
        try {
          await navigator.share({
            title: `${data.symbol} - Craft World Economy`,
            text: buildShareText(data, locale),
            files: [file],
          })
          setOpen(false)
          return
        } catch {
          // fallback below
        }
      }

      // Fallback: open share URL (text only, image downloaded separately)
      const text = buildShareText(data, locale)

      if (platform === "x") {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        window.open(url, "_blank", "noopener,noreferrer")
        // Also trigger download of image
        const imgUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = imgUrl
        a.download = `craft-world-${data.symbol.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(imgUrl)
      } else if (platform === "telegram") {
        const url = `https://t.me/share/url?url=${encodeURIComponent("https://craft-world.gg")}&text=${encodeURIComponent(text)}`
        window.open(url, "_blank", "noopener,noreferrer")
        const imgUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = imgUrl
        a.download = `craft-world-${data.symbol.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(imgUrl)
      }

      setOpen(false)
    } catch (e) {
      console.error("[v0] Share error:", e)
    } finally {
      setGenerating(false)
    }
  }, [data, locale])

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
        title={t("share.title")}
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl p-2 flex flex-col gap-1 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleShare("x")}
              disabled={generating}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-card-foreground hover:bg-secondary rounded-md transition-colors w-full text-left"
            >
              <X className="h-3.5 w-3.5" />
              {t("share.shareX")}
            </button>
            <button
              onClick={() => handleShare("telegram")}
              disabled={generating}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-card-foreground hover:bg-secondary rounded-md transition-colors w-full text-left"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.73 6.65-2.87 7.97-3.44 3.79-1.58 4.58-1.86 5.09-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z" />
              </svg>
              Telegram
            </button>
            <div className="border-t border-border my-0.5" />
            <button
              onClick={() => handleShare("download")}
              disabled={generating}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-card-foreground hover:bg-secondary rounded-md transition-colors w-full text-left"
            >
              <Download className="h-3.5 w-3.5" />
              {t("share.download")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function buildShareText(data: ShareCardProps, locale: string): string {
  const signal = data.signal === "buy"
    ? (locale === "pt" ? "COMPRAR" : "BUY")
    : data.signal === "sell"
    ? (locale === "pt" ? "VENDER" : "SELL")
    : ""

  const coinLine = data.coinPrice && data.coinPrice > 0 && data.symbol !== "DYNO COIN"
    ? `(${(data.marketPrice / data.coinPrice).toFixed(2)} DYNO)`
    : ""

  const lines = [
    `${signal ? `${signal} ` : ""}${data.symbol} ${formatPrice(data.marketPrice)}`,
    coinLine,
    `${data.change24h >= 0 ? "+" : ""}${data.change24h.toFixed(1)}% (24h)`,
    data.cost > 0 ? `${locale === "pt" ? "Custo" : "Cost"}: ${formatPrice(data.cost)} | ${locale === "pt" ? "Desvio" : "Dev"}: ${data.deviation > 0 ? "+" : ""}${data.deviation.toFixed(1)}%` : "",
    "",
    "Craft World - Economy",
    "#CraftWorld #DeFi",
  ]
  return lines.filter(Boolean).join("\n")
}

import { NextResponse } from "next/server"
import { getConfig } from "@/lib/config-manager"
import { POOLS as DEFAULT_POOLS, NETWORK as DEFAULT_NETWORK } from "@/lib/craft-data"

export const dynamic = "force-dynamic"

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }
const FETCH_TIMEOUT = 15000

type PriceResult = {
  price_usd: number
  volume_usd_24h: number
  price_change_24h: number
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      headers: API_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function fetchBatch(addresses: string[], network: string): Promise<Record<string, PriceResult>> {
  const results: Record<string, PriceResult> = {}
  const joined = addresses.join(",")
  const url = `${GECKO_BASE_URL}/networks/${network}/pools/multi/${joined}`
  console.log("[v0] fetchBatch URL:", url.substring(0, 120) + "...")
  console.log("[v0] fetchBatch addresses count:", addresses.length)

  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT)
    console.log("[v0] fetchBatch response status:", res.status)
    if (!res.ok) {
      const errorText = await res.text().catch(() => "")
      console.error(`[v0] GeckoTerminal batch error: ${res.status}`, errorText.substring(0, 200))
      return results
    }
    const data = await res.json()
    console.log("[v0] fetchBatch data.data length:", data.data?.length ?? 0)
    for (const item of data.data ?? []) {
      const poolAddr = item.attributes?.address?.toLowerCase()
      if (!poolAddr) continue
      results[poolAddr] = {
        price_usd: parseFloat(item.attributes?.base_token_price_usd || "0"),
        volume_usd_24h: parseFloat(item.attributes?.volume_usd?.h24 || "0"),
        price_change_24h: parseFloat(
          item.attributes?.price_change_percentage?.h24 || "0"
        ),
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[v0] GeckoTerminal batch timeout")
    } else {
      console.error("[v0] GeckoTerminal batch error:", error)
    }
  }
  return results
}

export async function GET() {
  // Try to read from config.json, fallback to hardcoded defaults
  let pools: Record<string, string> = DEFAULT_POOLS
  let network: string = DEFAULT_NETWORK
  let productionCosts: Record<string, { cost_usd: number }> = {}
  let thresholds = { buy: 15, sell: 20 }
  let alertsConfig: Record<string, { enabled: boolean; priority: string; category: string }> = {}
  let banners: Array<{ id: string; position: string; enabled: boolean; imageUrl: string; linkUrl: string; altText: string; adScript: string }> = []

  try {
    const config = getConfig()
    pools = config.pools ?? pools
    network = config.network ?? network
    productionCosts = config.productionCosts ?? productionCosts
    thresholds = config.thresholds ?? thresholds
    alertsConfig = config.alertsConfig ?? alertsConfig
    banners = (config.banners ?? []).filter((b) => b.enabled)
    console.log("[v0] Config loaded, pools:", Object.keys(pools).length, "network:", network)
  } catch (err) {
    console.log("[v0] Config error, using defaults:", err instanceof Error ? err.message : "unknown")
  }

  const poolEntries = Object.entries(pools)
  const addresses = poolEntries.map(([, addr]) => addr).filter((a) => a.startsWith("0x"))
  console.log("[v0] Pool entries:", poolEntries.length, "addresses:", addresses.length)
  console.log("[v0] First 3 addresses:", addresses.slice(0, 3))
  console.log("[v0] Network for API:", network)

  // Split into batches of 15 for reliability (GeckoTerminal max is 30)
  const batchSize = 15
  const batches: string[][] = []
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize))
  }

  console.log("[v0] Fetching", batches.length, "batch(es) with sizes:", batches.map(b => b.length))

  // Fetch all batches in parallel
  const batchResults = await Promise.all(batches.map((batch) => fetchBatch(batch, network)))

  // Merge all results
  const allPrices: Record<string, PriceResult> = {}
  for (const result of batchResults) {
    Object.assign(allPrices, result)
  }

  console.log("[v0] allPrices count:", Object.keys(allPrices).length)
  console.log("[v0] allPrices sample keys:", Object.keys(allPrices).slice(0, 3))

  // Map pool addresses back to symbols
  const symbolPrices: Record<string, PriceResult> = {}
  for (const [symbol, addr] of poolEntries) {
    const lowerAddr = addr.toLowerCase()
    if (allPrices[lowerAddr]) {
      symbolPrices[symbol] = allPrices[lowerAddr]
    }
  }

  console.log("[v0] Final symbolPrices count:", Object.keys(symbolPrices).length)
  console.log("[v0] Final symbols:", Object.keys(symbolPrices).slice(0, 5))

  return NextResponse.json({
    prices: symbolPrices,
    timestamp: new Date().toISOString(),
    count: Object.keys(symbolPrices).length,
    productionCosts,
    thresholds,
    alertsConfig,
    banners,
  })
}

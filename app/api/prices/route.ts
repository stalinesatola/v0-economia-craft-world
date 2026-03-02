import { NextResponse } from "next/server"
import { getConfig } from "@/lib/config-manager"
import { POOLS as DEFAULT_POOLS, NETWORK as DEFAULT_NETWORK } from "@/lib/craft-data"
import { calculateAllProductionCosts } from "@/lib/resource-images"

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

  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT)
    if (!res.ok) return results
    const data = await res.json()
    for (const item of data.data ?? []) {
      const poolAddr = item.attributes?.address?.toLowerCase()
      if (!poolAddr) continue
      results[poolAddr] = {
        price_usd: parseFloat(item.attributes?.base_token_price_usd || "0"),
        volume_usd_24h: parseFloat(item.attributes?.volume_usd?.h24 || "0"),
        price_change_24h: parseFloat(item.attributes?.price_change_percentage?.h24 || "0"),
      }
    }
  } catch {
    // Timeout or network error
  }
  return results
}

export async function GET() {
  let pools: Record<string, string> = DEFAULT_POOLS
  let network: string = DEFAULT_NETWORK
  let productionCosts: Record<string, { cost_usd: number }> = {}
  let thresholds = { buy: 15, sell: 20 }
  let alertsConfig: Record<string, { enabled: boolean; priority: string; category: string }> = {}
  let banners: Array<{ id: string; position: string; enabled: boolean; imageUrl: string; linkUrl: string; altText: string; adScript: string }> = []

  try {
    const config = await getConfig()
    pools = config.pools ?? pools
    network = config.network ?? network
    productionCosts = config.productionCosts ?? productionCosts
    thresholds = config.thresholds ?? thresholds
    alertsConfig = config.alertsConfig ?? alertsConfig
    banners = (config.banners ?? []).filter((b) => b.enabled)
  } catch {
    // Use defaults
  }

  const poolEntries = Object.entries(pools)
  const addresses = poolEntries.map(([, addr]) => addr).filter((a) => a.startsWith("0x"))

  const batchSize = 15
  const batches: string[][] = []
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize))
  }

  const batchResults = await Promise.all(batches.map((batch) => fetchBatch(batch, network)))

  const allPrices: Record<string, PriceResult> = {}
  for (const result of batchResults) {
    Object.assign(allPrices, result)
  }

  const symbolPrices: Record<string, PriceResult> = {}
  for (const [symbol, addr] of poolEntries) {
    const lowerAddr = addr.toLowerCase()
    if (allPrices[lowerAddr]) {
      symbolPrices[symbol] = allPrices[lowerAddr]
    }
  }

  // Calcular custos de producao automaticamente a partir dos precos das pools
  const calculatedCosts = calculateAllProductionCosts(symbolPrices)

  return NextResponse.json({
    prices: symbolPrices,
    timestamp: new Date().toISOString(),
    count: Object.keys(symbolPrices).length,
    productionCosts: calculatedCosts,
    thresholds,
    alertsConfig,
    banners,
  })
}

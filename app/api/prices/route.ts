import { NextResponse } from "next/server"
import { getConfig, getConfigSection } from "@/lib/config-manager"
import { POOLS as DEFAULT_POOLS, NETWORK as DEFAULT_NETWORK } from "@/lib/craft-data"
import { RECIPES as DEFAULT_RECIPES } from "@/lib/resource-images"
import { API_CONFIG, PRICE_THRESHOLDS, VALIDATION_RULES } from "@/lib/constants"
import type { Recipe } from "@/lib/resource-images"

export const dynamic = "force-dynamic"

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }

type PriceResult = {
  price_usd: number
  volume_usd_24h: number
  price_change_24h: number
  image_url?: string
  token_name?: string
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
  // Validate network parameter
  if (!VALIDATION_RULES.NETWORK_PATTERN.test(network)) {
    console.warn("[v0] Invalid network parameter:", network)
    return {}
  }

  const results: Record<string, PriceResult> = {}
  const joined = addresses.join(",")
  const url = `${GECKO_BASE_URL}/networks/${network}/pools/multi/${joined}?include=base_token`

  try {
    const res = await fetchWithTimeout(url, API_CONFIG.OHLCV_FETCH_TIMEOUT)
    if (!res.ok) {
      console.warn("[v0] API returned non-ok status:", res.status)
      return results
    }

    const data = await res.json()

    // Validate response structure
    if (!data.data || !Array.isArray(data.data)) {
      return results
    }

    // Build a map of included tokens by id for image lookup
    const includedTokens: Record<string, { image_url?: string; name?: string; symbol?: string }> = {}
    if (data.included && Array.isArray(data.included)) {
      for (const inc of data.included) {
        if (inc.type === "token" && inc.id) {
          includedTokens[inc.id] = {
            image_url: inc.attributes?.image_url || "",
            name: inc.attributes?.name || "",
            symbol: inc.attributes?.symbol || "",
          }
        }
      }
    }

    for (const item of data.data) {
      try {
        const poolAddr = item.attributes?.address?.toLowerCase()
        if (!poolAddr || !VALIDATION_RULES.POOL_ADDRESS_PATTERN.test(poolAddr)) continue

        const baseTokenRef = item.relationships?.base_token?.data
        const baseTokenId = baseTokenRef?.id || ""
        const includedToken = includedTokens[baseTokenId]
        const tokenImageUrl = includedToken?.image_url || ""
        const tokenName = item.attributes?.name?.split(" / ")?.[0] || includedToken?.name || ""

        const priceUsd = parseFloat(item.attributes?.base_token_price_usd || "0")
        const volumeUsd = parseFloat(item.attributes?.volume_usd?.h24 || "0")
        const priceChange = parseFloat(item.attributes?.price_change_percentage?.h24 || "0")

        // Skip if volume is too low
        if (volumeUsd < PRICE_THRESHOLDS.MIN_VOLUME_USD) continue

        results[poolAddr] = {
          price_usd: priceUsd,
          volume_usd_24h: volumeUsd,
          price_change_24h: priceChange,
          image_url: tokenImageUrl || undefined,
          token_name: tokenName || undefined,
        }
      } catch (err) {
        console.warn("[v0] Error processing pool item:", err)
        continue
      }
    }
  } catch (err) {
    console.error("[v0] Batch fetch error:", err instanceof Error ? err.message : "Unknown error")
  }
  return results
}

export async function GET() {
  try {
    console.log("[v0] Prices API called")
    let pools: Record<string, string> = DEFAULT_POOLS
    let network: string = DEFAULT_NETWORK
    let thresholds = { buy: PRICE_THRESHOLDS.BUY_DEFAULT, sell: PRICE_THRESHOLDS.SELL_DEFAULT }
    let alertsConfig: Record<string, { enabled: boolean; priority: string; category: string }> = {}
    let banners: Array<{ id: string; position: string; enabled: boolean; imageUrl: string; linkUrl: string; altText: string; adScript: string }> = []

    try {
      const config = await getConfig()
      console.log("[v0] Config loaded, pool count:", Object.keys(config.pools || {}).length)
      pools = config.pools && Object.keys(config.pools).length > 0 ? config.pools : pools
      network = config.network ?? network
      thresholds = config.thresholds ?? thresholds
      alertsConfig = config.alertsConfig ?? alertsConfig
      banners = (config.banners ?? []).filter((b) => b.enabled)
    } catch (err) {
      console.warn("[v0] Config load error, using defaults:", err)
    }

    const poolEntries = Object.entries(pools)
    console.log("[v0] Pool entries:", poolEntries.length)
    
    const addresses = poolEntries
      .map(([symbol, addr]) => {
        const isValid = VALIDATION_RULES.POOL_ADDRESS_PATTERN.test(addr)
        if (!isValid) console.warn("[v0] Invalid pool address for", symbol, ":", addr)
        return addr
      })
      .filter((a) => {
        try {
          return VALIDATION_RULES.POOL_ADDRESS_PATTERN.test(a)
        } catch {
          return false
        }
      })

    console.log("[v0] Valid addresses to fetch:", addresses.length)

  // Process in batches
  const batches: string[][] = []
  for (let i = 0; i < addresses.length; i += API_CONFIG.PRICE_BATCH_SIZE) {
    batches.push(addresses.slice(i, i + API_CONFIG.PRICE_BATCH_SIZE))
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
      const priceData = allPrices[lowerAddr]
      // Use image from alertsConfig if available
      const adminImageUrl = (alertsConfig[symbol] as Record<string, unknown>)?.imageUrl as string | undefined
      if (adminImageUrl) {
        priceData.image_url = adminImageUrl
      }
      symbolPrices[symbol] = priceData
    }
  }

  // Find DYNO COIN price by pool address
  const DYNO_COIN_POOL_ADDRESS = "0x8d896c96ffcafbf12d86dd4510236de7bcfa7dcf"
  let dynoCoinPriceUsd = allPrices[DYNO_COIN_POOL_ADDRESS]?.price_usd ?? 0
  if (dynoCoinPriceUsd === 0) {
    for (const [, addr] of poolEntries) {
      if (addr.toLowerCase() === DYNO_COIN_POOL_ADDRESS && symbolPrices[Object.keys(poolEntries).find(k => poolEntries[k] === addr) || ""]) {
        const symbol = Object.keys(poolEntries).find(k => poolEntries[k] === addr) || ""
        dynoCoinPriceUsd = symbolPrices[symbol]?.price_usd ?? 0
        break
      }
    }
  }

  // Load recipes from DB
  let recipes: Recipe[] = DEFAULT_RECIPES
  try {
    const dbRecipes = await getConfigSection("recipes")
    if (dbRecipes && Array.isArray(dbRecipes) && dbRecipes.length > 0) {
      recipes = dbRecipes as Recipe[]
    }
  } catch (err) {
    console.warn("[v0] Recipes load error, using defaults:", err)
  }

  // Calculate production costs
  const calculatedCosts: Record<string, number> = {}
  for (const recipe of recipes) {
    let totalCost = 0
    for (const inp of recipe.inputs) {
      const inputPrice = symbolPrices[inp.resource]?.price_usd ?? 0
      totalCost += inputPrice * inp.quantity
    }
    calculatedCosts[recipe.output] = totalCost
  }

  return NextResponse.json(
    {
      prices: symbolPrices,
      pools,
      timestamp: new Date().toISOString(),
      count: Object.keys(symbolPrices).length,
      productionCosts: calculatedCosts,
      thresholds,
      alertsConfig,
      banners,
      dynoCoinPriceUsd,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  )
}


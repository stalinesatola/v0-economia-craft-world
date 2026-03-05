import { NextResponse } from "next/server"
import { getConfig, getConfigSection } from "@/lib/config-manager"
import { POOLS as DEFAULT_POOLS, NETWORK as DEFAULT_NETWORK } from "@/lib/craft-data"
import { RECIPES as DEFAULT_RECIPES } from "@/lib/resource-images"
import type { Recipe } from "@/lib/resource-images"

export const dynamic = "force-dynamic"

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }
const FETCH_TIMEOUT = 15000

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
  const results: Record<string, PriceResult> = {}
  const joined = addresses.join(",")
  const url = `${GECKO_BASE_URL}/networks/${network}/pools/multi/${joined}?include=base_token`

  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT)
    if (!res.ok) return results
    const data = await res.json()

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

    for (const item of data.data ?? []) {
      const poolAddr = item.attributes?.address?.toLowerCase()
      if (!poolAddr) continue

      // Get base token image from included data
      const baseTokenRef = item.relationships?.base_token?.data
      const baseTokenId = baseTokenRef?.id || ""
      const includedToken = includedTokens[baseTokenId]
      const tokenImageUrl = includedToken?.image_url || ""
      const tokenName = item.attributes?.name?.split(" / ")?.[0] || includedToken?.name || ""

      results[poolAddr] = {
        price_usd: parseFloat(item.attributes?.base_token_price_usd || "0"),
        volume_usd_24h: parseFloat(item.attributes?.volume_usd?.h24 || "0"),
        price_change_24h: parseFloat(item.attributes?.price_change_percentage?.h24 || "0"),
        image_url: tokenImageUrl || undefined,
        token_name: tokenName || undefined,
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
  let thresholds = { buy: 15, sell: 20 }
  let alertsConfig: Record<string, { enabled: boolean; priority: string; category: string }> = {}
  let banners: Array<{ id: string; position: string; enabled: boolean; imageUrl: string; linkUrl: string; altText: string; adScript: string }> = []

  try {
    const config = await getConfig()
    pools = (config.pools && Object.keys(config.pools).length > 0) ? config.pools : pools
    network = config.network ?? network
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
      const priceData = allPrices[lowerAddr]
      // Usar imagem do alertsConfig (cadastrada pelo admin) se disponivel
      const adminImageUrl = (alertsConfig[symbol] as Record<string, unknown>)?.imageUrl as string | undefined
      if (adminImageUrl) {
        priceData.image_url = adminImageUrl
      }
      symbolPrices[symbol] = priceData
    }
  }

  // Find DYNO COIN price by pool address (the symbol may vary: "COIN", "DYNO COIN", etc.)
  const DYNO_COIN_POOL_ADDRESS = "0x8d896c96ffcafbf12d86dd4510236de7bcfa7dcf"
  let dynoCoinPriceUsd = allPrices[DYNO_COIN_POOL_ADDRESS]?.price_usd ?? 0
  if (dynoCoinPriceUsd === 0) {
    // Fallback: search by pool address in symbolPrices
    for (const [symbol, addr] of poolEntries) {
      if (addr.toLowerCase() === DYNO_COIN_POOL_ADDRESS && symbolPrices[symbol]) {
        dynoCoinPriceUsd = symbolPrices[symbol].price_usd
        break
      }
    }
  }

  // Carregar receitas do DB (mesmas que o frontend usa) para calculo consistente
  let recipes: Recipe[] = DEFAULT_RECIPES
  try {
    const dbRecipes = await getConfigSection("recipes")
    if (dbRecipes && Array.isArray(dbRecipes) && dbRecipes.length > 0) {
      recipes = dbRecipes as Recipe[]
    }
  } catch {
    // fallback para hardcoded
  }

  // Calcular custos de producao: soma(preco_pool_input * quantidade) para cada input
  const calculatedCosts: Record<string, number> = {}
  for (const recipe of recipes) {
    let totalCost = 0
    for (const inp of recipe.inputs) {
      const inputPrice = symbolPrices[inp.resource]?.price_usd ?? 0
      totalCost += inputPrice * inp.quantity
    }
    calculatedCosts[recipe.output] = totalCost
  }

  return NextResponse.json({
    prices: symbolPrices,
    pools,
    timestamp: new Date().toISOString(),
    count: Object.keys(symbolPrices).length,
    productionCosts: calculatedCosts,
    thresholds,
    alertsConfig,
    banners,
    dynoCoinPriceUsd,
  })
}

import { NextResponse } from "next/server"
import { POOLS, NETWORK, GECKO_BASE_URL } from "@/lib/craft-data"

export const dynamic = "force-dynamic"

const API_HEADERS = { Accept: "application/json;version=20230203" }
const FETCH_TIMEOUT = 8000

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

async function fetchBatch(addresses: string[]): Promise<Record<string, PriceResult>> {
  const results: Record<string, PriceResult> = {}
  const joined = addresses.join(",")
  const url = `${GECKO_BASE_URL}/networks/${NETWORK}/pools/multi/${joined}`

  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT)
    if (!res.ok) {
      console.error(`[v0] GeckoTerminal batch error: ${res.status}`)
      return results
    }
    const data = await res.json()
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
  const poolEntries = Object.entries(POOLS)
  const addresses = poolEntries.map(([, addr]) => addr).filter((a) => a.startsWith("0x"))

  // Split into batches of 30 (max allowed by GeckoTerminal) and fetch in parallel
  const batchSize = 30
  const batches: string[][] = []
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize))
  }

  // Fetch all batches in parallel
  const batchResults = await Promise.all(batches.map(fetchBatch))

  // Merge all results
  const allPrices: Record<string, PriceResult> = {}
  for (const result of batchResults) {
    Object.assign(allPrices, result)
  }

  // Map pool addresses back to symbols
  const symbolPrices: Record<string, PriceResult> = {}
  for (const [symbol, addr] of poolEntries) {
    const lowerAddr = addr.toLowerCase()
    if (allPrices[lowerAddr]) {
      symbolPrices[symbol] = allPrices[lowerAddr]
    }
  }

  return NextResponse.json({
    prices: symbolPrices,
    timestamp: new Date().toISOString(),
    count: Object.keys(symbolPrices).length,
  })
}

import { NextResponse } from "next/server"
import { POOLS, NETWORK, GECKO_BASE_URL } from "@/lib/craft-data"

export const dynamic = "force-dynamic"

const API_HEADERS = { Accept: "application/json;version=20230203" }

export async function GET() {
  const poolEntries = Object.entries(POOLS)
  const addresses = poolEntries.map(([, addr]) => addr).filter((a) => a.startsWith("0x"))

  const batchSize = 20
  const allPrices: Record<
    string,
    {
      price_usd: number
      volume_usd_24h: number
      price_change_24h: number
    }
  > = {}

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize)
    const joined = batch.join(",")
    const url = `${GECKO_BASE_URL}/networks/${NETWORK}/pools/multi/${joined}`

    try {
      const res = await fetch(url, {
        headers: API_HEADERS,
        next: { revalidate: 0 },
      })

      if (!res.ok) {
        console.error(`GeckoTerminal API error: ${res.status}`)
        continue
      }

      const data = await res.json()

      for (const item of data.data ?? []) {
        const poolAddr = item.attributes?.address?.toLowerCase()
        if (!poolAddr) continue

        allPrices[poolAddr] = {
          price_usd: parseFloat(item.attributes?.base_token_price_usd || "0"),
          volume_usd_24h: parseFloat(item.attributes?.volume_usd?.h24 || "0"),
          price_change_24h: parseFloat(
            item.attributes?.price_change_percentage?.h24 || "0"
          ),
        }
      }

      // Rate limit delay between batches
      if (i + batchSize < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error("Error fetching from GeckoTerminal:", error)
    }
  }

  // Map pool addresses back to symbols
  const symbolPrices: Record<
    string,
    {
      price_usd: number
      volume_usd_24h: number
      price_change_24h: number
    }
  > = {}

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

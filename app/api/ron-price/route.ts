import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }

// RON is the native token of the Ronin network
// Use the WRON/USDC pool on Katana DEX
const RON_POOL = "0x6daf0de0cbb51b76b4918c2a168403e329818cca"

async function fetchFromGeckoTerminal() {
  const url = `${GECKO_BASE_URL}/networks/ronin/pools/${RON_POOL}`
  const res = await fetch(url, {
    headers: API_HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return null

  const data = await res.json()
  const attrs = data?.data?.attributes
  if (!attrs) return null

  const price = parseFloat(attrs?.base_token_price_usd || "0")
  if (price === 0) return null

  return {
    symbol: "RON",
    price_usd: price,
    volume_usd_24h: parseFloat(attrs?.volume_usd?.h24 || "0"),
    price_change_24h: parseFloat(attrs?.price_change_percentage?.h24 || "0"),
    fdv_usd: parseFloat(attrs?.fdv_usd || "0"),
    pool: RON_POOL,
    timestamp: new Date().toISOString(),
  }
}

async function fetchFromCoinGecko() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ronin&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true",
    { cache: "no-store", signal: AbortSignal.timeout(8000) }
  )

  if (!res.ok) return null

  const data = await res.json()
  const ronin = data?.ronin
  if (!ronin) return null

  return {
    symbol: "RON",
    price_usd: ronin.usd ?? 0,
    volume_usd_24h: ronin.usd_24h_vol ?? 0,
    price_change_24h: ronin.usd_24h_change ?? 0,
    fdv_usd: 0,
    pool: RON_POOL,
    timestamp: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    // Try GeckoTerminal first, fallback to CoinGecko
    const result = await fetchFromGeckoTerminal() ?? await fetchFromCoinGecko()

    if (!result) {
      return NextResponse.json(
        { symbol: "RON", price_usd: 0, volume_usd_24h: 0, price_change_24h: 0, error: "Unable to fetch price" },
        { status: 200 }
      )
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { symbol: "RON", price_usd: 0, volume_usd_24h: 0, price_change_24h: 0, error: "Service unavailable" },
      { status: 200 }
    )
  }
}

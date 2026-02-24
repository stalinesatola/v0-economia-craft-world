import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }

// RON is the native token of the Ronin network
// Use the WRON/USDC pool on Katana DEX
const RON_POOL = "0x6daf0de0cbb51b76b4918c2a168403e329818cca"

export async function GET() {
  try {
    const url = `${GECKO_BASE_URL}/networks/ronin/pools/${RON_POOL}`
    const res = await fetch(url, {
      headers: API_HEADERS,
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch RON price" }, { status: res.status })
    }

    const data = await res.json()
    const attrs = data?.data?.attributes

    return NextResponse.json({
      symbol: "RON",
      price_usd: parseFloat(attrs?.base_token_price_usd || "0"),
      volume_usd_24h: parseFloat(attrs?.volume_usd?.h24 || "0"),
      price_change_24h: parseFloat(attrs?.price_change_percentage?.h24 || "0"),
      fdv_usd: parseFloat(attrs?.fdv_usd || "0"),
      pool: RON_POOL,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch RON price" }, { status: 500 })
  }
}

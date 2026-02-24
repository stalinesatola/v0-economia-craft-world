import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }

// GeckoTerminal OHLCV endpoint: /networks/{network}/pools/{pool_address}/ohlcv/{timeframe}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pool: string }> }
) {
  const { pool } = await params
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get("timeframe") || "day"
  const aggregate = searchParams.get("aggregate") || "1"
  const limit = searchParams.get("limit") || "30"
  const network = searchParams.get("network") || "ronin"

  const url = `${GECKO_BASE_URL}/networks/${network}/pools/${pool}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`

  try {
    const res = await fetch(url, {
      headers: API_HEADERS,
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch OHLCV data", status: res.status }, { status: res.status })
    }

    const data = await res.json()
    const ohlcvList = data?.data?.attributes?.ohlcv_list ?? []

    // GeckoTerminal returns [timestamp, open, high, low, close, volume]
    const candles = ohlcvList.map((c: number[]) => ({
      timestamp: c[0] * 1000,
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
    }))

    // Sort by timestamp ascending
    candles.sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)

    return NextResponse.json({ candles, pool, timeframe })
  } catch {
    return NextResponse.json({ error: "Failed to fetch OHLCV" }, { status: 500 })
  }
}

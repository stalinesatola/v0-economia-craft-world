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
  
  // Input validation
  const validTimeframes = ["minute", "hour", "day"]
  const timeframe = searchParams.get("timeframe") || "day"
  if (!validTimeframes.includes(timeframe)) {
    return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 })
  }
  
  const aggregate = searchParams.get("aggregate") || "1"
  const aggregateNum = parseInt(aggregate, 10)
  if (isNaN(aggregateNum) || aggregateNum < 1 || aggregateNum > 30) {
    return NextResponse.json({ error: "Invalid aggregate value" }, { status: 400 })
  }
  
  const limit = searchParams.get("limit") || "30"
  const limitNum = parseInt(limit, 10)
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    return NextResponse.json({ error: "Invalid limit value" }, { status: 400 })
  }
  
  // Validate pool address format (should be hex address)
  if (!/^0x[a-fA-F0-9]{40}$/.test(pool)) {
    return NextResponse.json({ error: "Invalid pool address format" }, { status: 400 })
  }
  
  const network = searchParams.get("network") || "ronin"
  if (!/^[a-z0-9-]+$/.test(network)) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 })
  }

  const url = `${GECKO_BASE_URL}/networks/${network}/pools/${pool}/ohlcv/${timeframe}?aggregate=${aggregateNum}&limit=${limitNum}&currency=usd`

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

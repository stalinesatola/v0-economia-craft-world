import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const OPENSEA_API_URL = "https://api.opensea.io/api/v2"

interface OpenSeaEvent {
  event_type: string
  event_timestamp: number
  transaction: string
  payment?: {
    quantity: string
    token_address: string
    decimals: number
    symbol: string
  }
  seller: string
  buyer: string
}

export interface NFTSaleHistory {
  timestamp: number
  date: string
  priceEth: number
  priceFormatted: string
  seller: string
  buyer: string
  transaction: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  const tokenId = searchParams.get("tokenId")
  const limit = parseInt(searchParams.get("limit") || "10", 10)

  if (!slug || !tokenId) {
    return NextResponse.json({ error: "Missing slug or tokenId" }, { status: 400 })
  }

  // Get API key from env
  const apiKey = process.env.OPENSEA_API_KEY || ""
  if (!apiKey) {
    return NextResponse.json({ error: "OpenSea API configured incorrectly" }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${OPENSEA_API_URL}/events?collection_slug=${slug}&token_id=${tokenId}&event_type=sale&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
        next: { revalidate: 60 }, // Cache 1 minute per NFT
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error("[v0] OpenSea Events Error:", res.status, errorText)
      return NextResponse.json({ error: "Failed to fetch event history", details: errorText }, { status: res.status })
    }

    const data = await res.json()
    const events = (data.asset_events || []) as Array<OpenSeaEvent>

    const history: NFTSaleHistory[] = events.map((ev) => {
      let priceEth = 0
      if (ev.payment && ev.payment.quantity && ev.payment.decimals) {
        // Convert wei to ether based on decimals
        priceEth = parseFloat(ev.payment.quantity) / Math.pow(10, ev.payment.decimals)
      }

      return {
        timestamp: ev.event_timestamp,
        date: new Date(ev.event_timestamp * 1000).toISOString(),
        priceEth,
        priceFormatted: priceEth > 0 ? `${priceEth.toFixed(4)} ${ev.payment?.symbol || "ETH"}` : "0",
        seller: ev.seller,
        buyer: ev.buyer,
        transaction: ev.transaction,
      }
    })

    return NextResponse.json({
      history,
      count: history.length,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch NFT events:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

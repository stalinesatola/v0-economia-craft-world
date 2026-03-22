import { NextRequest, NextResponse } from 'next/server'

// Collections: Fire Dynos and Water Dynos
const COLLECTIONS = {
  fire: 'angry-dynomites-lab-fire-dynos',
  water: 'angry-dynomites-lab-water-dynos',
}

export async function GET(request: NextRequest) {
  const collection = request.nextUrl.searchParams.get('collection') || 'fire'
  const collectionId = COLLECTIONS[collection as keyof typeof COLLECTIONS]
  
  if (!collectionId) {
    return NextResponse.json(
      { error: 'Invalid collection. Use "fire" or "water"' },
      { status: 400 }
    )
  }

  try {
    // Fetch without API key first (free tier)
    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${collectionId}/stats`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error(`[v0] OpenSea API error for ${collection}:`, response.status, response.statusText)
      
      // Return mock data on error to show the UI
      if (response.status === 429 || response.status === 401 || response.status === 403) {
        return NextResponse.json({
          collection: {
            name: collection === 'fire' ? 'Angry Dynomites Lab Fire Dynos' : 'Angry Dynomites Lab Water Dynos',
            description: 'NFT Collection',
            image_url: '',
            banner_image_url: '',
          },
          stats: {
            floor_price: 0,
            ceiling_price: 0,
            average_price: 0,
            total_volume: 0,
            total_sales: 0,
            total_supply: 0,
            count: 0,
            num_owners: 0,
            market_cap: 0,
            volume_7day: 0,
            volume_30day: 0,
            volume_all: 0,
          },
          error: 'Unable to fetch live data from OpenSea API'
        })
      }
      
      return NextResponse.json(
        { error: `Failed to fetch OpenSea stats: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Cache response for 5 minutes
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error(`[v0] OpenSea fetch error for ${collection}:`, error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

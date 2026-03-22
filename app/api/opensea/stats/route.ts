import { NextRequest, NextResponse } from 'next/server'

// OpenSea collection ID para Angry Dynomites Lab Fire Dynos
const COLLECTION_ID = 'angry-dynomites-lab-fire-dynos'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${COLLECTION_ID}/stats`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.OPENSEA_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      console.error('[v0] OpenSea API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch OpenSea stats' },
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
    console.error('[v0] OpenSea fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

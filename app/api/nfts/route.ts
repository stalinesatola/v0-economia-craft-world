import { NextResponse } from "next/server"
import { getConfig } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

const OPENSEA_API_URL = "https://api.opensea.io/api/v2"
const API_HEADERS = (apiKey: string) => ({
  Accept: "application/json",
  "X-API-KEY": apiKey,
})

interface NFTData {
  identifier: string
  name: string
  description: string
  image_url: string
  collection: string
  collection_slug: string
  floor_price?: number
  last_sale_price?: number
  last_sale_payment_token?: string
  rarity_rank?: number
  owner: string
  traits: Array<{ trait_type: string; value: string }>
}

interface OpenSeaCollectionStats {
  floor_price: number
  volume_all_time: number
}

interface OpenSeaNFT {
  identifier: string
  name: string
  description: string
  image_url: string | null
  collection: string
  collection_slug: string
  contract: string
  token_id: string
  owner: string
  attributes: Array<{ trait_type: string; value: string; frequency: string }>
}

async function fetchCollectionStats(slug: string, apiKey: string): Promise<OpenSeaCollectionStats | null> {
  try {
    const res = await fetch(`${OPENSEA_API_URL}/collections/${slug}/stats`, {
      headers: API_HEADERS(apiKey),
      next: { revalidate: 60 }, // Cache 1 min
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function fetchNFTs(slug: string, limit: number = 20, apiKey: string): Promise<NFTData[]> {
  try {
    const res = await fetch(
      `${OPENSEA_API_URL}/collections/${slug}/nfts?limit=${limit}`,
      {
        headers: API_HEADERS(apiKey),
        next: { revalidate: 30 }, // Cache 30 seg
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    
    return (data.nfts || []).map((nft: OpenSeaNFT) => ({
      identifier: nft.identifier,
      name: nft.name,
      description: nft.description,
      image_url: nft.image_url || "",
      collection: nft.collection,
      collection_slug: nft.collection_slug,
      owner: nft.owner,
      traits: (nft.attributes || []).map((attr) => ({
        trait_type: attr.trait_type,
        value: attr.value,
      })),
    }))
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug") || "angry-dynomites-lab"
  const limit = parseInt(searchParams.get("limit") || "20", 10)

  // Get API key from env
  const apiKey = process.env.OPENSEA_API_KEY || ""

  // Get custom collections from config
  let customCollections: Array<{ slug: string; name: string; enabled: boolean; icon?: string }> = []
  try {
    const config = await getConfig()
    customCollections = config.nftCollections || []
  } catch {
    // Use defaults
  }

  // Default Angry Dynomites Lab collection
  const defaultCollection = {
    slug: "angry-dynomites-lab",
    name: "Angry Dynomites Lab",
    enabled: true,
    icon: "🔥",
  }

  const collections = customCollections.length > 0 ? customCollections : [defaultCollection]

  // Find requested collection or use first enabled
  const targetCollection = collections.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase()
  ) || collections.find((c) => c.enabled) || defaultCollection

  // Fetch both stats and NFTs in parallel (pass apiKey)
  const [stats, nfts] = await Promise.all([
    fetchCollectionStats(targetCollection.slug, apiKey),
    fetchNFTs(targetCollection.slug, limit, apiKey),
  ])

  return NextResponse.json({
    collection: {
      slug: targetCollection.slug,
      name: targetCollection.name,
      icon: targetCollection.icon || "🔥",
    },
    stats: {
      floor_price: stats?.floor_price || 0,
      volume_all_time: stats?.volume_all_time || 0,
    },
    nfts,
    timestamp: new Date().toISOString(),
  })
}
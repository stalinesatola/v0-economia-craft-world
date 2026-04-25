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
  total: {
    floor_price: number
    volume: number   
  }
}

interface OpenSeaNFT {
  identifier: string
  name?: string
  description?: string
  image_url?: string | null
  display_image_url?: string | null
  collection: string
  collection_slug?: string
  contract: string
  token_id?: string
  owner?: string
  traits?: Array<{ trait_type: string; value: string }>
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
      `${OPENSEA_API_URL}/collection/${slug}/nfts?limit=${limit}`,
      {
        headers: API_HEADERS(apiKey),
        next: { revalidate: 30 }, // Cache 30 seg
      }
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.nfts || []).map((nft: OpenSeaNFT) => ({
      identifier: nft.identifier,
      name: nft.name || `NFT #${nft.identifier.slice(0, 8)}`,
      description: nft.description || "",
      image_url: nft.display_image_url || nft.image_url || "",
      collection: nft.collection,
      collection_slug: nft.collection,
      owner: nft.owner || "",
      traits: (nft.traits || []).map((attr) => ({
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
  const slug = searchParams.get("slug") || "angry-dynomites-lab-fire-dynos"
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

  // Default Angry Dynomites Lab collections
  const defaultCollections = [
    {
      slug: "angry-dynomites-lab-fire-dynos",
      name: "ADL Fire Dynos",
      enabled: true,
      icon: "🔥",
    },
    {
      slug: "angry-dynomites-lab-water-dynos",
      name: "ADL Water Dynos",
      enabled: true,
      icon: "💧",
    }
  ]

  const collections = customCollections.length > 0 ? customCollections : defaultCollections

  // Find requested collection or use first enabled
  const targetCollection = collections.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase()
  ) || collections.find((c) => c.enabled) || defaultCollections[0]

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
      floor_price: stats?.total?.floor_price || 0,
      volume_all_time: stats?.total?.volume || 0,
    },
    nfts,
    timestamp: new Date().toISOString(),
  })
}

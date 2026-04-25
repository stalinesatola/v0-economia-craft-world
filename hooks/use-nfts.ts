"use client"

import useSWR from "swr"

export interface NFTData {
  identifier: string
  name: string
  description: string
  image_url: string
  collection: string
  collection_slug: string
  traits: Array<{ trait_type: string; value: string }>
}

export interface CollectionStats {
  floor_price: number
  volume_all_time: number
  eth_usd_price?: number
}

interface NFTResponse {
  collection: {
    slug: string
    name: string
    icon: string
  }
  stats: CollectionStats
  nfts: NFTData[]
  timestamp: string
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) {
        console.error(`[v0] NFT API error: ${r.status}`)
        return null
      }
      return r.json().catch((err) => {
        console.error("[v0] NFT JSON parse error:", err)
        return null
      })
    })
    .catch((err) => {
      console.error("[v0] NFT fetch error:", err)
      return null
    })

export function useNFTs(slug?: string, limit: number = 20) {
  const url = `/api/nfts?slug=${slug || "angry-dynomites-lab"}&limit=${limit}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<NFTResponse>(
    url,
    fetcher,
    {
      refreshInterval: 60 * 1000, // 1 minute
      revalidateOnFocus: true,
      dedupingInterval: 30 * 1000,
      onError: (error) => console.error("[v0] NFTs fetch error:", error),
    }
  )

  return {
    collection: data?.collection,
    stats: data?.stats,
    nfts: data?.nfts ?? [],
    timestamp: data?.timestamp,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  }
}
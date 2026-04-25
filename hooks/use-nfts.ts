"use client"

import useSWRInfinite from "swr/infinite"

export interface NFTData {
  identifier: string
  name: string
  description: string
  image_url: string
  collection: string
  collection_slug: string
  contract: string
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
  nextCursor?: string | null
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
  const getKey = (pageIndex: number, previousPageData: NFTResponse | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null // reached the end
    const baseSlug = slug || "angry-dynomites-lab-fire-dynos"
    const url = `/api/nfts?slug=${baseSlug}&limit=${limit}`
    if (pageIndex === 0) return url
    return `${url}&cursor=${previousPageData.nextCursor}`
  }

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<NFTResponse>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      onError: (error) => console.error("[v0] NFTs fetch error:", error),
    }
  )

  const nfts = data ? data.flatMap(page => page.nfts || []) : []
  const hasMore = data ? data[data.length - 1]?.nextCursor != null : false
  const isLoadingMore = size > 0 && data && typeof data[size - 1] === "undefined"
  const collection = data?.[0]?.collection
  const stats = data?.[0]?.stats

  return {
    collection,
    stats,
    nfts,
    hasMore,
    loadMore: () => setSize(size + 1),
    isLoading: !data && !error,
    isValidating,
    isLoadingMore,
    error,
    refresh: mutate,
  }
}
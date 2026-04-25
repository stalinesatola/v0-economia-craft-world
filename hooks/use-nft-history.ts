"use client"

import useSWR from "swr"
import type { NFTSaleHistory } from "@/app/api/nfts/history/route"

interface NFTHistoryResponse {
  history: NFTSaleHistory[]
  count: number
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) {
        throw new Error(`History fetch error ${r.status}`)
      }
      return r.json()
    })

export function useNFTHistory(slug: string | undefined, tokenId: string | undefined) {
  const url = slug && tokenId ? `/api/nfts/history?slug=${slug}&tokenId=${tokenId}` : null

  const { data, error, isLoading, mutate } = useSWR<NFTHistoryResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false, // Sales history doesn't update frequently enough to warrant focus revalidation
    }
  )

  return {
    history: data?.history || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

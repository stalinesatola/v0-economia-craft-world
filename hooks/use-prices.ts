"use client"

import useSWR from "swr"

interface PriceData {
  price_usd: number
  volume_usd_24h: number
  price_change_24h: number
}

interface PricesResponse {
  prices: Record<string, PriceData>
  timestamp: string
  count: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function usePrices() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<PricesResponse>(
    "/api/prices",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
    }
  )

  return {
    prices: data?.prices ?? {},
    timestamp: data?.timestamp,
    count: data?.count ?? 0,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  }
}

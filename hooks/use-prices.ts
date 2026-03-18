"use client"

import useSWR from "swr"

interface PriceData {
  price_usd: number
  volume_usd_24h: number
  price_change_24h: number
  image_url?: string
  token_name?: string
}

interface PricesResponse {
  prices: Record<string, PriceData>
  pools?: Record<string, string>
  timestamp: string
  count: number
  productionCosts?: Record<string, number>
  thresholds?: { buy: number; sell: number }
  alertsConfig?: Record<string, { enabled: boolean; priority: string; category: string; imageUrl?: string }>
  banners?: Array<{ id: string; position: string; enabled: boolean; imageUrl: string; linkUrl: string; altText: string; adScript: string }>
  dynoCoinPriceUsd?: number
}

const fetcher = (url: string) => 
  fetch(url)
    .then((r) => {
      if (!r.ok) {
        console.error(`[v0] API error: ${r.status}`)
        return null
      }
      return r.json().catch((err) => {
        console.error("[v0] JSON parse error:", err)
        return null
      })
    })
    .catch((err) => {
      console.error("[v0] Fetch error:", err)
      return null
    })



export function usePrices() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<PricesResponse>(
    "/api/prices",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
      onError: (error) => console.error("[v0] Prices fetch error:", error),
    }
  )

  return {
    prices: data?.prices ?? {},
    pools: data?.pools ?? {},
    timestamp: data?.timestamp,
    count: data?.count ?? 0,
    productionCosts: data?.productionCosts,
    thresholds: data?.thresholds,
    alertsConfig: data?.alertsConfig,
    banners: data?.banners ?? [],
    dynoCoinPriceUsd: data?.dynoCoinPriceUsd ?? 0,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  }
}

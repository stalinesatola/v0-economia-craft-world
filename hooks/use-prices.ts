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
  productionCosts?: Record<string, { cost_usd: number; input?: string; ratio?: number; levels: number; source?: string }>
  thresholds?: { buy: number; sell: number }
  alertsConfig?: Record<string, { enabled: boolean; priority: string; category: string }>
  banners?: Array<{ id: string; position: string; enabled: boolean; imageUrl: string; linkUrl: string; altText: string; adScript: string }>
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
    productionCosts: data?.productionCosts,
    thresholds: data?.thresholds,
    alertsConfig: data?.alertsConfig,
    banners: data?.banners ?? [],
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  }
}

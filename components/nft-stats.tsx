'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('Failed to fetch')
      return r.json()
    })
    .catch((error) => {
      console.error('[v0] NFT fetch error:', error)
      return null
    })

interface OpenSeaStats {
  collection?: {
    name: string
    description: string
    image_url: string
    banner_image_url: string
  }
  stats?: {
    floor_price: number
    ceiling_price: number
    average_price: number
    total_volume: number
    total_sales: number
    total_supply: number
    count: number
    num_owners: number
    market_cap: number
    volume_7day: number
    volume_30day: number
    volume_all: number
  }
}

export function NFTStats() {
  const { t, locale } = useI18n()
  const [collectionUrl, setCollectionUrl] = useState('')

  const { data: stats, isLoading, error } = useSWR<OpenSeaStats>(
    '/api/opensea/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
    }
  )

  useEffect(() => {
    setCollectionUrl('https://opensea.io/collection/angry-dynomites-lab-fire-dynos')
  }, [])

  const formatPrice = (price: number | undefined) => {
    if (!price) return '--'
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatNumber = (num: number | undefined) => {
    if (!num) return '--'
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US').format(num)
  }

  return (
    <div className="space-y-4">
      {/* Collection Header */}
      {stats?.collection && (
        <Card className="border-border bg-card overflow-hidden">
          {stats.collection.banner_image_url && (
            <div className="relative h-40 w-full overflow-hidden bg-gradient-to-b from-primary/20 to-background">
              <img
                src={stats.collection.banner_image_url}
                alt={stats.collection.name}
                className="h-full w-full object-cover opacity-50"
              />
            </div>
          )}
          <CardContent className="pt-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{stats.collection.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {stats.collection.description}
              </p>
              <Link href={collectionUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver no OpenSea
                </Button>
              </Link>
            </div>
            {stats.collection.image_url && (
              <img
                src={stats.collection.image_url}
                alt={stats.collection.name}
                className="h-24 w-24 rounded-lg object-cover"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : error || !stats?.stats ? (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Erro ao carregar dados do OpenSea</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Floor Price */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preço Mínimo (Floor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.stats.floor_price)}
              </p>
              {stats.stats.floor_price && (
                <p className="text-xs text-primary mt-1">ETH {stats.stats.floor_price.toFixed(4)}</p>
              )}
            </CardContent>
          </Card>

          {/* Ceiling Price */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preço Máximo (Ceiling)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.stats.ceiling_price)}
              </p>
              {stats.stats.ceiling_price && (
                <p className="text-xs text-primary mt-1">ETH {stats.stats.ceiling_price.toFixed(4)}</p>
              )}
            </CardContent>
          </Card>

          {/* Average Price */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preço Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.stats.average_price)}
              </p>
              {stats.stats.average_price && (
                <p className="text-xs text-primary mt-1">ETH {stats.stats.average_price.toFixed(4)}</p>
              )}
            </CardContent>
          </Card>

          {/* Market Cap */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Capitalização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.stats.market_cap)}
              </p>
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.stats.total_volume)}
              </p>
            </CardContent>
          </Card>

          {/* Total Sales */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(stats.stats.total_sales)}
              </p>
            </CardContent>
          </Card>

          {/* Total Supply */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quantidade Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(stats.stats.total_supply)}
              </p>
            </CardContent>
          </Card>

          {/* Owners */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Proprietários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(stats.stats.num_owners)}
              </p>
            </CardContent>
          </Card>

          {/* Volume 7 Days */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.stats.volume_7day)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
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
  error?: string
}

interface Collection {
  id: 'fire' | 'water'
  label: string
  name: string
  url: string
}

const COLLECTIONS: Collection[] = [
  {
    id: 'fire',
    label: 'Fire Dynos',
    name: 'Angry Dynomites Lab Fire Dynos',
    url: 'https://opensea.io/collection/angry-dynomites-lab-fire-dynos',
  },
  {
    id: 'water',
    label: 'Water Dynos',
    name: 'Angry Dynomites Lab Water Dynos',
    url: 'https://opensea.io/collection/angry-dynomites-lab-water-dynos',
  },
]

export function NFTStats() {
  const { locale } = useI18n()
  const [activeCollection, setActiveCollection] = useState<'fire' | 'water'>('fire')

  const { data: stats, isLoading, error } = useSWR<OpenSeaStats>(
    `/api/opensea/stats?collection=${activeCollection}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  )

  const collection = COLLECTIONS.find(c => c.id === activeCollection)
  const hasError = error || stats?.error
  const isLoadingData = isLoading || !stats

  const formatPrice = (price: number | undefined) => {
    if (!price || price === 0) return '--'
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatNumber = (num: number | undefined) => {
    if (!num || num === 0) return '--'
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US').format(num)
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeCollection} onValueChange={(value) => setActiveCollection(value as 'fire' | 'water')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          {COLLECTIONS.map((col) => (
            <TabsTrigger key={col.id} value={col.id} className="text-xs">
              {col.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {COLLECTIONS.map((col) => (
          <TabsContent key={col.id} value={col.id} className="mt-4 space-y-4">
            {isLoadingData ? (
              <Card className="border-border bg-card">
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : hasError ? (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                  <p className="text-sm text-muted-foreground">Erro ao carregar dados do OpenSea</p>
                  <Button variant="outline" size="sm" onClick={() => window.open(collection?.url)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Ver no OpenSea
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {stats?.collection && (
                  <Card className="border-border bg-card overflow-hidden">
                    <CardContent className="pt-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-foreground">{stats.collection.name}</h2>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {stats.collection.description || 'NFT Collection'}
                        </p>
                        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => window.open(collection?.url)}>
                          <ExternalLink className="h-4 w-4" />
                          Ver no OpenSea
                        </Button>
                      </div>
                      {stats.collection.image_url && (
                        <img src={stats.collection.image_url} alt={stats.collection.name} className="h-20 w-20 rounded-lg object-cover" />
                      )}
                    </CardContent>
                  </Card>
                )}

                {stats?.stats && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Preço Mínimo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatPrice(stats.stats.floor_price)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Preço Máximo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatPrice(stats.stats.ceiling_price)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Preço Médio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatPrice(stats.stats.average_price)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Volume Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatPrice(stats.stats.total_volume)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Volume 7 dias</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatPrice(stats.stats.volume_7day)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Capitalização</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatPrice(stats.stats.market_cap)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Total Vendido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatNumber(stats.stats.total_sales)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Supply Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatNumber(stats.stats.total_supply)}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Proprietários</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{formatNumber(stats.stats.num_owners)}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

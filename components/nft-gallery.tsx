"use client"

import { useState } from "react"
import Image from "next/image"
import { useNFTs } from "@/hooks/use-nfts"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function NFTGallery() {
  const { t } = useI18n()
  const { collection, stats, nfts, isLoading, error, refresh } = useNFTs("angry-dynomites-lab", 20)
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive">{t("chart.noData")}</p>
        <button onClick={refresh} className="mt-2 text-sm text-muted-foreground hover:text-foreground">
          {t("dashboard.refresh")}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {collection?.icon && (
            <span className="text-4xl">{collection.icon}</span>
          )}
          <div>
            <h2 className="text-2xl font-bold">{collection?.name || "NFT Collection"}</h2>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              {stats?.floor_price !== undefined && (
                <span>{t("nft.floor")}: <strong>Ξ {stats.floor_price.toFixed(4)}</strong></span>
              )}
              {stats?.volume_all_time !== undefined && (
                <span>{t("nft.volume")}: <strong>Ξ {stats.volume_all_time.toFixed(2)}</strong></span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="text-sm px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {isLoading ? t("nft.loading") : t("dashboard.refresh")}
        </button>
      </div>

      {/* Grid de NFTs */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : nfts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <span className="text-6xl mb-4">🔥</span>
          <p>{t("chart.noData")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {nfts.map((nft) => (
            <Card
              key={nft.identifier}
              className={cn(
                "overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                selectedNFT === nft.identifier && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedNFT(selectedNFT === nft.identifier ? null : nft.identifier)}
            >
              <div className="aspect-square relative bg-muted">
                {nft.image_url ? (
                  <Image
                    src={nft.image_url}
                    alt={nft.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {collection?.icon || "🔥"}
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-sm truncate" title={nft.name}>
                  {nft.name}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {nft.traits.slice(0, 2).map((trait, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {trait.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalhe */}
      {selectedNFT && (() => {
        const nft = nfts.find((n) => n.identifier === selectedNFT)
        if (!nft) return null
        return (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNFT(null)}
          >
            <div
              className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-square relative bg-muted">
                {nft.image_url ? (
                  <Image
                    src={nft.image_url}
                    alt={nft.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">
                    {collection?.icon || "🔥"}
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{nft.name}</h2>
                  <button
                    onClick={() => setSelectedNFT(null)}
                    className="text-muted-foreground hover:text-foreground text-2xl"
                  >
                    ×
                  </button>
                </div>
                {nft.description && (
                  <p className="text-muted-foreground text-sm">{nft.description}</p>
                )}
                <div className="space-y-3">
                  <h3 className="font-semibold">{t("nft.traits")}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nft.traits.map((trait, idx) => (
                      <div
                        key={idx}
                        className="bg-muted rounded-lg p-3 text-center"
                      >
                        <p className="text-xs text-muted-foreground uppercase">{trait.trait_type}</p>
                        <p className="font-semibold">{trait.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <a
                    href={`https://opensea.io/assets/ronin/${nft.collection_slug}/${nft.identifier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {t("nft.viewOnOpenSea")} →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
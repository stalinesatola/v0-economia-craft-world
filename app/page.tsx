"use client"

import { usePrices } from "@/hooks/use-prices"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { PriceTable } from "@/components/price-table"
import { ProductionChain } from "@/components/production-chain"
import { OpportunitiesPanel } from "@/components/opportunities-panel"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { prices, timestamp, count, isLoading, isValidating, refresh } = usePrices()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">A carregar precos...</p>
            <p className="text-xs text-muted-foreground">A consultar GeckoTerminal API</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <DashboardHeader
            timestamp={timestamp}
            count={count}
            isValidating={isValidating}
            onRefresh={() => refresh()}
          />

          <StatsCards prices={prices} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PriceTable prices={prices} />
            </div>
            <div className="flex flex-col gap-6">
              <OpportunitiesPanel prices={prices} />
              <ProductionChain prices={prices} />
            </div>
          </div>

          <footer className="border-t border-border pt-4 pb-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-muted-foreground">
                Craft World Economy v1.0.0 | Desenvolvido por Plum com Qwen
              </p>
              <p className="text-xs text-muted-foreground">
                Telegram: @bondsbtc | Dados via GeckoTerminal API | Rede Ronin
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Verifique sempre no jogo antes de tomar decisoes!
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}

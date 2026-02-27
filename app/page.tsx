"use client"

import { usePrices } from "@/hooks/use-prices"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { PriceTable } from "@/components/price-table"
import { ProductionChain } from "@/components/production-chain"
import { OpportunitiesPanel } from "@/components/opportunities-panel"
import { AdBanner } from "@/components/ad-banner"
import { MaintenancePage } from "@/components/maintenance-page"
import { useI18n } from "@/lib/i18n"
import { useMemo } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null)

export default function Home() {
  const { prices, timestamp, count, isLoading, isValidating, refresh, productionCosts, thresholds, alertsConfig, banners } = usePrices()
  const { t } = useI18n()

  // Check maintenance mode
  const { data: maintenance } = useSWR("/api/maintenance", fetcher, {
    refreshInterval: 30 * 1000,
    revalidateOnFocus: true,
  })

  // Show maintenance page if enabled (except for admin which has its own route)
  if (maintenance?.enabled) {
    return <MaintenancePage message={maintenance.message} />
  }

  // Fetch public customization
  const { data: customization } = useSWR("/api/customization", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const bannersByPosition = useMemo(() => {
    const map: Record<string, typeof banners[number]> = {}
    for (const b of banners) {
      map[b.position] = b
    }
    return map
  }, [banners])

  const footerCredits = customization?.footerCredits || "Craft World Economy v1.0.0 | Desenvolvido por Plum com Qwen"
  const footerLinks = customization?.footerLinks || "Telegram: @bondsbtc | Dados via GeckoTerminal API | Rede Ronin"
  const footerDisclaimer = customization?.footerDisclaimer || t("footer.disclaimer")

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <DashboardHeader
            timestamp={timestamp}
            count={count}
            isValidating={isValidating || isLoading}
            onRefresh={() => refresh()}
            customization={customization ?? undefined}
          />

          {/* Top Banner */}
          {bannersByPosition.top && (
            <AdBanner
              position="top"
              enabled={bannersByPosition.top.enabled}
              imageUrl={bannersByPosition.top.imageUrl}
              linkUrl={bannersByPosition.top.linkUrl}
              altText={bannersByPosition.top.altText}
              adScript={bannersByPosition.top.adScript}
            />
          )}

          <StatsCards prices={prices} isLoading={isLoading} productionCosts={productionCosts} thresholds={thresholds} alertsConfig={alertsConfig} />

          {/* Between Banner */}
          {bannersByPosition.between && (
            <AdBanner
              position="between"
              enabled={bannersByPosition.between.enabled}
              imageUrl={bannersByPosition.between.imageUrl}
              linkUrl={bannersByPosition.between.linkUrl}
              altText={bannersByPosition.between.altText}
              adScript={bannersByPosition.between.adScript}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PriceTable prices={prices} isLoading={isLoading} productionCosts={productionCosts} thresholds={thresholds} alertsConfig={alertsConfig} />
            </div>
            <div className="flex flex-col gap-6">
              <OpportunitiesPanel prices={prices} isLoading={isLoading} productionCosts={productionCosts} thresholds={thresholds} alertsConfig={alertsConfig} />

              {/* Sidebar Banner */}
              {bannersByPosition.sidebar && (
                <AdBanner
                  position="sidebar"
                  enabled={bannersByPosition.sidebar.enabled}
                  imageUrl={bannersByPosition.sidebar.imageUrl}
                  linkUrl={bannersByPosition.sidebar.linkUrl}
                  altText={bannersByPosition.sidebar.altText}
                  adScript={bannersByPosition.sidebar.adScript}
                />
              )}

              <ProductionChain prices={prices} productionCosts={productionCosts} />
            </div>
          </div>

          <footer className="border-t border-border pt-4 pb-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-muted-foreground">
                {footerCredits}
              </p>
              <p className="text-xs text-muted-foreground">
                {footerLinks}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {footerDisclaimer}
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}

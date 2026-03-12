"use client"

import { usePrices } from "@/hooks/use-prices"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { PriceTable } from "@/components/price-table"
import { OpportunitiesPanel } from "@/components/opportunities-panel"
import { AdBanner } from "@/components/ad-banner"
import { MaintenancePage } from "@/components/maintenance-page"
import { useI18n } from "@/lib/i18n"
import { useMemo, useEffect } from "react"
import { applyTheme, type UITheme } from "@/lib/themes"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null)

export default function Home() {
  const { prices, pools, timestamp, count, isLoading, isValidating, refresh, productionCosts, thresholds, alertsConfig, banners, dynoCoinPriceUsd } = usePrices()
  const { t } = useI18n()

  // Check maintenance mode
  const { data: maintenance } = useSWR("/api/maintenance", fetcher, {
    refreshInterval: 30 * 1000,
    revalidateOnFocus: true,
  })

  // Fetch public customization
  const { data: customization } = useSWR("/api/customization", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  // Apply theme when customization changes
  useEffect(() => {
    if (customization?.uiTheme) {
      applyTheme(customization.uiTheme as UITheme)
    }
  }, [customization?.uiTheme])

  const bannersByPosition = useMemo(() => {
    const map: Record<string, typeof banners[number]> = {}
    for (const b of banners) {
      map[b.position] = b
    }
    return map
  }, [banners])

  // Show maintenance page if enabled (except for admin which has its own route)
  // IMPORTANT: This check must be AFTER all hooks to avoid "Rendered fewer hooks" error
  if (maintenance?.enabled) {
    return <MaintenancePage message={maintenance.message} />
  }

  const footerCredits = customization?.footerCredits || "Craft World Economy v1.0.0 | Desenvolvido por Plum com Qwen"
  const footerLinks = customization?.footerLinks || "Telegram: @bondsbtc | Dados via GeckoTerminal API | Rede Ronin"
  const footerDisclaimer = customization?.footerDisclaimer || t("footer.disclaimer")

  // Module visibility from customization
  const showStats = customization?.modules?.showStats !== false
  const showOpportunities = customization?.modules?.showOpportunities !== false
  const showBanners = customization?.modules?.showBanners !== false

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
          {showBanners && bannersByPosition.top && (
            <AdBanner
              position="top"
              enabled={bannersByPosition.top.enabled}
              imageUrl={bannersByPosition.top.imageUrl}
              linkUrl={bannersByPosition.top.linkUrl}
              altText={bannersByPosition.top.altText}
              adScript={bannersByPosition.top.adScript}
            />
          )}

          {showStats && (
            <StatsCards prices={prices} isLoading={isLoading} productionCosts={productionCosts} thresholds={thresholds} alertsConfig={alertsConfig} />
          )}

          {/* Between Banner */}
          {showBanners && bannersByPosition.between && (
            <AdBanner
              position="between"
              enabled={bannersByPosition.between.enabled}
              imageUrl={bannersByPosition.between.imageUrl}
              linkUrl={bannersByPosition.between.linkUrl}
              altText={bannersByPosition.between.altText}
              adScript={bannersByPosition.between.adScript}
            />
          )}

          {showOpportunities && (
            <OpportunitiesPanel prices={prices} isLoading={isLoading} productionCosts={productionCosts} thresholds={thresholds} alertsConfig={alertsConfig} dynoCoinPriceUsd={dynoCoinPriceUsd} />
          )}

          {/* Sidebar Banner (shown as full width) */}
          {showBanners && bannersByPosition.sidebar && (
            <AdBanner
              position="sidebar"
              enabled={bannersByPosition.sidebar.enabled}
              imageUrl={bannersByPosition.sidebar.imageUrl}
              linkUrl={bannersByPosition.sidebar.linkUrl}
              altText={bannersByPosition.sidebar.altText}
              adScript={bannersByPosition.sidebar.adScript}
            />
          )}

          {/* Resource Cards */}
          <PriceTable prices={prices} pools={pools} isLoading={isLoading} productionCosts={productionCosts} thresholds={thresholds} alertsConfig={alertsConfig} dynoCoinPriceUsd={dynoCoinPriceUsd} />

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

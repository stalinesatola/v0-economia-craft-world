"use client"

import { usePrices } from "@/hooks/use-prices"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { PriceTable } from "@/components/price-table"
import { OpportunitiesPanel } from "@/components/opportunities-panel"
import { AdBanner } from "@/components/ad-banner"
import { Footer } from "@/components/footer"
import { MaintenancePage } from "@/components/maintenance-page"
import { useI18n } from "@/lib/i18n"
import { useMemo } from "react"
import useSWR from "swr"

const fetcher = (url: string) => 
  fetch(url)
    .then((r) => {
      if (!r.ok) return null
      return r.json().catch(() => null)
    })
    .catch(() => null)


export default function Home() {
  const { prices, pools, timestamp, count, isLoading, isValidating, refresh, productionCosts, thresholds, alertsConfig, banners, dynoCoinPriceUsd } = usePrices()
  const { t } = useI18n()

  // Check maintenance mode
  const { data: maintenance } = useSWR("/api/maintenance", fetcher, {
    refreshInterval: 30 * 1000,
    revalidateOnFocus: true,
    onError: (error) => console.error("[v0] Maintenance check error:", error),
  })

  // Fetch public customization
  const { data: customization } = useSWR("/api/customization", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    onError: (error) => console.error("[v0] Customization fetch error:", error),
  })

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

  const footerCredits = customization?.footerCredits || ""
  const footerLinks = customization?.footerLinks || "Telegram: @bondsbtc | Dados via GeckoTerminal API | Rede Ronin"
  const footerDisclaimer = customization?.footerDisclaimer || t("footer.disclaimer")
  const footerSocialLinks = customization?.footerSocialLinks || {
    github: "https://github.com",
    telegram: "https://t.me/bondsbtc",
    twitter: "https://x.com",
  }
  const footerBannerAd = customization?.footerBannerAd || {
    enabled: false,
    imageUrl: undefined,
    linkUrl: undefined,
    altText: "Advertisement",
    adScript: undefined,
  }

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

          {/* Stats Cards */}
          {showStats && (
            <StatsCards
              prices={prices}
              isLoading={isLoading}
              productionCosts={productionCosts}
              thresholds={thresholds}
              alertsConfig={alertsConfig}
            />
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

          {/* Footer with social links and banner ad */}
          <Footer
            credits={footerCredits}
            links={footerLinks}
            disclaimer={footerDisclaimer}
            socialLinks={footerSocialLinks}
            bannerAd={footerBannerAd}
          />
        </div>
      </div>
    </main>
  )
}

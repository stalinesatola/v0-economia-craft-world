'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { NFTStats } from '@/components/nft-stats'
import { Footer } from '@/components/footer'
import { useI18n } from '@/lib/i18n'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) return null
      return r.json().catch(() => null)
    })
    .catch(() => null)

export default function NFTsPage() {
  const { t } = useI18n()

  // Fetch public customization
  const { data: customization } = useSWR('/api/customization', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const footerCredits = customization?.footerCredits || ''
  const footerLinks = customization?.footerLinks || 'Telegram: @bondsbtc | Dados via OpenSea API | Fire Dynos NFT Collection'
  const footerDisclaimer = customization?.footerDisclaimer || t('footer.disclaimer')
  const footerSocialLinks = customization?.footerSocialLinks || {
    github: 'https://github.com',
    telegram: 'https://t.me/bondsbtc',
    twitter: 'https://x.com',
  }
  const footerBannerAd = customization?.footerBannerAd || {
    enabled: false,
    imageUrl: undefined,
    linkUrl: undefined,
    altText: 'Advertisement',
    adScript: undefined,
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <DashboardHeader
            timestamp={new Date().toISOString()}
            count={0}
            isValidating={false}
            onRefresh={() => window.location.reload()}
            customization={customization ?? undefined}
          />

          {/* NFT Stats */}
          <NFTStats />

          {/* Footer */}
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

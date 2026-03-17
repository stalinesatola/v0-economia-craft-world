"use client"

// Force rebuild - turbopack cache invalidation
import { usePrices } from "@/hooks/use-prices"
import { ProductionChain } from "@/components/production-chain"
import { DashboardHeader } from "@/components/dashboard-header"
import { useI18n } from "@/lib/i18n"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null)

export default function ProducaoPage() {
  const { prices, pools, timestamp, count, isLoading, isValidating, refresh, productionCosts } = usePrices()
  const { t } = useI18n()
  const { data: customization } = useSWR("/api/customization", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <DashboardHeader
            timestamp={timestamp}
            count={count}
            isValidating={isValidating || isLoading}
            onRefresh={() => refresh()}
            customization={customization ?? undefined}
          />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              {t("producao.backToDashboard")}
            </Link>
            <h2 className="text-lg font-bold text-foreground">{t("producao.title")}</h2>
          </div>

          <ProductionChain prices={prices} pools={pools} productionCosts={productionCosts} />
        </div>
      </div>
    </main>
  )
}

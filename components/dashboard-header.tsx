"use client"

import { RefreshCw, Activity, Zap, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RonPrice } from "@/components/ron-price"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"
import Link from "next/link"

interface DashboardHeaderProps {
  timestamp?: string
  count: number
  isValidating: boolean
  onRefresh: () => void
  customization?: {
    headerLogo?: string
    headerText?: string
    modules?: {
      showChain?: boolean
    }
  }
}

export function DashboardHeader({ timestamp, count, isValidating, onRefresh, customization }: DashboardHeaderProps) {
  const { t, locale } = useI18n()

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--"

  const headerText = customization?.headerText || t("app.title")

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {customization?.headerLogo ? (
          <img
            src={customization.headerLogo}
            alt={headerText}
            className="h-10 w-10 rounded-lg object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl text-balance">
            {headerText}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("app.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RonPrice />

        {customization?.modules?.showChain !== false && (
          <Link href="/producao">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Producao</span>
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <Activity className={`h-3.5 w-3.5 ${isValidating ? "text-primary animate-pulse" : "text-primary"}`} />
          <span className="text-xs font-medium text-secondary-foreground font-mono">
            {isValidating && count === 0 ? t("dashboard.loading") : `${count} ${t("dashboard.pools")}`}
          </span>
        </div>

        <div className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-2 sm:flex">
          <span className="text-xs font-medium text-secondary-foreground font-mono">{formattedTime}</span>
        </div>

        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isValidating} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{t("dashboard.refresh")}</span>
        </Button>

        <LanguageSwitcher />
      </div>
    </header>
  )
}

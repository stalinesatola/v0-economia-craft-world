"use client"

import { Wrench } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message }: MaintenancePageProps) {
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="h-10 w-10 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground text-balance">
            {t("maintenance.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("maintenance.subtitle")}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-card-foreground leading-relaxed">
            {message || t("maintenance.defaultMessage")}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Craft World Economy
        </p>
      </div>
    </div>
  )
}

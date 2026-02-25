"use client"

import { useI18n, type Locale } from "@/lib/i18n"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  const toggle = () => {
    const next: Locale = locale === "pt" ? "en" : "pt"
    setLocale(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
      aria-label="Switch language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="font-mono uppercase">{locale}</span>
    </button>
  )
}

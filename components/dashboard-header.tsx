"use client"

import { RefreshCw, Activity, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RonPrice } from "@/components/ron-price"
import Link from "next/link"

interface DashboardHeaderProps {
  timestamp?: string
  count: number
  isValidating: boolean
  onRefresh: () => void
}

export function DashboardHeader({ timestamp, count, isValidating, onRefresh }: DashboardHeaderProps) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--"

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl text-balance">
            Craft World Economy
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor de Precos | Rede Ronin
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RonPrice />

        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <Activity className={`h-3.5 w-3.5 ${isValidating ? "text-primary animate-pulse" : "text-primary"}`} />
          <span className="text-xs font-medium text-secondary-foreground font-mono">
            {isValidating && count === 0 ? "A carregar..." : `${count} pools`}
          </span>
        </div>

        <div className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-2 sm:flex">
          <span className="text-xs text-muted-foreground">Atualizado:</span>
          <span className="text-xs font-medium text-secondary-foreground font-mono">{formattedTime}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isValidating}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>

        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}

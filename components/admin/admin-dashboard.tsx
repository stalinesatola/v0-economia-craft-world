"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PoolsTab } from "@/components/admin/tabs/pools-tab"
import { ChainsTab } from "@/components/admin/tabs/chains-tab"
import { TelegramTab } from "@/components/admin/tabs/telegram-tab"
import { SettingsTab } from "@/components/admin/tabs/settings-tab"
import { BannersTab } from "@/components/admin/tabs/banners-tab"
import { SharingTab } from "@/components/admin/tabs/sharing-tab"
import { LogOut, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { AppConfig } from "@/lib/config-manager"

interface AdminDashboardProps {
  onLogout: () => void
  initialConfig?: AppConfig | null
}

export function AdminDashboard({ onLogout, initialConfig }: AdminDashboardProps) {
  const [config, setConfig] = useState<AppConfig | null>(initialConfig ?? null)
  const [loading, setLoading] = useState(!initialConfig)
  const [saving, setSaving] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch {
      // Error fetching config
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Skip initial fetch if we already have config from login
    if (!initialConfig) {
      fetchConfig()
    }
  }, [fetchConfig, initialConfig])

  const updateSection = async (section: string, data: unknown): Promise<boolean> => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/config/${section}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await fetchConfig()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Painel de Administracao</h1>
                <p className="text-xs text-muted-foreground">
                  Craft World Economy - Gerir pools, custos, alertas e bot Telegram
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchConfig}
                disabled={saving}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
                Recarregar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pools" className="w-full">
            <TabsList className="flex w-full overflow-x-auto bg-secondary">
              <TabsTrigger value="pools" className="text-xs">Pools</TabsTrigger>
              <TabsTrigger value="chains" className="text-xs">Producao</TabsTrigger>
              <TabsTrigger value="telegram" className="text-xs">Telegram</TabsTrigger>
              <TabsTrigger value="sharing" className="text-xs">Partilha</TabsTrigger>
              <TabsTrigger value="banners" className="text-xs">Banners</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="pools" className="mt-4">
              <PoolsTab config={config} onUpdate={updateSection} saving={saving} />
            </TabsContent>

            <TabsContent value="chains" className="mt-4">
              <ChainsTab config={config} onUpdate={updateSection} saving={saving} />
            </TabsContent>

            <TabsContent value="telegram" className="mt-4">
              <TelegramTab config={config} onUpdate={updateSection} saving={saving} />
            </TabsContent>

            <TabsContent value="sharing" className="mt-4">
              <SharingTab config={config} onUpdate={updateSection} saving={saving} />
            </TabsContent>

            <TabsContent value="banners" className="mt-4">
              <BannersTab config={config} onUpdate={updateSection} saving={saving} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <SettingsTab config={config} onUpdate={updateSection} saving={saving} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

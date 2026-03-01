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
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"
import { LogOut, ArrowLeft, RefreshCw, ShieldAlert } from "lucide-react"
import Link from "next/link"
import type { AppConfig } from "@/lib/config-manager"

interface UserInfo {
  username: string
  role: string
  permissions?: Record<string, boolean>
}

interface AdminDashboardProps {
  onLogout: () => void
  initialConfig?: AppConfig | null
  userInfo?: UserInfo | null
}

export function AdminDashboard({ onLogout, initialConfig, userInfo }: AdminDashboardProps) {
  const { t } = useI18n()
  const [config, setConfig] = useState<AppConfig | null>(initialConfig ?? null)
  const [loading, setLoading] = useState(!initialConfig)
  const [saving, setSaving] = useState(false)

  // Permission check - superadmin (username "admin") always has full access
  const isSuperAdmin = userInfo?.username === "admin" || userInfo?.role === "admin"
  const perms = userInfo?.permissions ?? (isSuperAdmin ? {
    pools: true, chains: true, telegram: true, sharing: true, banners: true, settings: true, users: true,
  } : {
    pools: false, chains: false, telegram: false, sharing: false, banners: false, settings: false, users: false,
  })

  const canEdit = (section: string) => {
    if (isSuperAdmin) return true
    return perms[section] === true
  }

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch {
      // Error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialConfig) fetchConfig()
  }, [fetchConfig, initialConfig])

  const updateSection = async (section: string, data: unknown): Promise<boolean> => {
    console.log("[v0] updateSection called:", section, "canEdit:", canEdit(section))
    if (!canEdit(section)) return false
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/config/${section}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      console.log("[v0] updateSection response:", res.status, res.ok)
      if (res.ok) {
        await fetchConfig()
        return true
      }
      const err = await res.text()
      console.error("[v0] updateSection error response:", err)
      return false
    } catch (e) {
      console.error("[v0] updateSection fetch error:", e)
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

  // Determine which tabs to show
  const visibleTabs = [
    { id: "pools", label: t("admin.pools"), perm: "pools" },
    { id: "chains", label: t("admin.production"), perm: "chains" },
    { id: "telegram", label: t("admin.telegram"), perm: "telegram" },
    { id: "sharing", label: t("admin.sharing"), perm: "sharing" },
    { id: "banners", label: t("admin.banners"), perm: "banners" },
    { id: "settings", label: t("admin.config"), perm: "settings" },
  ].filter((tab) => isSuperAdmin || canEdit(tab.perm))

  const defaultTab = visibleTabs[0]?.id || "pools"

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
                {t("admin.dashboard")}
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{t("admin.title")}</h1>
                <p className="text-xs text-muted-foreground">
                  {userInfo?.username && (
                    <span className="font-medium text-card-foreground">{userInfo.username}</span>
                  )}
                  {userInfo?.role && (
                    <span className="ml-1 text-muted-foreground">({userInfo.role})</span>
                  )}
                  {" - "}{t("admin.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" size="sm" onClick={fetchConfig} disabled={saving} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
                {t("admin.reload")}
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-muted-foreground hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
                {t("admin.logout")}
              </Button>
            </div>
          </div>

          {visibleTabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <ShieldAlert className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sem permissoes de acesso a configuracoes.</p>
            </div>
          ) : (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="flex w-full overflow-x-auto bg-secondary">
                {visibleTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {canEdit("pools") && (
                <TabsContent value="pools" className="mt-4">
                  <PoolsTab config={config} onUpdate={updateSection} saving={saving} />
                </TabsContent>
              )}
              {canEdit("chains") && (
                <TabsContent value="chains" className="mt-4">
                  <ChainsTab config={config} onUpdate={updateSection} saving={saving} />
                </TabsContent>
              )}
              {canEdit("telegram") && (
                <TabsContent value="telegram" className="mt-4">
                  <TelegramTab config={config} onUpdate={updateSection} saving={saving} />
                </TabsContent>
              )}
              {canEdit("sharing") && (
                <TabsContent value="sharing" className="mt-4">
                  <SharingTab config={config} onUpdate={updateSection} saving={saving} />
                </TabsContent>
              )}
              {canEdit("banners") && (
                <TabsContent value="banners" className="mt-4">
                  <BannersTab config={config} onUpdate={updateSection} saving={saving} />
                </TabsContent>
              )}
              {canEdit("settings") && (
                <TabsContent value="settings" className="mt-4">
                  <SettingsTab config={config} onUpdate={updateSection} saving={saving} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, Search, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { AppConfig } from "@/lib/config-manager"

interface PoolsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function PoolsTab({ config, onUpdate, saving }: PoolsTabProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState("")
  const [expandedResource, setExpandedResource] = useState<string | null>(null)
  const [localPools, setLocalPools] = useState<Record<string, string>>(config?.pools ?? {})
  const [localAlerts, setLocalAlerts] = useState<Record<string, { enabled?: boolean; priority?: string; category?: string }>>(config?.alertsConfig ?? {})
  const [hasChanges, setHasChanges] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; symbol: string }>({ isOpen: false, symbol: "" })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSymbol, setNewSymbol] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCategory, setNewCategory] = useState<string>("factory")
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("low")
  const [newImageUrl, setNewImageUrl] = useState("")

  useEffect(() => {
    setLocalPools(config?.pools ?? {})
    setLocalAlerts(config?.alertsConfig ?? {})
    setHasChanges(false)
  }, [config?.pools, config?.alertsConfig])

  const safePools = localPools ?? {}
  const symbols = Object.keys(safePools).filter((s) => s.toLowerCase().includes(search.toLowerCase()))

  const handlePoolChange = (symbol: string, address: string) => {
    setLocalPools((prev) => ({ ...prev, [symbol]: address }))
    setHasChanges(true)
  }

  const handleAlertChange = (symbol: string, field: string, value: unknown) => {
    setLocalAlerts((prev) => ({
      ...prev,
      [symbol]: { ...prev[symbol], [field]: value },
    }))
    setHasChanges(true)
  }

  const handleAddPool = () => {
    const symbol = newSymbol.toUpperCase().trim()
    if (!symbol || !newAddress.trim()) return
    if (safePools[symbol]) return

    setLocalPools((prev) => ({ ...prev, [symbol]: newAddress.trim() }))
    setLocalAlerts((prev) => ({
      ...prev,
      [symbol]: { enabled: true, priority: newPriority, category: newCategory, imageUrl: newImageUrl.trim() || undefined },
    }))
    setHasChanges(true)
    setNewSymbol("")
    setNewAddress("")
    setNewImageUrl("")
    setShowAddForm(false)
  }

  const handleDeletePoolClick = (symbol: string) => {
    setConfirmDialog({ isOpen: true, symbol })
  }

  const handleDeletePoolConfirm = (symbol: string) => {
    setLocalPools((prev) => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
    setLocalAlerts((prev) => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
    setHasChanges(true)
    if (expandedResource === symbol) setExpandedResource(null)
    setConfirmDialog({ isOpen: false, symbol: "" })
  }

  const handleSave = async () => {
    const r1 = await onUpdate("pools", localPools)
    const r2 = await onUpdate("alertsConfig", localAlerts)
    if (r1 && r2) {
      setHasChanges(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remover Recurso"
        description={`Tem a certeza que deseja remover '${confirmDialog.symbol}'? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        isDangerous={true}
        onConfirm={() => handleDeletePoolConfirm(confirmDialog.symbol)}
        onCancel={() => setConfirmDialog({ isOpen: false, symbol: "" })}
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">{t("admin.pools")} & {t("table.resource")}</CardTitle>
              <CardDescription>{symbols.length} {t("dashboard.pools")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddForm ? t("chart.close") : t("table.resource")}
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {t("admin.save")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("admin.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="border-t border-border pt-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">{t("admin.symbol")}</Label>
                  <Input
                    type="text"
                    placeholder="ACID"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("admin.contract")}</Label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("admin.category")}</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factory">Factory</SelectItem>
                      <SelectItem value="slp">SLP</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("admin.priority")}</Label>
                  <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddPool} size="sm" className="mt-2 gap-1.5 w-full">
                <Plus className="h-3.5 w-3.5" />
                {t("admin.add")}
              </Button>
            </div>
          )}

          {/* Pools List */}
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {symbols.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">{t("admin.empty")}</p>
            ) : (
              symbols.map((symbol) => (
                <div key={symbol} className="border border-border rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedResource(expandedResource === symbol ? null : symbol)}
                      className="flex items-center gap-2 flex-1 hover:text-primary transition-colors"
                    >
                      {expandedResource === symbol ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      <span className="font-semibold text-xs">{symbol}</span>
                      <Badge variant="outline" className="text-xs ml-2">{localAlerts[symbol]?.priority || "low"}</Badge>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePoolClick(symbol)}
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {expandedResource === symbol && (
                    <div className="mt-2 pt-2 border-t border-border space-y-2">
                      <div>
                        <Label className="text-xs">{t("admin.contract")}</Label>
                        <Input
                          type="text"
                          value={safePools[symbol]}
                          onChange={(e) => handlePoolChange(symbol, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{t("admin.enabled")}</Label>
                        <Switch
                          checked={localAlerts[symbol]?.enabled ?? true}
                          onCheckedChange={(v) => handleAlertChange(symbol, "enabled", v)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

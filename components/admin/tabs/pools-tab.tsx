"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  useEffect(() => {
    setLocalPools(config?.pools ?? {})
    setLocalAlerts(config?.alertsConfig ?? {})
    setHasChanges(false)
  }, [config?.pools, config?.alertsConfig])

  const safePools = localPools ?? {}
  const symbols = Object.keys(safePools).filter(s => s.toLowerCase().includes(search.toLowerCase()))

  const handlePoolChange = (symbol: string, address: string) => {
    setLocalPools(prev => ({ ...prev, [symbol]: address }))
    setHasChanges(true)
  }

  const handleAlertChange = (symbol: string, field: string, value: unknown) => {
    setLocalAlerts(prev => ({
      ...prev,
      [symbol]: { ...prev[symbol], [field]: value },
    }))
    setHasChanges(true)
  }

  const handleAddPool = () => {
    const symbol = newSymbol.toUpperCase().trim()
    if (!symbol || !newAddress.trim()) return
    if (safePools[symbol]) return

    setLocalPools(prev => ({ ...prev, [symbol]: newAddress.trim() }))
    setLocalAlerts(prev => ({
      ...prev,
      [symbol]: { enabled: true, priority: "low", category: "factory" },
    }))
    setHasChanges(true)
    setNewSymbol("")
    setNewAddress("")
    setShowAddForm(false)
  }

  const handleDeletePoolClick = (symbol: string) => {
    setConfirmDialog({ isOpen: true, symbol })
  }

  const handleDeletePoolConfirm = (symbol: string) => {
    setLocalPools(prev => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
    setLocalAlerts(prev => {
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
          <CardTitle>{t("admin.pools")}</CardTitle>
          <CardDescription>{t("admin.manageResourcePools")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.search")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border text-card-foreground"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("admin.add")}
            </Button>
          </div>

          {showAddForm && (
            <div className="border border-border rounded-lg p-4 space-y-3 bg-secondary/30">
              <div className="flex gap-2">
                <Input placeholder="Symbol (e.g., ACID)" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} className="bg-secondary border-border text-card-foreground" />
                <Input placeholder="Contract Address" value={newAddress} onChange={e => setNewAddress(e.target.value)} className="flex-1 bg-secondary border-border text-card-foreground" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setNewSymbol(""); setNewAddress(""); }}>
                  {t("admin.cancel")}
                </Button>
                <Button size="sm" onClick={handleAddPool} disabled={!newSymbol || !newAddress}>
                  {t("admin.add")}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {symbols.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("admin.noItems")}</p>
            ) : (
              symbols.map(symbol => (
                <div key={symbol} className="border border-border rounded-lg bg-secondary/30">
                  <button
                    onClick={() => setExpandedResource(expandedResource === symbol ? null : symbol)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedResource === symbol ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="font-medium text-card-foreground">{symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {localAlerts[symbol]?.priority || "low"}
                      </Badge>
                    </div>
                  </button>

                  {expandedResource === symbol && (
                    <div className="border-t border-border p-3 space-y-3 bg-card/30">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("admin.address")}</Label>
                        <Input
                          value={safePools[symbol]}
                          onChange={e => handlePoolChange(symbol, e.target.value)}
                          className="mt-1 bg-secondary border-border text-card-foreground text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{t("admin.enabled")}</Label>
                        <Switch
                          checked={localAlerts[symbol]?.enabled ?? true}
                          onCheckedChange={v => handleAlertChange(symbol, "enabled", v)}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">{t("admin.priority")}</Label>
                        <Select value={localAlerts[symbol]?.priority || "low"} onValueChange={v => handleAlertChange(symbol, "priority", v)}>
                          <SelectTrigger className="mt-1 bg-secondary border-border text-card-foreground h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePoolClick(symbol)}
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("admin.remove")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="w-full gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? "A guardar..." : t("admin.save")}
      </Button>
    </div>
  )
}

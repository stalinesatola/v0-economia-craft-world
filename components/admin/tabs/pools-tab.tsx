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
  const [localPools, setLocalPools] = useState(config.pools ?? {})
  const [localCosts, setLocalCosts] = useState(config.productionCosts ?? {})
  const [localAlerts, setLocalAlerts] = useState(config.alertsConfig ?? {})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalPools(config.pools ?? {})
    setLocalCosts(config.productionCosts ?? {})
    setLocalAlerts(config.alertsConfig ?? {})
    setHasChanges(false)
  }, [config.pools, config.productionCosts, config.alertsConfig])

  // Add pool form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSymbol, setNewSymbol] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCost, setNewCost] = useState("0")
  const [newCategory, setNewCategory] = useState<"mine" | "factory" | "token">("factory")
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("low")

  const symbols = Object.keys(localPools).filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  const handlePoolChange = (symbol: string, address: string) => {
    setLocalPools((prev) => ({ ...prev, [symbol]: address }))
    setHasChanges(true)
  }

  const handleCostChange = (symbol: string, field: string, value: string | number) => {
    setLocalCosts((prev) => ({
      ...prev,
      [symbol]: { ...prev[symbol], [field]: value },
    }))
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
    if (localPools[symbol]) return // Already exists

    setLocalPools((prev) => ({ ...prev, [symbol]: newAddress.trim() }))
    setLocalCosts((prev) => ({
      ...prev,
      [symbol]: { cost_usd: parseFloat(newCost) || 0, levels: 1 },
    }))
    setLocalAlerts((prev) => ({
      ...prev,
      [symbol]: { enabled: true, priority: newPriority, category: newCategory },
    }))
    setHasChanges(true)
    setNewSymbol("")
    setNewAddress("")
    setNewCost("0")
    setShowAddForm(false)
  }

  const handleDeletePool = (symbol: string) => {
    if (!confirm(`Remover '${symbol}'?`)) return
    setLocalPools((prev) => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
    setLocalCosts((prev) => {
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
  }

  const handleSave = async () => {
    const r1 = await onUpdate("pools", localPools)
    const r2 = await onUpdate("productionCosts", localCosts)
    const r3 = await onUpdate("alertsConfig", localAlerts)
    if (r1 && r2 && r3) {
      setHasChanges(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">
                {t("admin.pools")} & {t("table.resource")}
              </CardTitle>
              <CardDescription>
                {symbols.length} {t("dashboard.pools")}
              </CardDescription>
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
                {saving ? "..." : t("admin.reload")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Pool Form */}
          {showAddForm && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">Adicionar Novo Recurso</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Simbolo</Label>
                  <Input
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="ex: GOLD"
                    className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Pool Address</Label>
                  <Input
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                    className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Custo USD</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as "mine" | "factory" | "token")}>
                    <SelectTrigger className="bg-secondary border-border text-card-foreground h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mine">{t("table.mine")}</SelectItem>
                      <SelectItem value="factory">{t("table.factory")}</SelectItem>
                      <SelectItem value="token">{t("table.token")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Prioridade</Label>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as "high" | "medium" | "low")}>
                    <SelectTrigger className="bg-secondary border-border text-card-foreground h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddPool}
                    disabled={!newSymbol.trim() || !newAddress.trim() || !!localPools[newSymbol.toUpperCase().trim()]}
                    size="sm"
                    className="w-full gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
              </div>
              {localPools[newSymbol.toUpperCase().trim()] && newSymbol.trim() && (
                <p className="mt-2 text-xs text-destructive">Simbolo ja existe!</p>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("table.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-secondary border-border text-card-foreground h-9 text-sm"
            />
          </div>

          {/* Resource List */}
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {symbols.map((symbol) => {
              const cost = localCosts[symbol]
              const alert = localAlerts[symbol]
              const isExpanded = expandedResource === symbol

              return (
                <div
                  key={symbol}
                  className="rounded-lg border border-border bg-secondary/50"
                >
                  {/* Collapsed row */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedResource(isExpanded ? null : symbol)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedResource(isExpanded ? null : symbol) } }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-secondary/80 transition-colors rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-card-foreground w-20">
                        {symbol}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          alert?.category === "mine"
                            ? "border-chart-3 text-chart-3"
                            : alert?.category === "token"
                              ? "border-chart-2 text-chart-2"
                              : "border-primary text-primary"
                        }
                      >
                        {alert?.category || "factory"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          alert?.priority === "high"
                            ? "border-destructive text-destructive"
                            : alert?.priority === "medium"
                              ? "border-chart-3 text-chart-3"
                              : "border-muted-foreground text-muted-foreground"
                        }
                      >
                        {alert?.priority || "low"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        ${cost?.cost_usd ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={alert?.enabled ?? false}
                          onCheckedChange={(v) => handleAlertChange(symbol, "enabled", v)}
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">Pool Address</Label>
                          <Input
                            value={localPools[symbol]}
                            onChange={(e) => handlePoolChange(symbol, e.target.value)}
                            className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">{t("table.productionCost")} (USD)</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={cost?.cost_usd ?? 0}
                            onChange={(e) => handleCostChange(symbol, "cost_usd", parseFloat(e.target.value) || 0)}
                            className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">Categoria</Label>
                          <Select
                            value={alert?.category || "factory"}
                            onValueChange={(v) => handleAlertChange(symbol, "category", v)}
                          >
                            <SelectTrigger className="bg-background border-border text-card-foreground h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mine">{t("table.mine")}</SelectItem>
                              <SelectItem value="factory">{t("table.factory")}</SelectItem>
                              <SelectItem value="token">{t("table.token")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">Prioridade</Label>
                          <Select
                            value={alert?.priority || "low"}
                            onValueChange={(v) => handleAlertChange(symbol, "priority", v)}
                          >
                            <SelectTrigger className="bg-background border-border text-card-foreground h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="medium">Media</SelectItem>
                              <SelectItem value="low">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {cost?.source && (
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Fonte</Label>
                            <Input
                              value={cost.source}
                              onChange={(e) => handleCostChange(symbol, "source", e.target.value)}
                              className="bg-background border-border text-card-foreground h-8 text-xs"
                            />
                          </div>
                        )}
                        {cost?.input && (
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Input</Label>
                            <Input
                              value={cost.input}
                              onChange={(e) => handleCostChange(symbol, "input", e.target.value)}
                              className="bg-background border-border text-card-foreground h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePool(symbol)}
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

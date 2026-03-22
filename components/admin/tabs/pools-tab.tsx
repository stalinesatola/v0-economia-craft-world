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
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; symbol: string }>({ isOpen: false, symbol: "" })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSymbol, setNewSymbol] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCategory, setNewCategory] = useState<string>("factory")
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("low")

  useEffect(() => {
    setLocalPools(config?.pools ?? {})
    setLocalAlerts(config?.alertsConfig ?? {})
    setHasChanges(false)
  }, [config?.pools, config?.alertsConfig])

  const safePools = localPools ?? {}
  const symbols = Object.keys(safePools).filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  )

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
      [symbol]: { enabled: true, priority: newPriority, category: newCategory },
    }))
    setHasChanges(true)
    setNewSymbol("")
    setNewAddress("")
    setShowAddForm(false)
  }

  const handleDeletePoolClick = (symbol: string) => {
    setConfirmDelete({ isOpen: true, symbol })
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
    setConfirmDelete({ isOpen: false, symbol: "" })
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
        isOpen={confirmDelete.isOpen}
        title="Remover Recurso"
        description={`Tem a certeza que deseja remover '${confirmDelete.symbol}'? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        isDangerous={true}
        onConfirm={() => handleDeletePoolConfirm(confirmDelete.symbol)}
        onCancel={() => setConfirmDelete({ isOpen: false, symbol: "" })}
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{t("admin.pools") || "Pools"}</span>
          </CardTitle>
          <CardDescription>{t("admin.poolsDesc") || "Gerencie os pools de recursos"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-sm"
            />
          </div>

          {/* Add Pool Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1.5 w-fit"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Pool
          </Button>

          {/* Add Pool Form */}
          {showAddForm && (
            <div className="border-t border-border pt-3 space-y-2">
              <Label className="text-xs">Símbolo</Label>
              <Input
                placeholder="Ex: ACID"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="h-8 text-sm bg-secondary border-border"
              />
              <Label className="text-xs">Endereço do Pool</Label>
              <Input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="h-8 text-sm bg-secondary border-border"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factory">Factory</SelectItem>
                      <SelectItem value="cooking">Cooking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as any)}>
                    <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleAddPool} className="w-full h-7">
                Salvar
              </Button>
            </div>
          )}

          {/* Resources List */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {symbols.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhum recurso encontrado</p>
            ) : (
              symbols.map((symbol) => (
                <div key={symbol} className="rounded-lg border border-border bg-secondary/50">
                  <button
                    onClick={() =>
                      setExpandedResource(expandedResource === symbol ? null : symbol)
                    }
                    className="w-full flex items-center justify-between p-2 hover:bg-secondary/75 transition-colors"
                  >
                    <span className="font-medium text-sm">{symbol}</span>
                    {expandedResource === symbol ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {expandedResource === symbol && (
                    <div className="border-t border-border p-2 space-y-2">
                      <div>
                        <Label className="text-xs">Endereço</Label>
                        <Input
                          value={safePools[symbol] || ""}
                          onChange={(e) => handlePoolChange(symbol, e.target.value)}
                          className="h-7 text-xs bg-card border-border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Alertas Ativados</Label>
                        <Switch
                          checked={localAlerts[symbol]?.enabled ?? true}
                          onCheckedChange={(enabled) =>
                            handleAlertChange(symbol, "enabled", enabled)
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Prioridade</Label>
                        <Select
                          value={localAlerts[symbol]?.priority || "low"}
                          onValueChange={(priority) =>
                            handleAlertChange(symbol, "priority", priority)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs bg-card border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePoolClick(symbol)}
                        className="w-full gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Save Button */}
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 w-fit"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

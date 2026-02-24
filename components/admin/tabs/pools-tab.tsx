"use client"

import { useState } from "react"
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
import { Save, Search, ChevronDown, ChevronUp } from "lucide-react"
import type { AppConfig } from "@/lib/config-manager"

interface PoolsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function PoolsTab({ config, onUpdate, saving }: PoolsTabProps) {
  const [search, setSearch] = useState("")
  const [expandedResource, setExpandedResource] = useState<string | null>(null)
  const [localPools, setLocalPools] = useState(config.pools)
  const [localCosts, setLocalCosts] = useState(config.productionCosts)
  const [localAlerts, setLocalAlerts] = useState(config.alertsConfig)
  const [hasChanges, setHasChanges] = useState(false)

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
              <CardTitle className="text-base text-card-foreground">Pools & Recursos</CardTitle>
              <CardDescription>
                Gerir enderecos de pools, custos de producao, prioridades e alertas para {symbols.length} recursos
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "A guardar..." : "Guardar Tudo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar recurso..."
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
                  <button
                    type="button"
                    onClick={() => setExpandedResource(isExpanded ? null : symbol)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-secondary/80 transition-colors rounded-lg"
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
                      <Switch
                        checked={alert?.enabled ?? false}
                        onCheckedChange={(v) => handleAlertChange(symbol, "enabled", v)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border px-3 py-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Endereco Pool</Label>
                        <Input
                          value={localPools[symbol] || ""}
                          onChange={(e) => handlePoolChange(symbol, e.target.value)}
                          className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                          placeholder="0x..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Custo Producao (USD)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={cost?.cost_usd ?? 0}
                          onChange={(e) =>
                            handleCostChange(symbol, "cost_usd", parseFloat(e.target.value) || 0)
                          }
                          className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Input</Label>
                        <Input
                          value={cost?.input || ""}
                          onChange={(e) => handleCostChange(symbol, "input", e.target.value)}
                          className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                          placeholder="ex: EARTH"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Ratio</Label>
                        <Input
                          type="number"
                          value={cost?.ratio || ""}
                          onChange={(e) =>
                            handleCostChange(symbol, "ratio", parseInt(e.target.value) || 0)
                          }
                          className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Levels</Label>
                        <Input
                          type="number"
                          value={cost?.levels ?? 0}
                          onChange={(e) =>
                            handleCostChange(symbol, "levels", parseInt(e.target.value) || 0)
                          }
                          className="bg-background border-border text-card-foreground h-8 text-xs font-mono"
                        />
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
                            <SelectItem value="mine">Mine</SelectItem>
                            <SelectItem value="factory">Factory</SelectItem>
                            <SelectItem value="token">Token</SelectItem>
                          </SelectContent>
                        </Select>
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

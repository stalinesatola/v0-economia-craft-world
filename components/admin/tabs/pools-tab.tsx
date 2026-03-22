'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Search, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { AppConfig } from '@/lib/config-manager'

interface PoolsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function PoolsTab({ config, onUpdate, saving }: PoolsTabProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [expandedResource, setExpandedResource] = useState<string | null>(null)
  const [localPools, setLocalPools] = useState<Record<string, string>>(config?.pools ?? {})
  const [localAlerts, setLocalAlerts] = useState<Record<string, { enabled?: boolean; priority?: string; category?: string }>>(
    config?.alertsConfig ?? {}
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; symbol: string }>({ isOpen: false, symbol: '' })

  const [showAddForm, setShowAddForm] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [newAddress, setNewAddress] = useState('')

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
      [symbol]: { enabled: true, priority: 'low', category: 'factory' },
    }))
    setHasChanges(true)
    setNewSymbol('')
    setNewAddress('')
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
    setConfirmDialog({ isOpen: false, symbol: '' })
  }

  const handleSave = async () => {
    const r1 = await onUpdate('pools', localPools)
    const r2 = await onUpdate('alertsConfig', localAlerts)
    if (r1 && r2) {
      setHasChanges(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remover Recurso"
        description={`Tem a certeza que deseja remover '${confirmDialog.symbol}'?`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        isDangerous={true}
        onConfirm={() => handleDeletePoolConfirm(confirmDialog.symbol)}
        onCancel={() => setConfirmDialog({ isOpen: false, symbol: '' })}
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>{t('admin.pools')}</CardTitle>
          <CardDescription>Gerir recursos de pools</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar recursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {symbols.map(symbol => (
              <div key={symbol} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedResource(expandedResource === symbol ? null : symbol)}>
                  <div className="flex items-center gap-2">
                    <Badge>{symbol}</Badge>
                    <span className="text-sm text-muted-foreground">{safePools[symbol]}</span>
                  </div>
                  {expandedResource === symbol ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>

                {expandedResource === symbol && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-border">
                    <div>
                      <Label className="text-xs">Endereço</Label>
                      <Input
                        value={safePools[symbol]}
                        onChange={e => handlePoolChange(symbol, e.target.value)}
                        className="h-8 mt-1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Alertas Ativo</Label>
                      <Switch
                        checked={localAlerts[symbol]?.enabled !== false}
                        onCheckedChange={e => handleAlertChange(symbol, 'enabled', e)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePoolClick(symbol)}
                        className="gap-1.5 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showAddForm && (
            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Símbolo do Recurso</Label>
                    <Input
                      placeholder="ex: ACID"
                      value={newSymbol}
                      onChange={e => setNewSymbol(e.target.value)}
                      className="h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Endereço da Pool</Label>
                    <Input
                      placeholder="0x..."
                      value={newAddress}
                      onChange={e => setNewAddress(e.target.value)}
                      className="h-8 mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleAddPool}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} variant="outline" size="sm" className="gap-1.5 w-full">
              <Plus className="h-3.5 w-3.5" />
              Adicionar Pool
            </Button>
          )}

          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} className="gap-1.5 w-full">
              <Save className="h-3.5 w-3.5" />
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

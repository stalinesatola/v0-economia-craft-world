"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Save, Info } from "lucide-react"
import type { AppConfig } from "@/lib/config-manager"

interface SettingsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function SettingsTab({ config, onUpdate, saving }: SettingsTabProps) {
  const [buyThreshold, setBuyThreshold] = useState(config.thresholds.buy)
  const [sellThreshold, setSellThreshold] = useState(config.thresholds.sell)
  const [network, setNetwork] = useState(config.network)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    const r1 = await onUpdate("thresholds", { buy: buyThreshold, sell: sellThreshold })
    const r2 = await onUpdate("network", network)
    if (r1 && r2) setHasChanges(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Thresholds */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">Thresholds de Alerta</CardTitle>
              <CardDescription>
                Definir quando um recurso gera sinal de compra ou venda
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Buy Threshold */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-card-foreground">Threshold de Compra</Label>
              <Badge variant="outline" className="border-primary text-primary font-mono">
                -{buyThreshold}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Quando o preco de mercado esta X% abaixo do custo de producao, sinalizar COMPRA.
            </p>
            <div className="flex items-center gap-4">
              <Slider
                value={[buyThreshold]}
                onValueChange={([v]) => { setBuyThreshold(v); setHasChanges(true) }}
                min={5}
                max={50}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={buyThreshold}
                onChange={(e) => {
                  setBuyThreshold(parseInt(e.target.value) || 15)
                  setHasChanges(true)
                }}
                className="w-20 bg-secondary border-border text-card-foreground h-8 text-xs font-mono text-center"
                min={5}
                max={50}
              />
            </div>
          </div>

          {/* Sell Threshold */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-card-foreground">Threshold de Venda</Label>
              <Badge variant="outline" className="border-destructive text-destructive font-mono">
                +{sellThreshold}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Quando o preco de mercado esta X% acima do custo de producao, sinalizar VENDA.
            </p>
            <div className="flex items-center gap-4">
              <Slider
                value={[sellThreshold]}
                onValueChange={([v]) => { setSellThreshold(v); setHasChanges(true) }}
                min={5}
                max={50}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={sellThreshold}
                onChange={(e) => {
                  setSellThreshold(parseInt(e.target.value) || 20)
                  setHasChanges(true)
                }}
                className="w-20 bg-secondary border-border text-card-foreground h-8 text-xs font-mono text-center"
                min={5}
                max={50}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network & General */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Geral</CardTitle>
          <CardDescription>Rede e informacoes do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Rede</Label>
            <Input
              value={network}
              onChange={(e) => { setNetwork(e.target.value); setHasChanges(true) }}
              className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono max-w-xs"
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <p><span className="font-medium text-card-foreground">Versao:</span> Craft World Economy v1.0.0</p>
                <p><span className="font-medium text-card-foreground">API:</span> GeckoTerminal v2</p>
                <p><span className="font-medium text-card-foreground">Recursos:</span> {Object.keys(config.pools).length} pools configuradas</p>
                <p><span className="font-medium text-card-foreground">Alertas ativos:</span> {Object.values(config.alertsConfig).filter(a => a.enabled).length} recursos monitorizados</p>
                <p><span className="font-medium text-card-foreground">Cron:</span> Verificacao a cada {config.telegram.intervalMinutes}min via Vercel Cron</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

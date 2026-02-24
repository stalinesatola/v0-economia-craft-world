"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Send, Play, MessageSquare, Clock, AlertTriangle } from "lucide-react"
import type { AppConfig } from "@/lib/config-manager"

interface TelegramTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function TelegramTab({ config, onUpdate, saving }: TelegramTabProps) {
  const [botToken, setBotToken] = useState(config.telegram.botToken || "")
  const [chatId, setChatId] = useState(config.telegram.chatId || "")
  const [enabled, setEnabled] = useState(config.telegram.enabled)
  const [interval, setInterval] = useState(config.telegram.intervalMinutes || 5)
  const [hasChanges, setHasChanges] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [checkResult, setCheckResult] = useState<{ success: boolean; message: string; alerts?: string[] } | null>(null)
  const [testing, setTesting] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleSave = async () => {
    const success = await onUpdate("telegram", {
      botToken: botToken.startsWith("****") ? botToken : botToken,
      chatId,
      enabled,
      intervalMinutes: interval,
    })
    if (success) setHasChanges(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/telegram/test", { method: "POST" })
      const data = await res.json()
      setTestResult({
        success: res.ok,
        message: data.message || data.error || "Resultado desconhecido",
      })
    } catch {
      setTestResult({ success: false, message: "Erro de rede" })
    } finally {
      setTesting(false)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    setCheckResult(null)
    try {
      const res = await fetch("/api/admin/telegram/check", { method: "POST" })
      const data = await res.json()
      setCheckResult({
        success: res.ok,
        message: data.message || data.error || "Resultado desconhecido",
        alerts: data.alerts,
      })
    } catch {
      setCheckResult({ success: false, message: "Erro de rede" })
    } finally {
      setChecking(false)
    }
  }

  const isConfigured = botToken.length > 10 && chatId.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Configuration */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">Configuracao do Bot Telegram</CardTitle>
              <CardDescription>
                Token do bot, Chat ID e configuracoes de alertas automaticos
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Token do Bot</Label>
              <Input
                type="password"
                value={botToken}
                onChange={(e) => { setBotToken(e.target.value); setHasChanges(true) }}
                className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono"
                placeholder="123456789:AAHXXXXXXXX..."
              />
              <p className="text-xs text-muted-foreground">
                Obtenha via @BotFather no Telegram
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Chat ID</Label>
              <Input
                value={chatId}
                onChange={(e) => { setChatId(e.target.value); setHasChanges(true) }}
                className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono"
                placeholder="-100XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                ID do chat/grupo para alertas
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-card-foreground">Bot Ativo</span>
              <span className="text-xs text-muted-foreground">
                Enviar alertas automaticos quando oportunidades forem detetadas
              </span>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => { setEnabled(v); setHasChanges(true) }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Intervalo de Verificacao (minutos)</Label>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={60}
                value={interval}
                onChange={(e) => { setInterval(parseInt(e.target.value) || 5); setHasChanges(true) }}
                className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono w-24"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={isConfigured ? "border-primary text-primary" : "border-destructive text-destructive"}>
              {isConfigured ? "Configurado" : "Nao configurado"}
            </Badge>
            <Badge variant="outline" className={enabled ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"}>
              {enabled ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Test & Check */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Testar e Verificar</CardTitle>
          <CardDescription>Enviar mensagem de teste ou executar verificacao manual</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Test Message */}
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Mensagem de Teste</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Envia uma mensagem simples para verificar que o bot e o Chat ID estao corretos.
              </p>
              <Button
                onClick={handleTest}
                disabled={testing || !isConfigured}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {testing ? "A enviar..." : "Enviar Teste"}
              </Button>
              {testResult && (
                <div className={`rounded-md p-2 text-xs ${
                  testResult.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Manual Check */}
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-chart-3" />
                <span className="text-sm font-medium text-card-foreground">Verificacao Manual</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Executa o ciclo de verificacao completo: busca precos, compara com custos e mostra alertas.
              </p>
              <Button
                onClick={handleCheck}
                disabled={checking}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Play className="h-3.5 w-3.5" />
                {checking ? "A verificar..." : "Executar Verificacao"}
              </Button>
              {checkResult && (
                <div className={`rounded-md p-2 text-xs ${
                  checkResult.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}>
                  <p>{checkResult.message}</p>
                  {checkResult.alerts && checkResult.alerts.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {checkResult.alerts.map((alert, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{alert}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

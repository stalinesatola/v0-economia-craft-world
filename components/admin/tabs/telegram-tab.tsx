"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Send, Play, MessageSquare, Clock, AlertTriangle, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { AppConfig } from "@/lib/config-manager"

interface TelegramTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
  authToken?: string | null
}

const DEFAULT_TEMPLATE = `📊 *Craft World Economy Alert*

{SIGNAL_ICON} *{SIGNAL_TYPE}* — {SYMBOL}
💰 Preço: \${PRICE}
🏭 Custo: \${COST}
📈 Desvio: {DEVIATION}%

⏰ {TIMESTAMP}`

const TEMPLATE_VARS = [
  { var: "{SIGNAL_ICON}", desc: "Icone do sinal (compra/venda)" },
  { var: "{SIGNAL_TYPE}", desc: "COMPRA ou VENDA" },
  { var: "{SYMBOL}", desc: "Nome do recurso" },
  { var: "{PRICE}", desc: "Preco de mercado" },
  { var: "{COST}", desc: "Custo de producao" },
  { var: "{DEVIATION}", desc: "Desvio percentual" },
  { var: "{TIMESTAMP}", desc: "Data/hora do alerta" },
]

export function TelegramTab({ config, onUpdate, saving, authToken }: TelegramTabProps) {
  const { t } = useI18n()
  const tg = config.telegram ?? { botToken: "", chatId: "", enabled: false, intervalMinutes: 30 }
  const [botToken, setBotToken] = useState(tg.botToken || "")
  const [chatId, setChatId] = useState(tg.chatId || "")
  const [enabled, setEnabled] = useState(tg.enabled ?? false)
  const [interval, setInterval] = useState(tg.intervalMinutes || 5)
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(tg.priceAlertEnabled ?? false)
  const [priceAlertSymbol, setPriceAlertSymbol] = useState(tg.priceAlertSymbol || "DYNO")
  const [priceAlertInterval, setPriceAlertInterval] = useState(tg.priceAlertIntervalMinutes || 5)
  const [customAlertMessage, setCustomAlertMessage] = useState(tg.customAlertMessage || "")
  const [messageTemplate, setMessageTemplate] = useState(
    (tg as Record<string, unknown>).messageTemplate as string || DEFAULT_TEMPLATE
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    setBotToken(config.telegram?.botToken || "")
    setChatId(config.telegram?.chatId || "")
    setEnabled(config.telegram?.enabled ?? false)
    setInterval(config.telegram?.intervalMinutes || 5)
    setPriceAlertEnabled(config.telegram?.priceAlertEnabled ?? false)
    setPriceAlertSymbol(config.telegram?.priceAlertSymbol || "DYNO")
    setPriceAlertInterval(config.telegram?.priceAlertIntervalMinutes || 5)
    setCustomAlertMessage(config.telegram?.customAlertMessage || "")
    setMessageTemplate((config.telegram as Record<string, unknown>)?.messageTemplate as string || DEFAULT_TEMPLATE)
    setHasChanges(false)
  }, [config.telegram])
  const [checkResult, setCheckResult] = useState<{ success: boolean; message: string; alerts?: string[] } | null>(null)
  const [testing, setTesting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [showTemplateHelp, setShowTemplateHelp] = useState(false)

  const handleSave = async () => {
    const payload = {
      botToken: botToken.startsWith("****") ? (config.telegram?.botToken ?? "") : botToken,
      chatId,
      enabled,
      intervalMinutes: interval,
      priceAlertEnabled,
      priceAlertSymbol,
      priceAlertIntervalMinutes: priceAlertInterval,
      customAlertMessage,
      messageTemplate,
    }
    const success = await onUpdate("telegram", payload)
    if (success) setHasChanges(false)
  }

  const getAuthHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (authToken) h["Authorization"] = `Bearer ${authToken}`
    return h
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/telegram/test", { method: "POST", headers: getAuthHeaders() })
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
      const res = await fetch("/api/admin/telegram/check", { method: "POST", headers: getAuthHeaders() })
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

  // Generate preview with sample data
  const previewTemplate = messageTemplate
    .replace("{SIGNAL_ICON}", "🟢")
    .replace("{SIGNAL_TYPE}", "COMPRA")
    .replace("{SYMBOL}", "STEEL")
    .replace("{PRICE}", "0.0234")
    .replace("{COST}", "0.0312")
    .replace("{DEVIATION}", "-25.0")
    .replace("{TIMESTAMP}", new Date().toLocaleString("pt-BR"))

  return (
    <div className="flex flex-col gap-4">
      {/* Configuration */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">
                {t("admin.telegram")} Bot
              </CardTitle>
              <CardDescription>
                Token do bot, Chat ID e configuracoes de alertas automaticos
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "..." : t("admin.reload")}
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

          {/* Alerta de Preco Periodico */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Alerta de Preco Periodico</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Envia o preco de um recurso especifico a cada ciclo de verificacao (ex: DYNO COIN a cada 5 min)
            </p>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3 mb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-card-foreground">Alerta de Preco Ativo</span>
                <span className="text-xs text-muted-foreground">
                  Envia preco, variacao 24h e volume do recurso selecionado
                </span>
              </div>
              <Switch
                checked={priceAlertEnabled}
                onCheckedChange={(v) => { setPriceAlertEnabled(v); setHasChanges(true) }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Simbolo do Recurso (da Pool)</Label>
                <Input
                  value={priceAlertSymbol}
                  onChange={(e) => { setPriceAlertSymbol(e.target.value.toUpperCase()); setHasChanges(true) }}
                  className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono"
                  placeholder="DYNO"
                />
                <p className="text-xs text-muted-foreground">
                  Deve estar cadastrado nas Pools (ex: DYNO, STEEL, GLASS)
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Intervalo do Alerta de Preco (minutos)</Label>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={priceAlertInterval}
                    onChange={(e) => { setPriceAlertInterval(parseInt(e.target.value) || 5); setHasChanges(true) }}
                    className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono w-24"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem Personalizada */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Mensagem Personalizada</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Texto adicional incluido no inicio de cada alerta enviado ao Telegram
            </p>
            <Textarea
              value={customAlertMessage}
              onChange={(e) => { setCustomAlertMessage(e.target.value); setHasChanges(true) }}
              rows={3}
              className="bg-secondary border-border text-card-foreground text-sm resize-none"
              placeholder="Ex: Craft World Economy - Alertas automaticos do servidor..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Template */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm text-card-foreground">Template de Mensagem</CardTitle>
                <CardDescription className="text-xs">
                  Personalize o formato das mensagens de alerta
                </CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplateHelp(!showTemplateHelp)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {showTemplateHelp && (
            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <p className="mb-2 text-xs font-semibold text-card-foreground">Variaveis disponiveis:</p>
              <div className="grid gap-1">
                {TEMPLATE_VARS.map((v) => (
                  <div key={v.var} className="flex items-center gap-2 text-xs">
                    <code className="rounded bg-background px-1.5 py-0.5 font-mono text-primary">{v.var}</code>
                    <span className="text-muted-foreground">{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Template</Label>
              <Textarea
                value={messageTemplate}
                onChange={(e) => { setMessageTemplate(e.target.value); setHasChanges(true) }}
                rows={8}
                className="bg-secondary border-border text-card-foreground text-sm font-mono resize-none"
                placeholder="Escreva o template da mensagem..."
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMessageTemplate(DEFAULT_TEMPLATE); setHasChanges(true) }}
                className="self-start text-xs text-muted-foreground"
              >
                Repor predefinido
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Pre-visualizacao</Label>
              <div className="rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-wrap font-mono min-h-[180px]">
                <span className="text-card-foreground">{previewTemplate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Testar Conexao</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !isConfigured}
              className="gap-1.5"
            >
              <Send className={`h-3.5 w-3.5 ${testing ? "animate-pulse" : ""}`} />
              Enviar Mensagem Teste
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheck}
              disabled={checking || !isConfigured}
              className="gap-1.5"
            >
              <Play className={`h-3.5 w-3.5 ${checking ? "animate-pulse" : ""}`} />
              Simular Verificacao
            </Button>
          </div>

          {!isConfigured && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Configure o Token e Chat ID antes de testar
            </div>
          )}

          {testResult && (
            <div className={`rounded-lg border px-3 py-2 text-xs ${testResult.success ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
              {testResult.message}
            </div>
          )}

          {checkResult && (
            <div className={`rounded-lg border px-3 py-2 text-xs ${checkResult.success ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
              <p>{checkResult.message}</p>
              {checkResult.alerts && checkResult.alerts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {checkResult.alerts.map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

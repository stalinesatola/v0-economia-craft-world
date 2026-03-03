"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Send, Play, MessageSquare, Clock, AlertTriangle, Info, History, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, Terminal } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { AppConfig } from "@/lib/config-manager"
import useSWR from "swr"

interface TelegramTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
  authToken?: string | null
}

interface AlertHistoryEntry {
  id: string
  timestamp: string
  type: "opportunity" | "price" | "test" | "command" | "error"
  success: boolean
  message: string
  details?: string
}

const TEMPLATE_VARS = [
  { var: "{SIGNAL_ICON}", desc: "Icone do sinal" },
  { var: "{SIGNAL_TYPE}", desc: "COMPRA ou VENDA" },
  { var: "{SYMBOL}", desc: "Nome do recurso" },
  { var: "{PRICE}", desc: "Preco de mercado" },
  { var: "{COST}", desc: "Custo de producao" },
  { var: "{DEVIATION}", desc: "Desvio percentual" },
  { var: "{TIMESTAMP}", desc: "Data/hora" },
]

const DEFAULT_TEMPLATE = `<b>Craft World Economy Alert</b>

{SIGNAL_ICON} <b>{SIGNAL_TYPE}</b> - {SYMBOL}
Preco: \${PRICE}
Custo: \${COST}
Desvio: {DEVIATION}%

{TIMESTAMP}`

const BOT_COMMANDS = [
  { cmd: "/precos", desc: "Ver todos os precos actuais" },
  { cmd: "/preco [SYM]", desc: "Preco de um recurso (ex: /preco DYNO)" },
  { cmd: "/alertas", desc: "Oportunidades de compra/venda" },
  { cmd: "/status", desc: "Estado do bot e config" },
  { cmd: "/historico", desc: "Ultimos 5 alertas" },
  { cmd: "/help", desc: "Ajuda" },
]

const historyFetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? document.cookie.match(/admin_token=([^;]+)/)?.[1] : null
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) return { history: [] }
  return res.json()
}

export function TelegramTab({ config, onUpdate, saving, authToken }: TelegramTabProps) {
  const { t } = useI18n()
  const tg = config.telegram ?? { botToken: "", chatId: "", enabled: false, intervalMinutes: 5 }

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
  const [checkResult, setCheckResult] = useState<{ success: boolean; message: string; alerts?: string[] } | null>(null)
  const [testing, setTesting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [showTemplateHelp, setShowTemplateHelp] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null })

  // Fetch alert history
  const { data: historyData, mutate: refreshHistory } = useSWR(
    authToken ? "/api/admin/telegram/history" : null,
    historyFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )
  const alertHistory: AlertHistoryEntry[] = historyData?.history ?? []

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
      setTestResult({ success: res.ok, message: data.message || data.error || "Desconhecido" })
      refreshHistory()
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
      setCheckResult({ success: res.ok, message: data.message || data.error || "Desconhecido", alerts: data.alerts })
      refreshHistory()
    } catch {
      setCheckResult({ success: false, message: "Erro de rede" })
    } finally {
      setChecking(false)
    }
  }

  const handleWebhook = async (action: "setup" | "info" | "remove") => {
    setWebhookStatus({ loading: true, result: null })
    try {
      const res = await fetch(`/api/telegram/webhook?action=${action}`)
      const data = await res.json()
      if (action === "info") {
        const info = data.result
        setWebhookStatus({
          loading: false,
          result: info?.url ? `Webhook ativo: ${info.url}\nPending: ${info.pending_update_count || 0}` : "Webhook nao configurado",
        })
      } else {
        setWebhookStatus({ loading: false, result: data.message || JSON.stringify(data) })
      }
    } catch (e) {
      setWebhookStatus({ loading: false, result: `Erro: ${e instanceof Error ? e.message : "Unknown"}` })
    }
  }

  const isConfigured = botToken.length > 10 && chatId.length > 0

  const getTypeColor = (type: string) => {
    switch (type) {
      case "opportunity": return "text-primary"
      case "price": return "text-accent-foreground"
      case "test": return "text-muted-foreground"
      case "command": return "text-foreground"
      case "error": return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "opportunity": return "bg-primary/15 text-primary border-primary/30"
      case "price": return "bg-accent/15 text-accent-foreground border-accent/30"
      case "test": return "bg-secondary text-muted-foreground border-border"
      case "command": return "bg-foreground/10 text-foreground border-foreground/20"
      case "error": return "bg-destructive/15 text-destructive border-destructive/30"
      default: return "bg-secondary text-muted-foreground border-border"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Configuration Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">{t("admin.telegram")} Bot</CardTitle>
              <CardDescription>Token do bot, Chat ID e configuracoes de alertas automaticos</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "..." : "Guardar"}
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
              <p className="text-xs text-muted-foreground">Obtenha via @BotFather no Telegram</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Chat ID</Label>
              <Input
                value={chatId}
                onChange={(e) => { setChatId(e.target.value); setHasChanges(true) }}
                className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono"
                placeholder="-100XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">ID do chat/grupo para alertas</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-card-foreground">Bot Ativo</span>
              <span className="text-xs text-muted-foreground">Enviar alertas automaticos quando oportunidades forem detetadas</span>
            </div>
            <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); setHasChanges(true) }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Intervalo de Verificacao (minutos)</Label>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number" min={1} max={60} value={interval}
                onChange={(e) => { setInterval(parseInt(e.target.value) || 5); setHasChanges(true) }}
                className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono w-24"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          {/* Price Alert */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Alerta de Preco Periodico</h4>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3 mb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-card-foreground">Alerta de Preco Ativo</span>
                <span className="text-xs text-muted-foreground">Envia preco, variacao 24h e volume do recurso selecionado</span>
              </div>
              <Switch checked={priceAlertEnabled} onCheckedChange={(v) => { setPriceAlertEnabled(v); setHasChanges(true) }} />
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
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Intervalo (minutos)</Label>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number" min={1} max={60} value={priceAlertInterval}
                    onChange={(e) => { setPriceAlertInterval(parseInt(e.target.value) || 5); setHasChanges(true) }}
                    className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono w-24"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Mensagem Personalizada</h4>
            <Textarea
              value={customAlertMessage}
              onChange={(e) => { setCustomAlertMessage(e.target.value); setHasChanges(true) }}
              rows={2}
              className="bg-secondary border-border text-card-foreground text-sm resize-none"
              placeholder="Ex: Craft World Economy - Alertas automaticos..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Bot Commands Reference */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm text-card-foreground">Comandos do Bot</CardTitle>
              <CardDescription className="text-xs">
                Comandos disponiveis quando o webhook esta ativo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5">
            {BOT_COMMANDS.map((c) => (
              <div key={c.cmd} className="flex items-center gap-3 rounded-md bg-secondary/40 px-3 py-2">
                <code className="text-xs font-mono text-primary font-semibold min-w-[120px]">{c.cmd}</code>
                <span className="text-xs text-muted-foreground">{c.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Setup */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm text-card-foreground">Webhook Telegram</CardTitle>
              <CardDescription className="text-xs">
                Configure o webhook para que o bot responda a comandos directamente no Telegram
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleWebhook("setup")} disabled={webhookStatus.loading || !isConfigured} className="gap-1.5">
              <Wifi className="h-3.5 w-3.5" />
              Ativar Webhook
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleWebhook("info")} disabled={webhookStatus.loading || !isConfigured} className="gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Ver Estado
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleWebhook("remove")} disabled={webhookStatus.loading || !isConfigured} className="gap-1.5 text-destructive hover:text-destructive">
              <WifiOff className="h-3.5 w-3.5" />
              Remover Webhook
            </Button>
          </div>
          {webhookStatus.result && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs font-mono whitespace-pre-wrap text-card-foreground">
              {webhookStatus.result}
            </div>
          )}
          {!isConfigured && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Configure o Token e Chat ID antes de configurar o webhook
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test & Check */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Testar Conexao</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !isConfigured} className="gap-1.5">
              <Send className={`h-3.5 w-3.5 ${testing ? "animate-pulse" : ""}`} />
              Enviar Teste
            </Button>
            <Button variant="outline" size="sm" onClick={handleCheck} disabled={checking || !isConfigured} className="gap-1.5">
              <Play className={`h-3.5 w-3.5 ${checking ? "animate-pulse" : ""}`} />
              Simular Monitor
            </Button>
          </div>
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
                    <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
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
                <CardDescription className="text-xs">Personalize o formato das mensagens</CardDescription>
              </div>
            </div>
            <button type="button" onClick={() => setShowTemplateHelp(!showTemplateHelp)} className="text-muted-foreground hover:text-foreground transition-colors">
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
              />
              <Button variant="ghost" size="sm" onClick={() => { setMessageTemplate(DEFAULT_TEMPLATE); setHasChanges(true) }} className="self-start text-xs text-muted-foreground">
                Repor predefinido
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Pre-visualizacao</Label>
              <div className="rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-wrap font-mono min-h-[180px]">
                <span className="text-card-foreground">
                  {messageTemplate
                    .replace("{SIGNAL_ICON}", "BUY")
                    .replace("{SIGNAL_TYPE}", "COMPRA")
                    .replace("{SYMBOL}", "STEEL")
                    .replace("{PRICE}", "0.0234")
                    .replace("{COST}", "0.0312")
                    .replace("{DEVIATION}", "-25.0")
                    .replace("{TIMESTAMP}", new Date().toLocaleString("pt-BR"))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm text-card-foreground">Historico de Alertas</CardTitle>
                <CardDescription className="text-xs">Ultimas {alertHistory.length} entradas</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refreshHistory()} className="gap-1.5 text-xs">
              <RefreshCw className="h-3 w-3" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alertHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Sem historico de alertas</p>
              <p className="text-xs mt-1">As alertas enviadas aparecerao aqui</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
              {alertHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 hover:bg-secondary/40 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {entry.success ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeBadge(entry.type)}`}>
                        {entry.type.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(entry.timestamp).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}
                      </span>
                    </div>
                    <p className={`text-xs ${getTypeColor(entry.type)} truncate`}>{entry.message}</p>
                    {entry.details && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{entry.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

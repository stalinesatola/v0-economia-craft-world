"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Send, Twitter, MessageCircle, Plus, X, Info } from "lucide-react"
import type { AppConfig } from "@/lib/config-manager"

interface SharingTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function SharingTab({ config, onUpdate, saving }: SharingTabProps) {
  const sharing = config.sharing ?? {
    twitter: {
      enabled: false, apiKey: "", apiSecret: "", accessToken: "", accessSecret: "",
      minDeviation: 30, hashtags: "CraftWorld,Ronin,GameFi", template: "",
    },
    telegramChannels: {
      enabled: false, chatIds: [], minDeviation: 25, template: "",
    },
  }

  const [twitterEnabled, setTwitterEnabled] = useState(sharing.twitter?.enabled ?? false)
  const [twitterApiKey, setTwitterApiKey] = useState(sharing.twitter?.apiKey ?? "")
  const [twitterApiSecret, setTwitterApiSecret] = useState(sharing.twitter?.apiSecret ?? "")
  const [twitterAccessToken, setTwitterAccessToken] = useState(sharing.twitter?.accessToken ?? "")
  const [twitterAccessSecret, setTwitterAccessSecret] = useState(sharing.twitter?.accessSecret ?? "")
  const [twitterMinDev, setTwitterMinDev] = useState(sharing.twitter?.minDeviation ?? 30)
  const [twitterHashtags, setTwitterHashtags] = useState(sharing.twitter?.hashtags ?? "CraftWorld,Ronin,GameFi")
  const [twitterTemplate, setTwitterTemplate] = useState(
    sharing.twitter?.template ?? "SIGNAL_TYPE SIGNAL_SYMBOL | Desvio: DEVIATION% | Preco: PRICE | #CraftWorld"
  )

  const [tgEnabled, setTgEnabled] = useState(sharing.telegramChannels?.enabled ?? false)
  const [tgChatIds, setTgChatIds] = useState<string[]>(sharing.telegramChannels?.chatIds ?? [])
  const [tgMinDev, setTgMinDev] = useState(sharing.telegramChannels?.minDeviation ?? 25)
  const [tgTemplate, setTgTemplate] = useState(
    sharing.telegramChannels?.template ?? "SIGNAL_ICON SIGNAL_TYPE SIGNAL_SYMBOL\nPreco: PRICE | Custo: COST\nDesvio: DEVIATION%"
  )
  const [newChatId, setNewChatId] = useState("")

  const [hasChanges, setHasChanges] = useState(false)
  const [testResult, setTestResult] = useState("")
  const [testing, setTesting] = useState(false)

  const addChatId = () => {
    if (newChatId.trim() && !tgChatIds.includes(newChatId.trim())) {
      setTgChatIds([...tgChatIds, newChatId.trim()])
      setNewChatId("")
      setHasChanges(true)
    }
  }

  const removeChatId = (id: string) => {
    setTgChatIds(tgChatIds.filter((c) => c !== id))
    setHasChanges(true)
  }

  const handleSave = async () => {
    const data = {
      twitter: {
        enabled: twitterEnabled,
        apiKey: twitterApiKey,
        apiSecret: twitterApiSecret,
        accessToken: twitterAccessToken,
        accessSecret: twitterAccessSecret,
        minDeviation: twitterMinDev,
        hashtags: twitterHashtags,
        template: twitterTemplate,
      },
      telegramChannels: {
        enabled: tgEnabled,
        chatIds: tgChatIds,
        minDeviation: tgMinDev,
        template: tgTemplate,
      },
    }
    const success = await onUpdate("sharing", data)
    if (success) setHasChanges(false)
  }

  const handleTestShare = async (platform: "twitter" | "telegram") => {
    setTesting(true)
    setTestResult("")
    try {
      const res = await fetch("/api/admin/share/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })
      const data = await res.json()
      setTestResult(data.message || data.error || "Resposta inesperada")
    } catch {
      setTestResult("Erro de rede")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Partilha Automatica</h2>
          <p className="text-xs text-muted-foreground">
            Configure a partilha automatica de alertas para X.com (Twitter) e canais Telegram.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? "A guardar..." : "Guardar Tudo"}
        </Button>
      </div>

      {testResult && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${testResult.includes("sucesso") ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
          {testResult}
        </div>
      )}

      {/* Twitter / X.com */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Twitter className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm text-card-foreground">X.com (Twitter)</CardTitle>
                <CardDescription className="text-xs">
                  Publicar alertas automaticamente no X.com via API v2
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={twitterEnabled ? "border-primary text-primary" : "border-muted text-muted-foreground"}
              >
                {twitterEnabled ? "Ativo" : "Inativo"}
              </Badge>
              <Switch
                checked={twitterEnabled}
                onCheckedChange={(v) => { setTwitterEnabled(v); setHasChanges(true) }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-3 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Para usar a API do X.com, crie uma app em{" "}
              <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                developer.twitter.com
              </a>{" "}
              com permissoes de escrita (Read and Write). Copie as chaves API e os tokens de acesso.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <Input
                type="password"
                value={twitterApiKey}
                onChange={(e) => { setTwitterApiKey(e.target.value); setHasChanges(true) }}
                placeholder="API Key"
                className="h-8 text-xs bg-secondary font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">API Secret</Label>
              <Input
                type="password"
                value={twitterApiSecret}
                onChange={(e) => { setTwitterApiSecret(e.target.value); setHasChanges(true) }}
                placeholder="API Secret"
                className="h-8 text-xs bg-secondary font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Access Token</Label>
              <Input
                type="password"
                value={twitterAccessToken}
                onChange={(e) => { setTwitterAccessToken(e.target.value); setHasChanges(true) }}
                placeholder="Access Token"
                className="h-8 text-xs bg-secondary font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Access Secret</Label>
              <Input
                type="password"
                value={twitterAccessSecret}
                onChange={(e) => { setTwitterAccessSecret(e.target.value); setHasChanges(true) }}
                placeholder="Access Secret"
                className="h-8 text-xs bg-secondary font-mono"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Desvio minimo para partilhar (%)</Label>
              <Input
                type="number"
                value={twitterMinDev}
                onChange={(e) => { setTwitterMinDev(parseInt(e.target.value) || 30); setHasChanges(true) }}
                className="h-8 text-xs bg-secondary font-mono w-24"
                min={5}
                max={100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Hashtags (separadas por virgula)</Label>
              <Input
                value={twitterHashtags}
                onChange={(e) => { setTwitterHashtags(e.target.value); setHasChanges(true) }}
                placeholder="CraftWorld,Ronin,GameFi"
                className="h-8 text-xs bg-secondary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Template do Tweet (variaveis: SIGNAL_TYPE, SIGNAL_SYMBOL, DEVIATION, PRICE, COST)
            </Label>
            <Textarea
              value={twitterTemplate}
              onChange={(e) => { setTwitterTemplate(e.target.value); setHasChanges(true) }}
              className="min-h-16 text-xs bg-secondary font-mono"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestShare("twitter")}
            disabled={testing || !twitterEnabled}
            className="gap-1.5 w-fit"
          >
            <Send className="h-3.5 w-3.5" />
            {testing ? "A testar..." : "Testar Publicacao"}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Channels */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm text-card-foreground">Canais Telegram</CardTitle>
                <CardDescription className="text-xs">
                  Partilhar alertas em canais/grupos Telegram adicionais (alem do bot principal)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={tgEnabled ? "border-primary text-primary" : "border-muted text-muted-foreground"}
              >
                {tgEnabled ? "Ativo" : "Inativo"}
              </Badge>
              <Switch
                checked={tgEnabled}
                onCheckedChange={(v) => { setTgEnabled(v); setHasChanges(true) }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-3 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Adicione os Chat IDs dos canais/grupos onde o bot devera publicar alertas.
              O bot configurado no tab &quot;Bot Telegram&quot; sera usado para enviar.
              Para canais publicos, use o formato @nomedocanal.
            </p>
          </div>

          {/* Chat IDs list */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Chat IDs dos Canais</Label>
            <div className="flex flex-wrap gap-2">
              {tgChatIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 pr-1 font-mono text-xs">
                  {id}
                  <button onClick={() => removeChatId(id)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addChatId()}
                placeholder="@canal ou -1001234567890"
                className="h-8 text-xs bg-secondary font-mono max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={addChatId} className="h-8 gap-1">
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Desvio minimo para partilhar (%)</Label>
            <Input
              type="number"
              value={tgMinDev}
              onChange={(e) => { setTgMinDev(parseInt(e.target.value) || 25); setHasChanges(true) }}
              className="h-8 text-xs bg-secondary font-mono w-24"
              min={5}
              max={100}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Template (variaveis: SIGNAL_ICON, SIGNAL_TYPE, SIGNAL_SYMBOL, DEVIATION, PRICE, COST)
            </Label>
            <Textarea
              value={tgTemplate}
              onChange={(e) => { setTgTemplate(e.target.value); setHasChanges(true) }}
              className="min-h-20 text-xs bg-secondary font-mono"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestShare("telegram")}
            disabled={testing || !tgEnabled || tgChatIds.length === 0}
            className="gap-1.5 w-fit"
          >
            <Send className="h-3.5 w-3.5" />
            {testing ? "A testar..." : "Testar Envio"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

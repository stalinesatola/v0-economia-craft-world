"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, UserPlus, Trash2, Key, Shield, Eye, Palette, Wrench } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { AppConfig } from "@/lib/config-manager"

interface SettingsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

interface UserDisplay {
  username: string
  role: string
  createdAt: string
  permissions?: Record<string, boolean>
}

const PERMISSION_KEYS = [
  { key: "pools", label: "Pools" },
  { key: "chains", label: "Cadeias" },
  { key: "telegram", label: "Telegram" },
  { key: "sharing", label: "Partilha" },
  { key: "banners", label: "Banners" },
  { key: "settings", label: "Config" },
  { key: "users", label: "Utilizadores" },
]

export function SettingsTab({ config, onUpdate, saving }: SettingsTabProps) {
  const { t } = useI18n()
  const [buyThreshold, setBuyThreshold] = useState(config.thresholds?.buy ?? 15)
  const [sellThreshold, setSellThreshold] = useState(config.thresholds?.sell ?? 15)
  const [network, setNetwork] = useState(config.network ?? "ronin")
  const [hasChanges, setHasChanges] = useState(false)

  // Customization
  const cust = config.customization ?? {
    headerLogo: "", headerText: "", footerCredits: "", footerLinks: "",
    footerDisclaimer: "", loginTitle: "", loginCredits: "",
    footerSocialLinks: { github: "", telegram: "", twitter: "" },
    footerBannerAd: { enabled: false, imageUrl: "", linkUrl: "", altText: "" },
  }
  const [headerLogo, setHeaderLogo] = useState(cust.headerLogo)
  const [headerText, setHeaderText] = useState(cust.headerText)
  const [footerCredits, setFooterCredits] = useState(cust.footerCredits)
  const [footerLinks, setFooterLinks] = useState(cust.footerLinks)
  const [footerDisclaimer, setFooterDisclaimer] = useState(cust.footerDisclaimer)
  const [loginTitle, setLoginTitle] = useState(cust.loginTitle)
  const [loginCredits, setLoginCredits] = useState(cust.loginCredits)
  const [footerGithubUrl, setFooterGithubUrl] = useState(cust.footerSocialLinks?.github ?? "")
  const [footerTelegramUrl, setFooterTelegramUrl] = useState(cust.footerSocialLinks?.telegram ?? "")
  const [footerTwitterUrl, setFooterTwitterUrl] = useState(cust.footerSocialLinks?.twitter ?? "")
  const [bannerAdEnabled, setBannerAdEnabled] = useState(cust.footerBannerAd?.enabled ?? false)
  const [bannerAdImageUrl, setBannerAdImageUrl] = useState(cust.footerBannerAd?.imageUrl ?? "")
  const [bannerAdLinkUrl, setBannerAdLinkUrl] = useState(cust.footerBannerAd?.linkUrl ?? "")
  const [bannerAdAltText, setBannerAdAltText] = useState(cust.footerBannerAd?.altText ?? "Advertisement")
  const [primaryColor, setPrimaryColor] = useState(cust.primaryColor ?? "#6366f1")
  const [accentColor, setAccentColor] = useState(cust.accentColor ?? "#10b981")
  const [backgroundColor, setBackgroundColor] = useState(cust.backgroundColor ?? "#0a0a14")
  const [modules, setModules] = useState(cust.modules ?? { showOpportunities: true, showStats: true, showBanners: true, showChain: true })
  const [template, setTemplate] = useState<"default" | "compact" | "cards">(cust.template ?? "default")
  const [hasCustomChanges, setHasCustomChanges] = useState(false)

  useEffect(() => {
    setBuyThreshold(config.thresholds?.buy ?? 0)
    setSellThreshold(config.thresholds?.sell ?? 0)
    setNetwork(config.network ?? "ronin")
    setHasChanges(false)
  }, [config.thresholds, config.network])

  useEffect(() => {
    const c = config.customization ?? {
      headerLogo: "", headerText: "", footerCredits: "", footerLinks: "",
      footerDisclaimer: "", loginTitle: "", loginCredits: "",
      footerSocialLinks: { github: "", telegram: "", twitter: "" },
      footerBannerAd: { enabled: false, imageUrl: "", linkUrl: "", altText: "" },
    }
    setHeaderLogo(c.headerLogo)
    setHeaderText(c.headerText)
    setFooterCredits(c.footerCredits)
    setFooterLinks(c.footerLinks)
    setFooterDisclaimer(c.footerDisclaimer)
    setLoginTitle(c.loginTitle)
    setLoginCredits(c.loginCredits)
    setFooterGithubUrl(c.footerSocialLinks?.github ?? "")
    setFooterTelegramUrl(c.footerSocialLinks?.telegram ?? "")
    setFooterTwitterUrl(c.footerSocialLinks?.twitter ?? "")
    setBannerAdEnabled(c.footerBannerAd?.enabled ?? false)
    setBannerAdImageUrl(c.footerBannerAd?.imageUrl ?? "")
    setBannerAdLinkUrl(c.footerBannerAd?.linkUrl ?? "")
    setBannerAdAltText(c.footerBannerAd?.altText ?? "Advertisement")
    setPrimaryColor(c.primaryColor ?? "#6366f1")
    setAccentColor(c.accentColor ?? "#10b981")
    setBackgroundColor(c.backgroundColor ?? "#0a0a14")
    setModules(c.modules ?? { showOpportunities: true, showStats: true, showBanners: true, showChain: true })
    setTemplate(c.template ?? "default")
    setHasCustomChanges(false)
  }, [config.customization])

  // User management
  const [users, setUsers] = useState<UserDisplay[]>(
    (config.users ?? []).map((u) => ({
      username: typeof u === "object" && "username" in u ? (u as UserDisplay).username : "",
      role: typeof u === "object" && "role" in u ? (u as UserDisplay).role : "viewer",
      createdAt: typeof u === "object" && "createdAt" in u ? (u as UserDisplay).createdAt : "",
      permissions: typeof u === "object" && "permissions" in u ? (u as UserDisplay).permissions : undefined,
    }))
  )
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer")
  const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>({
    pools: false, chains: false, telegram: false, sharing: false, banners: false, settings: false, users: false,
  })
  const [userMessage, setUserMessage] = useState("")
  const [userLoading, setUserLoading] = useState(false)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ isOpen: boolean; username: string }>({ isOpen: false, username: "" })

  // Maintenance mode
  const maint = config.maintenance ?? { enabled: false, message: "" }
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(maint.enabled)
  const [maintenanceMessage, setMaintenanceMessage] = useState(maint.message)
  const [hasMaintenanceChanges, setHasMaintenanceChanges] = useState(false)

  useEffect(() => {
    const m = config.maintenance ?? { enabled: false, message: "" }
    setMaintenanceEnabled(m.enabled)
    setMaintenanceMessage(m.message)
    setHasMaintenanceChanges(false)
  }, [config.maintenance])

  useEffect(() => {
    setUsers(
      (config.users ?? []).map((u) => ({
        username: typeof u === "object" && "username" in u ? (u as UserDisplay).username : "",
        role: typeof u === "object" && "role" in u ? (u as UserDisplay).role : "viewer",
        createdAt: typeof u === "object" && "createdAt" in u ? (u as UserDisplay).createdAt : "",
        permissions: typeof u === "object" && "permissions" in u ? (u as UserDisplay).permissions : undefined,
      }))
    )
  }, [config.users])

  // Password change
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [pwdMessage, setPwdMessage] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleSave = async () => {
    const r1 = await onUpdate("thresholds", { buy: buyThreshold, sell: sellThreshold })
    const r2 = await onUpdate("network", network)
    if (r1 && r2) setHasChanges(false)
  }

  const handleSaveCustomization = async () => {
    const success = await onUpdate("customization", {
      headerLogo, headerText, footerCredits, footerLinks, footerDisclaimer, loginTitle, loginCredits,
      primaryColor, accentColor, backgroundColor, modules, template,
      footerSocialLinks: { github: footerGithubUrl, telegram: footerTelegramUrl, twitter: footerTwitterUrl },
      footerBannerAd: { enabled: bannerAdEnabled, imageUrl: bannerAdImageUrl, linkUrl: bannerAdLinkUrl, altText: bannerAdAltText },
    })
    if (success) setHasCustomChanges(false)
  }

  const handleSaveMaintenance = async () => {
    const success = await onUpdate("maintenance", {
      enabled: maintenanceEnabled,
      message: maintenanceMessage,
    })
    if (success) setHasMaintenanceChanges(false)
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setUserMessage("Username e password obrigatorios")
      return
    }
    setUserLoading(true)
    setUserMessage("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          permissions: newRole === "viewer" ? newPermissions : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewUsername("")
        setNewPassword("")
        setNewPermissions({
          pools: false, chains: false, telegram: false, sharing: false, banners: false, settings: false, users: false,
        })
        setUserMessage(`Utilizador '${newUsername}' criado com sucesso`)
        const usersRes = await fetch("/api/admin/users")
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users ?? [])
        }
      } else {
        setUserMessage(data.error || "Erro ao criar utilizador")
      }
    } catch {
      setUserMessage("Erro de rede")
    } finally {
      setUserLoading(false)
    }
  }

  const handleDeleteUser = async (username: string) => {
    setConfirmDeleteUser({ isOpen: true, username })
  }

  const handleDeleteUserConfirm = async (username: string) => {
    setUserLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users ?? [])
        setUserMessage(`Utilizador '${username}' removido`)
      } else {
        setUserMessage(data.error || "Erro ao remover")
      }
    } catch {
      setUserMessage("Erro de rede")
    } finally {
      setUserLoading(false)
      setConfirmDeleteUser({ isOpen: false, username: "" })
    }
  }

  const handleChangePassword = async () => {
    if (!newPwd || newPwd.length < 4) {
      setPwdMessage("Nova password deve ter pelo menos 4 caracteres")
      return
    }
    setPwdLoading(true)
    setPwdMessage("")
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (res.ok) {
        setCurrentPwd("")
        setNewPwd("")
        setPwdMessage(data.message || "Password alterada com sucesso")
      } else {
        setPwdMessage(data.error || "Erro ao alterar password")
      }
    } catch {
      setPwdMessage("Erro de rede")
    } finally {
      setPwdLoading(false)
    }
  }

  const togglePermission = (key: string) => {
    setNewPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        isOpen={confirmDeleteUser.isOpen}
        title="Remover Utilizador"
        description={`Tem a certeza que deseja remover o utilizador '${confirmDeleteUser.username}'? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        isDangerous={true}
        onConfirm={() => handleDeleteUserConfirm(confirmDeleteUser.username)}
        onCancel={() => setConfirmDeleteUser({ isOpen: false, username: "" })}
      />
      {/* Thresholds */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">Limiares de Sinal</CardTitle>
              <CardDescription>Definir percentagem de desvio para sinais de compra e venda</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "..." : "Guardar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Limiar Compra: <span className="font-mono text-primary">-{buyThreshold}%</span>
              </Label>
              <Slider
                value={[buyThreshold]}
                onValueChange={([v]) => { setBuyThreshold(v); setHasChanges(true) }}
                min={5}
                max={50}
                step={1}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Limiar Venda: <span className="font-mono text-destructive">+{sellThreshold}%</span>
              </Label>
              <Slider
                value={[sellThreshold]}
                onValueChange={([v]) => { setSellThreshold(v); setHasChanges(true) }}
                min={5}
                max={50}
                step={1}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Rede</Label>
            <Select value={network} onValueChange={(v) => { setNetwork(v); setHasChanges(true) }}>
              <SelectTrigger className="bg-secondary border-border text-card-foreground h-9 text-sm w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ronin">Ronin</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customization */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base text-card-foreground">Personalizacao</CardTitle>
                <CardDescription>Personalizar header, footer e pagina de login</CardDescription>
              </div>
            </div>
            <Button onClick={handleSaveCustomization} disabled={saving || !hasCustomChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "..." : "Guardar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Texto do Header</Label>
              <Input
                value={headerText}
                onChange={(e) => { setHeaderText(e.target.value); setHasCustomChanges(true) }}
                placeholder="Craft World Economy"
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Logo URL</Label>
              <Input
                value={headerLogo}
                onChange={(e) => { setHeaderLogo(e.target.value); setHasCustomChanges(true) }}
                placeholder="https://..."
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Creditos do Footer</Label>
              <Input
                value={footerCredits}
                onChange={(e) => { setFooterCredits(e.target.value); setHasCustomChanges(true) }}
                placeholder="Digite os créditos do footer"
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Links do Footer</Label>
              <Input
                value={footerLinks}
                onChange={(e) => { setFooterLinks(e.target.value); setHasCustomChanges(true) }}
                placeholder="Telegram: @bondsbtc | ..."
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Disclaimer</Label>
              <Input
                value={footerDisclaimer}
                onChange={(e) => { setFooterDisclaimer(e.target.value); setHasCustomChanges(true) }}
                placeholder="Verifique sempre no jogo..."
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Titulo do Login</Label>
              <Input
                value={loginTitle}
                onChange={(e) => { setLoginTitle(e.target.value); setHasCustomChanges(true) }}
                placeholder="Seja Bem-vindo"
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Creditos do Login</Label>
            <Input
              value={loginCredits}
              onChange={(e) => { setLoginCredits(e.target.value); setHasCustomChanges(true) }}
              placeholder="Texto adicional exibido abaixo do login"
              className="bg-secondary border-border text-card-foreground h-9 text-sm"
            />
          </div>

          {/* Social Links - Footer */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Links Sociais do Footer</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">GitHub URL</Label>
                <Input
                  value={footerGithubUrl}
                  onChange={(e) => { setFooterGithubUrl(e.target.value); setHasCustomChanges(true) }}
                  placeholder="https://github.com/..."
                  className="bg-secondary border-border text-card-foreground h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Telegram URL</Label>
                <Input
                  value={footerTelegramUrl}
                  onChange={(e) => { setFooterTelegramUrl(e.target.value); setHasCustomChanges(true) }}
                  placeholder="https://t.me/..."
                  className="bg-secondary border-border text-card-foreground h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">X (Twitter) URL</Label>
                <Input
                  value={footerTwitterUrl}
                  onChange={(e) => { setFooterTwitterUrl(e.target.value); setHasCustomChanges(true) }}
                  placeholder="https://x.com/..."
                  className="bg-secondary border-border text-card-foreground h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Banner Ad - Footer */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Banner Publicitario do Footer</h4>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2 mb-3">
              <span className="text-xs text-card-foreground">Ativar Banner</span>
              <Switch
                checked={bannerAdEnabled}
                onCheckedChange={(v) => { setBannerAdEnabled(v); setHasCustomChanges(true) }}
              />
            </div>
            {bannerAdEnabled && (
              <div className="grid gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">URL da Imagem</Label>
                  <Input
                    value={bannerAdImageUrl}
                    onChange={(e) => { setBannerAdImageUrl(e.target.value); setHasCustomChanges(true) }}
                    placeholder="https://..."
                    className="bg-secondary border-border text-card-foreground h-9 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">URL de Link (clique)</Label>
                  <Input
                    value={bannerAdLinkUrl}
                    onChange={(e) => { setBannerAdLinkUrl(e.target.value); setHasCustomChanges(true) }}
                    placeholder="https://..."
                    className="bg-secondary border-border text-card-foreground h-9 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Texto Alternativo</Label>
                  <Input
                    value={bannerAdAltText}
                    onChange={(e) => { setBannerAdAltText(e.target.value); setHasCustomChanges(true) }}
                    placeholder="Advertisement"
                    className="bg-secondary border-border text-card-foreground h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cores */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Cores do Tema</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Cor Primaria</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); setHasCustomChanges(true) }} className="h-9 w-12 rounded border border-border cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); setHasCustomChanges(true) }} className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono flex-1" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Cor Accent</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={accentColor} onChange={(e) => { setAccentColor(e.target.value); setHasCustomChanges(true) }} className="h-9 w-12 rounded border border-border cursor-pointer" />
                  <Input value={accentColor} onChange={(e) => { setAccentColor(e.target.value); setHasCustomChanges(true) }} className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono flex-1" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Cor de Fundo</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={backgroundColor} onChange={(e) => { setBackgroundColor(e.target.value); setHasCustomChanges(true) }} className="h-9 w-12 rounded border border-border cursor-pointer" />
                  <Input value={backgroundColor} onChange={(e) => { setBackgroundColor(e.target.value); setHasCustomChanges(true) }} className="bg-secondary border-border text-card-foreground h-9 text-sm font-mono flex-1" />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="mt-3 rounded-lg border border-border p-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <div className="flex items-center gap-2">
                <div className="h-6 w-12 rounded" style={{ backgroundColor: primaryColor }} title="Primaria" />
                <div className="h-6 w-12 rounded" style={{ backgroundColor: accentColor }} title="Accent" />
                <div className="h-6 w-12 rounded border border-border" style={{ backgroundColor: backgroundColor }} title="Fundo" />
              </div>
            </div>
          </div>

          {/* Modulos */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Modulos Visiveis</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "showOpportunities" as const, label: "Oportunidades de Trading" },
                { key: "showStats" as const, label: "Cards de Estatisticas" },
                { key: "showBanners" as const, label: "Banners Publicitarios" },
                { key: "showChain" as const, label: "Link Cadeia de Producao" },
              ].map((mod) => (
                <div key={mod.key} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2">
                  <span className="text-xs text-card-foreground">{mod.label}</span>
                  <Switch
                    checked={modules[mod.key]}
                    onCheckedChange={(v) => { setModules({ ...modules, [mod.key]: v }); setHasCustomChanges(true) }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Template da Tabela</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "default" as const, label: "Default", desc: "Tabela completa com todas as colunas" },
                { value: "compact" as const, label: "Compacto", desc: "Tabela reduzida, ideal para mobile" },
                { value: "cards" as const, label: "Cards", desc: "Layout em grelha de cartoes" },
              ].map((tmpl) => (
                <button
                  key={tmpl.value}
                  onClick={() => { setTemplate(tmpl.value); setHasCustomChanges(true) }}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                    template === tmpl.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm font-medium text-card-foreground">{tmpl.label}</span>
                  <span className="text-[10px] text-muted-foreground">{tmpl.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base text-card-foreground">Utilizadores</CardTitle>
              <CardDescription>Gerir utilizadores e permissoes de acesso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* User list */}
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <div key={user.username} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-card-foreground">{user.username}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={user.role === "admin" ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"}
                      >
                        {user.role === "admin" ? (
                          <><Shield className="mr-1 h-3 w-3" />Admin</>
                        ) : (
                          <><Eye className="mr-1 h-3 w-3" />Viewer</>
                        )}
                      </Badge>
                      {user.permissions && (
                        <div className="flex gap-1">
                          {Object.entries(user.permissions)
                            .filter(([, v]) => v)
                            .map(([k]) => (
                              <Badge key={k} variant="outline" className="text-[10px] border-primary/30 text-primary/70 px-1">
                                {k}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.username)}
                  disabled={userLoading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhum utilizador registado</p>
            )}
          </div>

          {/* Create user form */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Utilizador
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Username</Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="utilizador"
                  className="bg-background border-border text-card-foreground h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="senha"
                  className="bg-background border-border text-card-foreground h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Funcao</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "viewer")}>
                  <SelectTrigger className="bg-background border-border text-card-foreground h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Granular permissions for viewer role */}
            {newRole === "viewer" && (
              <div className="mt-3 rounded-lg border border-border bg-background/50 p-3">
                <p className="mb-2 text-xs font-semibold text-card-foreground">Permissoes granulares:</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PERMISSION_KEYS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-xs text-card-foreground cursor-pointer">
                      <Checkbox
                        checked={newPermissions[p.key] ?? false}
                        onCheckedChange={() => togglePermission(p.key)}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <Button onClick={handleCreateUser} disabled={userLoading || !newUsername || !newPassword} size="sm" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                {userLoading ? "..." : "Criar"}
              </Button>
              {userMessage && (
                <span className={`text-xs ${userMessage.includes("sucesso") ? "text-primary" : "text-destructive"}`}>
                  {userMessage}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base text-card-foreground">{t("admin.maintenance")}</CardTitle>
                <CardDescription>{t("admin.maintenanceDesc")}</CardDescription>
              </div>
            </div>
            <Button onClick={handleSaveMaintenance} disabled={saving || !hasMaintenanceChanges} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "..." : t("admin.save")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-card-foreground">{t("admin.maintenanceEnabled")}</span>
              <span className="text-xs text-muted-foreground">
                {maintenanceEnabled ? "A plataforma esta em modo de manutencao" : "A plataforma esta online"}
              </span>
            </div>
            <Switch
              checked={maintenanceEnabled}
              onCheckedChange={(v) => { setMaintenanceEnabled(v); setHasMaintenanceChanges(true) }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("admin.maintenanceMessage")}</Label>
            <Input
              value={maintenanceMessage}
              onChange={(e) => { setMaintenanceMessage(e.target.value); setHasMaintenanceChanges(true) }}
              placeholder="A plataforma esta em manutencao..."
              className="bg-secondary border-border text-card-foreground h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base text-card-foreground">{t("admin.changePassword")}</CardTitle>
              <CardDescription>Alterar a password da sua conta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Password Actual</Label>
              <Input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Nova Password</Label>
              <Input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="bg-secondary border-border text-card-foreground h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleChangePassword} disabled={pwdLoading || !newPwd} size="sm" className="gap-1.5">
              <Key className="h-3.5 w-3.5" />
              {pwdLoading ? "..." : "Alterar"}
            </Button>
            {pwdMessage && (
              <span className={`text-xs ${pwdMessage.includes("sucesso") ? "text-primary" : "text-destructive"}`}>
                {pwdMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
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
import { Save, UserPlus, Trash2, Key, Shield, Eye, Palette } from "lucide-react"
import { useI18n } from "@/lib/i18n"
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
  const [buyThreshold, setBuyThreshold] = useState(config.thresholds.buy)
  const [sellThreshold, setSellThreshold] = useState(config.thresholds.sell)
  const [network, setNetwork] = useState(config.network)
  const [hasChanges, setHasChanges] = useState(false)

  // Customization
  const cust = config.customization ?? {
    headerLogo: "", headerText: "", footerCredits: "", footerLinks: "",
    footerDisclaimer: "", loginTitle: "", loginCredits: "",
  }
  const [headerLogo, setHeaderLogo] = useState(cust.headerLogo)
  const [headerText, setHeaderText] = useState(cust.headerText)
  const [footerCredits, setFooterCredits] = useState(cust.footerCredits)
  const [footerLinks, setFooterLinks] = useState(cust.footerLinks)
  const [footerDisclaimer, setFooterDisclaimer] = useState(cust.footerDisclaimer)
  const [loginTitle, setLoginTitle] = useState(cust.loginTitle)
  const [loginCredits, setLoginCredits] = useState(cust.loginCredits)
  const [hasCustomChanges, setHasCustomChanges] = useState(false)

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
    })
    if (success) setHasCustomChanges(false)
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
    if (!confirm(`Remover utilizador '${username}'?`)) return
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
                placeholder="Craft World Economy v1.0.0"
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

      {/* Password change */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base text-card-foreground">Alterar Password</CardTitle>
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

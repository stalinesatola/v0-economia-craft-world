"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Save, Info, UserPlus, Trash2, Key, Shield, Eye } from "lucide-react"
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
}

export function SettingsTab({ config, onUpdate, saving }: SettingsTabProps) {
  const [buyThreshold, setBuyThreshold] = useState(config.thresholds.buy)
  const [sellThreshold, setSellThreshold] = useState(config.thresholds.sell)
  const [network, setNetwork] = useState(config.network)
  const [hasChanges, setHasChanges] = useState(false)

  // User management
  const [users, setUsers] = useState<UserDisplay[]>(
    (config.users ?? []).map((u) => ({
      username: typeof u === "object" && "username" in u ? (u as UserDisplay).username : "",
      role: typeof u === "object" && "role" in u ? (u as UserDisplay).role : "viewer",
      createdAt: typeof u === "object" && "createdAt" in u ? (u as UserDisplay).createdAt : "",
    }))
  )
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer")
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
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users ?? [])
        setNewUsername("")
        setNewPassword("")
        setUserMessage(`Utilizador '${newUsername}' criado com sucesso`)
        // Refresh users list
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
                onChange={(e) => { setBuyThreshold(parseInt(e.target.value) || 15); setHasChanges(true) }}
                className="w-20 bg-secondary border-border text-card-foreground h-8 text-xs font-mono text-center"
                min={5}
                max={50}
              />
            </div>
          </div>

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
                onChange={(e) => { setSellThreshold(parseInt(e.target.value) || 20); setHasChanges(true) }}
                className="w-20 bg-secondary border-border text-card-foreground h-8 text-xs font-mono text-center"
                min={5}
                max={50}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" /> Gestao de Utilizadores
          </CardTitle>
          <CardDescription>
            Criar, remover utilizadores e gerir permissoes. O superadmin (env var) e sempre acessivel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Current Users */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Utilizadores Ativos</Label>

            {/* Superadmin row */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-card-foreground">admin</span>
                <Badge variant="outline" className="text-xs border-primary text-primary">Superadmin</Badge>
              </div>
              <span className="text-xs text-muted-foreground">via ADMIN_PASSWORD</span>
            </div>

            {/* Config users */}
            {users.map((user) => (
              <div key={user.username} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {user.role === "admin" ? (
                    <Shield className="h-3.5 w-3.5 text-chart-3" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-card-foreground">{user.username}</span>
                  <Badge variant="outline" className="text-xs">
                    {user.role === "admin" ? "Admin" : "Viewer"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.username)}
                  disabled={userLoading}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">Nenhum utilizador adicional configurado.</p>
            )}
          </div>

          {/* Create User Form */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-card-foreground font-medium">Criar Novo Utilizador</Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Username</Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="nome"
                  className="h-8 text-xs bg-secondary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="senha"
                  className="h-8 text-xs bg-secondary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "viewer")}
                  className="h-8 rounded-md border border-border bg-secondary px-2 text-xs text-card-foreground"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateUser} disabled={userLoading} size="sm" className="h-8 w-full gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Criar
                </Button>
              </div>
            </div>
            {userMessage && (
              <p className={`mt-2 text-xs ${userMessage.includes("sucesso") || userMessage.includes("criado") || userMessage.includes("removido") ? "text-primary" : "text-destructive"}`}>
                {userMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground flex items-center gap-2">
            <Key className="h-4 w-4" /> Alterar Password
          </CardTitle>
          <CardDescription>
            Alterar a sua password de acesso. Para o superadmin, altere a variavel ADMIN_PASSWORD no painel Vercel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Password Atual</Label>
              <Input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="atual"
                className="h-8 text-xs bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Nova Password</Label>
              <Input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="nova"
                className="h-8 text-xs bg-secondary"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleChangePassword} disabled={pwdLoading} size="sm" variant="outline" className="h-8 w-full gap-1.5">
                <Key className="h-3.5 w-3.5" />
                {pwdLoading ? "A alterar..." : "Alterar"}
              </Button>
            </div>
          </div>
          {pwdMessage && (
            <p className={`mt-2 text-xs ${pwdMessage.includes("sucesso") ? "text-primary" : "text-destructive"}`}>
              {pwdMessage}
            </p>
          )}
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
                <p><span className="font-medium text-card-foreground">Utilizadores:</span> 1 superadmin + {users.length} configurados</p>
                <p><span className="font-medium text-card-foreground">Cron:</span> Verificacao a cada {config.telegram.intervalMinutes}min via Vercel Cron</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

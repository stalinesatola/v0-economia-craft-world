"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft, User } from "lucide-react"
import Link from "next/link"

interface AdminLoginProps {
  onLogin: (password: string, username?: string) => Promise<boolean>
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUsername, setShowUsername] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const success = await onLogin(password, showUsername ? username : undefined)
    if (!success) {
      setError("Credenciais incorretas")
      setPassword("")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao Dashboard
          </Link>
        </div>
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg text-card-foreground">Admin</CardTitle>
            <CardDescription>Craft World Economy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {showUsername && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username" className="text-card-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username..."
                      autoFocus
                      className="bg-secondary border-border text-card-foreground pl-9"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-card-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduzir password..."
                    autoFocus={!showUsername}
                    className="bg-secondary border-border text-card-foreground pl-9"
                  />
                </div>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
              <Button type="submit" disabled={loading || !password} className="w-full">
                {loading ? "A verificar..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => setShowUsername(!showUsername)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                {showUsername ? "Entrar so com password (superadmin)" : "Entrar com username e password"}
              </button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Superadmin: use a password ADMIN_PASSWORD | Utilizadores: username + password
        </p>
      </div>
    </div>
  )
}

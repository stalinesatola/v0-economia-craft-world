"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AdminLoginProps {
  onLogin: (password: string) => Promise<boolean>
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const success = await onLogin(password)
    if (!success) {
      setError("Password incorreta")
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-card-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduzir password..."
                  autoFocus
                  className="bg-secondary border-border text-card-foreground"
                />
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
              <Button type="submit" disabled={loading || !password} className="w-full">
                {loading ? "A verificar..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Defina ADMIN_PASSWORD nas variaveis de ambiente
        </p>
      </div>
    </div>
  )
}

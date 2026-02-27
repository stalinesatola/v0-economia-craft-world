"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft, User } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"
import Link from "next/link"

interface AdminLoginProps {
  onLogin: (password: string, username?: string) => Promise<boolean>
  customization?: {
    loginTitle?: string
    loginCredits?: string
    headerText?: string
  }
}

export function AdminLogin({ onLogin, customization }: AdminLoginProps) {
  const { t } = useI18n()
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
      setError(t("login.wrongCredentials"))
      setPassword("")
    }
    setLoading(false)
  }

  const title = customization?.loginTitle || t("login.welcome")
  const subtitle = customization?.headerText || t("login.subtitle")
  const credits = customization?.loginCredits || ""

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            {t("login.backToDashboard")}
          </Link>
          <LanguageSwitcher />
        </div>
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg text-card-foreground">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {showUsername && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username" className="text-card-foreground">{t("login.username")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("login.enterUsername")}
                      autoFocus
                      className="bg-secondary border-border text-card-foreground pl-9"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-card-foreground">{t("login.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.enterPassword")}
                    autoFocus={!showUsername}
                    className="bg-secondary border-border text-card-foreground pl-9"
                  />
                </div>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
              <Button type="submit" disabled={loading || !password} className="w-full">
                {loading ? t("login.verifying") : t("login.login")}
              </Button>
              <button
                type="button"
                onClick={() => setShowUsername(!showUsername)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                {showUsername ? t("login.superadminHint") : t("login.userHint")}
              </button>
            </form>
          </CardContent>
        </Card>
        {credits && (
          <p className="mt-4 text-center text-xs text-muted-foreground">{credits}</p>
        )}
      </div>
    </div>
  )
}

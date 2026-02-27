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

              {/* Social Login Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">{t("login.loginWith")}</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    // Telegram login - to be configured
                    window.open("https://telegram.org", "_blank")
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    // X.com login - to be configured
                    window.open("https://x.com", "_blank")
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X.com
                </Button>
              </div>
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

"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import type { AppConfig } from "@/lib/config-manager"

interface UserInfo {
  username: string
  role: string
  permissions?: Record<string, boolean>
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [customization, setCustomization] = useState<AppConfig["customization"]>(undefined)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/check")
      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(true)
        setUserInfo(data.user || null)
      }
    } catch {
      // Not authenticated
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Fetch customization for login screen
  useEffect(() => {
    fetch("/api/customization")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCustomization(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogin = async (password: string, username?: string): Promise<boolean> => {
    try {
      const body: Record<string, string> = { password }
      if (username) body.username = username

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(true)
        if (data.config) setInitialConfig(data.config)
        if (data.user) setUserInfo(data.user)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    setIsAuthenticated(false)
    setInitialConfig(null)
    setUserInfo(null)
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} customization={customization} />
  }

  return <AdminDashboard onLogout={handleLogout} initialConfig={initialConfig} userInfo={userInfo} />
}

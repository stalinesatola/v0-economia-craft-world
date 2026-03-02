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
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [customization, setCustomization] = useState<AppConfig["customization"]>(undefined)

  useEffect(() => {
    setMounted(true)
    // Restore token from sessionStorage
    const saved = sessionStorage.getItem("cw_admin_token")
    if (saved) setAuthToken(saved)
  }, [])

  const checkAuth = useCallback(async () => {
    const savedToken = sessionStorage.getItem("cw_admin_token")
    try {
      const headers: Record<string, string> = {}
      if (savedToken) headers["Authorization"] = `Bearer ${savedToken}`
      const res = await fetch("/api/admin/check", { headers })
      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(true)
        setUserInfo(data.user || null)
        if (savedToken) setAuthToken(savedToken)
      } else {
        sessionStorage.removeItem("cw_admin_token")
      }
    } catch {
      // Not authenticated
    } finally {
      setIsChecking(false)
    }
  }, [])

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
        console.log("[v0] handleLogin: success, data keys:", Object.keys(data))
        console.log("[v0] handleLogin: config keys:", data.config ? Object.keys(data.config) : "no config")
        console.log("[v0] handleLogin: config.pools type:", data.config?.pools ? typeof data.config.pools : "no pools", "keys:", data.config?.pools ? Object.keys(data.config.pools).length : 0)
        setIsAuthenticated(true)
        if (data.config) setInitialConfig(data.config)
        if (data.user) setUserInfo(data.user)
        // Save token for API calls
        if (data.token) {
          setAuthToken(data.token)
          sessionStorage.setItem("cw_admin_token", data.token)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleLogout = async () => {
    const headers: Record<string, string> = {}
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    await fetch("/api/admin/logout", { method: "POST", headers })
    setIsAuthenticated(false)
    setInitialConfig(null)
    setUserInfo(null)
    setAuthToken(null)
    sessionStorage.removeItem("cw_admin_token")
  }

  if (!mounted || isChecking) {
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

  return <AdminDashboard onLogout={handleLogout} initialConfig={initialConfig} userInfo={userInfo} authToken={authToken} />
}

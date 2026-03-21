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

  // Initialize component
  useEffect(() => {
    setMounted(true)
    const savedToken = sessionStorage.getItem("cw_admin_token")
    if (savedToken) {
      setAuthToken(savedToken)
    }
  }, [])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    const savedToken = sessionStorage.getItem("cw_admin_token")
    
    if (!savedToken) {
      setIsChecking(false)
      return
    }

    try {
      const res = await fetch("/api/admin/check", {
        headers: { "Authorization": `Bearer ${savedToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(true)
        setUserInfo(data.user || null)
        setAuthToken(savedToken)
      } else {
        sessionStorage.removeItem("cw_admin_token")
        setAuthToken(null)
      }
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
      sessionStorage.removeItem("cw_admin_token")
      setAuthToken(null)
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Fetch customization
  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await fetch("/api/customization")
        if (res.ok) {
          const data = await res.json()
          if (data) setCustomization(data)
        }
      } catch (error) {
        console.error("[v0] Customization fetch failed:", error)
      }
    }

    fetchCustomization()
  }, [])

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Handle login
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
        
        if (data.token) {
          setAuthToken(data.token)
          sessionStorage.setItem("cw_admin_token", data.token)
        }
        
        return true
      }

      return false
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  }

  // Handle logout
  const handleLogout = async () => {
    const headers: Record<string, string> = {}
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`

    try {
      await fetch("/api/admin/logout", { method: "POST", headers })
    } catch (error) {
      console.error("[v0] Logout error:", error)
    } finally {
      setIsAuthenticated(false)
      setInitialConfig(null)
      setUserInfo(null)
      setAuthToken(null)
      sessionStorage.removeItem("cw_admin_token")
    }
  }

  // Show loading state while checking mount and auth
  if (!mounted || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} customization={customization} />
  }

  // Show dashboard if authenticated
  return (
    <AdminDashboard 
      onLogout={handleLogout} 
      initialConfig={initialConfig} 
      userInfo={userInfo} 
      authToken={authToken} 
    />
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config")
      if (res.ok) {
        setIsAuthenticated(true)
      }
    } catch {
      // Not authenticated
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogin = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setIsAuthenticated(true)
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
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}

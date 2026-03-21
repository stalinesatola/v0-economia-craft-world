import { NextRequest, NextResponse } from "next/server"
import { validateUserLogin, createSession } from "@/lib/auth"
import { getFullConfig, getUsers, getUserByUsername, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_VIEWER_PERMISSIONS } from "@/lib/config-manager"
import { RECIPES } from "@/lib/resource-images"

// Simple in-memory rate limiting (replace with Redis in production)
const loginAttempts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(identifier)

  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (attempt.count >= RATE_LIMIT_ATTEMPTS) {
    return false
  }

  attempt.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, username } = body

    console.log("[v0] Login attempt - username:", username, "password provided:", !!password)

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password obrigatoria" }, { status: 400 })
    }

    // Check rate limiting based on IP and username
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitKey = username ? `${username}:${clientIp}` : `anon:${clientIp}`

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Demasiadas tentativas de login. Tente novamente mais tarde." },
        { status: 429 }
      )
    }

    let authUser = username || "admin"
    let authRole = ""

    console.log("[v0] Validating user:", authUser)
    const result = await validateUserLogin(authUser, password)
    console.log("[v0] Validation result:", result)
    
    if (!result.valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }
    authRole = result.role

    const token = await createSession(authUser, authRole)

    // Try to get config and users, but don't fail if DB is not available
    let config: any = {}
    let users: any[] = []
    
    try {
      config = await getFullConfig()
      users = await getUsers()
      console.log("[v0] Config and users loaded from database")
    } catch (dbError) {
      console.log("[v0] Database not available, using empty config:", dbError instanceof Error ? dbError.message : "Unknown error")
      // Database not available, continue with empty config
      config = {
        pools: {},
        productionCosts: {},
        alertsConfig: {},
        productionChains: [],
        thresholds: { buy: 15, sell: 15 },
        telegram: { botToken: "", chatId: "", enabled: false, intervalMinutes: 30 },
        network: "ronin",
        banners: [],
        categories: [],
        recipes: RECIPES,
      }
      users = []
    }

    // Get user permissions
    let permissions = authRole === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_VIEWER_PERMISSIONS
    if (authUser !== "admin") {
      try {
        const user = await getUserByUsername(authUser)
        if (user?.permissions) permissions = user.permissions
      } catch {
        // User not in DB, use default permissions
      }
    }

    const safeConfig = {
      ...config,
      telegram: config.telegram ? {
        ...config.telegram,
        botToken: config.telegram.botToken ? "****" + config.telegram.botToken.slice(-8) : "",
      } : { botToken: "", chatId: "", enabled: false, intervalMinutes: 30 },
      users: users.map((u: any) => ({
        username: u.username,
        role: u.role,
        permissions: u.permissions,
        createdAt: u.createdAt,
      })),
    }

    console.log("[v0] Login successful for user:", authUser)
    return NextResponse.json({
      success: true,
      token,
      config: safeConfig,
      user: { username: authUser, role: authRole, permissions },
    })
  } catch (error) {
    console.error("[v0] Login error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { error: "Erro ao processar login" },
      { status: 500 }
    )
  }
}

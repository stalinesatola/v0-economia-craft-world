import { NextRequest, NextResponse } from "next/server"
import { validatePassword, validateUserLogin, createSession } from "@/lib/auth"
import { getFullConfig, getUsers, getUserByUsername, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_VIEWER_PERMISSIONS } from "@/lib/config-manager"

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

    let authUser = ""
    let authRole = ""

    if (username) {
      const result = await validateUserLogin(username, password)
      if (!result.valid) {
        return NextResponse.json({ error: "Credenciais incorretas" }, { status: 401 })
      }
      authUser = username
      authRole = result.role
    } else {
      const result = await validatePassword(password)
      if (!result.valid) {
        return NextResponse.json({ error: "Password incorreta" }, { status: 401 })
      }
      authUser = result.username
      authRole = result.role
    }

    const token = await createSession(authUser, authRole)

    const config = await getFullConfig()
    const users = await getUsers()

    // Get user permissions
    let permissions = authRole === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_VIEWER_PERMISSIONS
    if (authUser !== "admin") {
      const user = await getUserByUsername(authUser)
      if (user?.permissions) permissions = user.permissions
    }

    const safeConfig = {
      ...config,
      telegram: config.telegram ? {
        ...config.telegram,
        botToken: config.telegram.botToken ? "****" + config.telegram.botToken.slice(-8) : "",
      } : { botToken: "", chatId: "", enabled: false, intervalMinutes: 30 },
      users: users.map((u) => ({
        username: u.username,
        role: u.role,
        permissions: u.permissions,
        createdAt: u.createdAt,
      })),
    }

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

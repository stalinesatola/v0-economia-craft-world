import { NextRequest, NextResponse } from "next/server"
import { validatePassword, validateUserLogin, createSession } from "@/lib/auth"
import { getFullConfig, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_VIEWER_PERMISSIONS } from "@/lib/config-manager"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, username } = body

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password obrigatoria" }, { status: 400 })
    }

    let authUser = ""
    let authRole = ""

    if (username) {
      const result = validateUserLogin(username, password)
      if (!result.valid) {
        return NextResponse.json({ error: "Credenciais incorretas" }, { status: 401 })
      }
      authUser = username
      authRole = result.role
    } else {
      const result = validatePassword(password)
      if (!result.valid) {
        return NextResponse.json({ error: "Password incorreta" }, { status: 401 })
      }
      authUser = result.username
      authRole = result.role
    }

    await createSession(authUser, authRole)

    const config = getFullConfig()

    // Get user permissions
    let permissions = authRole === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_VIEWER_PERMISSIONS
    if (authUser !== "admin") {
      const user = config.users?.find((u) => u.username === authUser)
      if (user?.permissions) permissions = user.permissions
    }

    const safeConfig = {
      ...config,
      telegram: {
        ...config.telegram,
        botToken: config.telegram.botToken ? "****" + config.telegram.botToken.slice(-8) : "",
      },
      users: config.users?.map((u) => ({
        username: u.username,
        role: u.role,
        permissions: u.permissions,
        createdAt: u.createdAt,
      })) ?? [],
    }

    return NextResponse.json({
      success: true,
      config: safeConfig,
      user: { username: authUser, role: authRole, permissions },
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

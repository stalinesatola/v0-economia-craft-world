import { NextRequest, NextResponse } from "next/server"
import { validatePassword, validateUserLogin, createSession } from "@/lib/auth"
import { getFullConfig } from "@/lib/config-manager"

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
      // Login with username + password
      const result = validateUserLogin(username, password)
      if (!result.valid) {
        return NextResponse.json({ error: "Credenciais incorretas" }, { status: 401 })
      }
      authUser = username
      authRole = result.role
    } else {
      // Login with password only (backwards compatible)
      const result = validatePassword(password)
      if (!result.valid) {
        return NextResponse.json({ error: "Password incorreta" }, { status: 401 })
      }
      authUser = result.username
      authRole = result.role
    }

    await createSession(authUser, authRole)

    // Return config directly to avoid a second API call
    const config = getFullConfig()
    const safeConfig = {
      ...config,
      telegram: {
        ...config.telegram,
        botToken: config.telegram.botToken ? "****" + config.telegram.botToken.slice(-8) : "",
      },
      users: config.users?.map((u) => ({
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      })) ?? [],
    }

    return NextResponse.json({
      success: true,
      config: safeConfig,
      user: { username: authUser, role: authRole },
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

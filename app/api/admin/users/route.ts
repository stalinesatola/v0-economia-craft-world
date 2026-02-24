import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest, hashPassword } from "@/lib/auth"
import { getConfig, updateConfig } from "@/lib/config-manager"

// GET: list users
export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const config = getConfig()
  const users = (config.users ?? []).map((u) => ({
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
  }))

  return NextResponse.json({ users, currentUser: auth.username, currentRole: auth.role })
}

// POST: create user
export async function POST(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid || auth.role !== "admin") {
    return NextResponse.json({ error: "Sem permissoes" }, { status: 403 })
  }

  try {
    const { username, password, role = "viewer" } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username e password obrigatorios" }, { status: 400 })
    }

    if (username === "admin") {
      return NextResponse.json({ error: "Nome 'admin' reservado para superadmin" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const config = getConfig()
    const users = config.users || []

    if (users.find((u) => u.username === username)) {
      return NextResponse.json({ error: "Utilizador ja existe" }, { status: 409 })
    }

    users.push({
      username,
      passwordHash: hashPassword(password),
      role: role === "admin" ? "admin" : "viewer",
      createdAt: new Date().toISOString(),
    })

    updateConfig("users", users)

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({ username: u.username, role: u.role, createdAt: u.createdAt })),
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid || auth.role !== "admin") {
    return NextResponse.json({ error: "Sem permissoes" }, { status: 403 })
  }

  try {
    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: "Username obrigatorio" }, { status: 400 })
    }

    const config = getConfig()
    const users = (config.users || []).filter((u) => u.username !== username)
    updateConfig("users", users)

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({ username: u.username, role: u.role, createdAt: u.createdAt })),
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest, hashPassword } from "@/lib/auth"
import { getUsers, getUserByUsername, createUser, deleteUser } from "@/lib/config-manager"

// GET: list users
export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  try {
    const users = await getUsers()
    const safeUsers = users.map((u) => ({
      username: u.username,
      role: u.role,
      permissions: u.permissions,
      createdAt: u.createdAt,
    }))
    return NextResponse.json({ users: safeUsers, currentUser: auth.username, currentRole: auth.role })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}

// POST: create user
export async function POST(request: NextRequest) {
  const auth = validateAdminRequest(request)
  console.log("[v0] POST /admin/users - auth:", auth)
  
  if (!auth.valid) {
    return NextResponse.json({ error: "Não autorizado - token inválido" }, { status: 401 })
  }
  
  if (auth.role !== "admin") {
    console.log("[v0] User role is not admin:", auth.role)
    return NextResponse.json({ error: `Sem permissões - role: ${auth.role}` }, { status: 403 })
  }

  try {
    const { username, password, role = "viewer", permissions } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username e password obrigatorios" }, { status: 400 })
    }

    if (username === "admin") {
      return NextResponse.json({ error: "Nome 'admin' reservado para superadmin" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const existing = await getUserByUsername(username)
    if (existing) {
      return NextResponse.json({ error: "Utilizador ja existe" }, { status: 409 })
    }

    await createUser({
      username,
      passwordHash: hashPassword(password),
      role: role === "admin" ? "admin" : "viewer",
      permissions: role === "viewer" && permissions ? permissions : undefined,
    })

    const users = await getUsers()
    return NextResponse.json({
      success: true,
      users: users.map((u) => ({ username: u.username, role: u.role, permissions: u.permissions, createdAt: u.createdAt })),
    })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
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

    await deleteUser(username)

    const users = await getUsers()
    return NextResponse.json({
      success: true,
      users: users.map((u) => ({ username: u.username, role: u.role, permissions: u.permissions, createdAt: u.createdAt })),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}

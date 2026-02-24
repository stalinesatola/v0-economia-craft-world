import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest, hashPassword, changePassword } from "@/lib/auth"
import { getConfig, updateConfig } from "@/lib/config-manager"

// PUT: change password
export async function PUT(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword, targetUsername } = await request.json()

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "Nova password deve ter pelo menos 4 caracteres" }, { status: 400 })
    }

    // Admin changing another user's password
    if (targetUsername && auth.role === "admin" && targetUsername !== auth.username) {
      if (targetUsername === "admin") {
        return NextResponse.json({ error: "Password do superadmin e gerida via variavel de ambiente ADMIN_PASSWORD" }, { status: 400 })
      }
      const success = changePassword(targetUsername, newPassword)
      if (!success) {
        return NextResponse.json({ error: "Utilizador nao encontrado" }, { status: 404 })
      }
      return NextResponse.json({ success: true, message: `Password de '${targetUsername}' alterada` })
    }

    // User changing own password
    if (auth.username === "admin") {
      return NextResponse.json({
        error: "Password do superadmin e gerida via variavel de ambiente ADMIN_PASSWORD no painel Vercel",
      }, { status: 400 })
    }

    // Verify current password for self-change
    if (!currentPassword) {
      return NextResponse.json({ error: "Password atual obrigatoria" }, { status: 400 })
    }

    const config = getConfig()
    const user = (config.users ?? []).find((u) => u.username === auth.username)
    if (!user) {
      return NextResponse.json({ error: "Utilizador nao encontrado" }, { status: 404 })
    }

    const currentHash = hashPassword(currentPassword)
    if (currentHash !== user.passwordHash) {
      return NextResponse.json({ error: "Password atual incorreta" }, { status: 401 })
    }

    const users = config.users ?? []
    const idx = users.findIndex((u) => u.username === auth.username)
    users[idx].passwordHash = hashPassword(newPassword)
    updateConfig("users", users)

    return NextResponse.json({ success: true, message: "Password alterada com sucesso" })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

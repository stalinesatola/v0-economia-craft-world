import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest, hashPassword } from "@/lib/auth"
import { getUserByUsername, updateUserPassword } from "@/lib/config-manager"

export async function PUT(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { username, newPassword, targetUser } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const userToChange = targetUser || username || auth.username

    // Only admins can change other users' passwords
    if (userToChange !== auth.username && auth.role !== "admin") {
      return NextResponse.json({ error: "Sem permissoes para alterar password de outro utilizador" }, { status: 403 })
    }

    // If target is superadmin, we can't change env var from here
    if (userToChange === "admin") {
      return NextResponse.json({
        error: "A password do superadmin e definida pela variavel de ambiente ADMIN_PASSWORD. Altere-a nas Vars do projeto.",
      }, { status: 400 })
    }

    const user = await getUserByUsername(userToChange)
    if (!user) {
      return NextResponse.json({ error: "Utilizador nao encontrado" }, { status: 404 })
    }

    await updateUserPassword(userToChange, hashPassword(newPassword))
    return NextResponse.json({ success: true, message: `Password de '${userToChange}' atualizada` })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

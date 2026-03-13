import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest, hashPassword, changePassword } from "@/lib/auth"
import { getUserByUsername } from "@/lib/config-manager"

// PUT: change password
export async function PUT(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword, targetUsername } = await request.json()

    // Enforce stronger password requirements
    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Nova password obrigatoria" }, { status: 400 })
    }

    if (newPassword.length < 12) {
      return NextResponse.json({ error: "Nova password deve ter pelo menos 12 caracteres" }, { status: 400 })
    }

    // Check for complexity: at least 1 uppercase, 1 lowercase, 1 number
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)

    if (!(hasUppercase && hasLowercase && hasNumber && (hasSpecial || newPassword.length >= 16))) {
      return NextResponse.json({
        error: "Password deve conter: maiusculas, minusculas, numeros e caracteres especiais (ou 16+ caracteres)",
      }, { status: 400 })
    }

    // Admin changing another user's password
    if (targetUsername && auth.role === "admin" && targetUsername !== auth.username) {
      if (targetUsername === "admin") {
        return NextResponse.json({ error: "Password do superadmin e gerida via variavel de ambiente ADMIN_PASSWORD" }, { status: 400 })
      }
      const success = await changePassword(targetUsername, newPassword)
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

    const user = await getUserByUsername(auth.username)
    if (!user) {
      return NextResponse.json({ error: "Utilizador nao encontrado" }, { status: 404 })
    }

    const currentHash = hashPassword(currentPassword)
    if (currentHash !== user.passwordHash) {
      return NextResponse.json({ error: "Password atual incorreta" }, { status: 401 })
    }

    await changePassword(auth.username, newPassword)

    return NextResponse.json({ success: true, message: "Password alterada com sucesso" })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

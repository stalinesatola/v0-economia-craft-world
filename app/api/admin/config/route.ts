import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { getFullConfig } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const config = getFullConfig()
    // Mask the Telegram bot token and user password hashes
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
    return NextResponse.json(safeConfig)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao ler config" },
      { status: 500 }
    )
  }
}

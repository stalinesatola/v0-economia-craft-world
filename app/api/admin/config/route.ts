import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { getFullConfig, getUsers } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const config = await getFullConfig()
    console.log("[v0] GET /api/admin/config: config keys:", Object.keys(config))
    console.log("[v0] GET /api/admin/config: pools type:", typeof config.pools, "pools keys:", config.pools ? Object.keys(config.pools).length : "null")
    console.log("[v0] GET /api/admin/config: banners type:", typeof config.banners, "is array:", Array.isArray(config.banners))
    const users = await getUsers()
    console.log("[v0] GET /api/admin/config: users count:", users.length)

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
    return NextResponse.json(safeConfig)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao ler config" },
      { status: 500 }
    )
  }
}

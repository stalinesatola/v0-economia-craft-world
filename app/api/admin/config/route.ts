import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { getFullConfig } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!validateAdminRequest(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const config = getFullConfig()
    // Mask the Telegram bot token for security
    const safeConfig = {
      ...config,
      telegram: {
        ...config.telegram,
        botToken: config.telegram.botToken ? "****" + config.telegram.botToken.slice(-8) : "",
      },
    }
    return NextResponse.json(safeConfig)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao ler config" },
      { status: 500 }
    )
  }
}

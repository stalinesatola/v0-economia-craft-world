import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { updateConfig } from "@/lib/config-manager"

const VALID_SECTIONS = [
  "pools",
  "productionCosts",
  "alertsConfig",
  "productionChains",
  "thresholds",
  "telegram",
  "network",
  "users",
  "banners",
  "sharing",
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  // Only admins can modify config
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Sem permissoes de admin" }, { status: 403 })
  }

  const { section } = await params

  if (!VALID_SECTIONS.includes(section)) {
    return NextResponse.json(
      { error: `Seccao invalida: ${section}. Validas: ${VALID_SECTIONS.join(", ")}` },
      { status: 400 }
    )
  }

  try {
    const data = await request.json()

    // For telegram section, preserve existing bot token if masked value sent
    if (section === "telegram" && data.botToken && data.botToken.startsWith("****")) {
      const { getConfig } = await import("@/lib/config-manager")
      const currentConfig = getConfig()
      data.botToken = currentConfig.telegram.botToken
    }

    const updatedConfig = updateConfig(section, data)
    return NextResponse.json({ success: true, config: updatedConfig })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar config" },
      { status: 500 }
    )
  }
}

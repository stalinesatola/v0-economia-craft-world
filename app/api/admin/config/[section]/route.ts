import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { updateConfig, getConfigSection, getUserByUsername } from "@/lib/config-manager"

const VALID_SECTIONS = [
  "pools", "productionCosts", "alertsConfig", "productionChains",
  "thresholds", "telegram", "network", "users", "banners",
  "sharing", "customization", "maintenance", "categories", "recipes",
  "alertHistory",
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const { section } = await params

  // Check permissions - admins always have access, viewers need granular permissions
  if (auth.role !== "admin") {
    const sectionPermMap: Record<string, string> = {
      pools: "pools", productionCosts: "pools", alertsConfig: "pools",
      productionChains: "chains", thresholds: "settings", telegram: "telegram",
      network: "settings", users: "users", banners: "banners",
      sharing: "sharing", customization: "settings", maintenance: "settings",
      categories: "settings", recipes: "chains",
    }
    const permKey = sectionPermMap[section] ?? section
    try {
      const user = await getUserByUsername(auth.username)
      if (!user?.permissions || !user.permissions[permKey as keyof typeof user.permissions]) {
        return NextResponse.json({ error: "Sem permissoes para esta seccao" }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: "Sem permissoes" }, { status: 403 })
    }
  }

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
      const currentTelegram = await getConfigSection("telegram") as { botToken?: string } | null
      if (currentTelegram?.botToken) {
        data.botToken = currentTelegram.botToken
      }
    }

    const updatedConfig = await updateConfig(section, data)
    return NextResponse.json({ success: true, config: updatedConfig })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar config" },
      { status: 500 }
    )
  }
}

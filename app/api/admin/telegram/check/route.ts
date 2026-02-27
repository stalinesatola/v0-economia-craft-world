import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { runMonitorCycle } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const result = await runMonitorCycle()
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro ao executar verificacao" },
      { status: 500 }
    )
  }
}

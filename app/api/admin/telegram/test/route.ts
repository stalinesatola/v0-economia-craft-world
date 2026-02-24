import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { sendTestMessage } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  if (!validateAdminRequest(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const result = await sendTestMessage()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

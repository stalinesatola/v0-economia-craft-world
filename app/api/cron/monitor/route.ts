import { NextRequest, NextResponse } from "next/server"
import { runMonitorCycle } from "@/lib/telegram"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const result = await runMonitorCycle()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

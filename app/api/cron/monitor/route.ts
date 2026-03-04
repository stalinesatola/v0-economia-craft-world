import { NextRequest, NextResponse } from "next/server"
import { runMonitorCycle } from "@/lib/telegram"

export const dynamic = "force-dynamic"
export const maxDuration = 30

// GET - Called by Vercel Cron every 5 minutes
export async function GET(request: NextRequest) {
  // Verify cron secret only if configured
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Cron auth failed - header:", authHeader?.slice(0, 20))
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }
  }

  console.log("[v0] Cron monitor triggered at", new Date().toISOString())

  try {
    const result = await runMonitorCycle()
    console.log("[v0] Cron result:", JSON.stringify(result).slice(0, 500))
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[v0] Cron error:", error)
    return NextResponse.json(
      { success: false, message: `Erro no monitor: ${error instanceof Error ? error.message : "Unknown"}`, alerts: [], opportunities: [] },
      { status: 500 }
    )
  }
}

// POST - Manual trigger from admin panel or external cron services
export async function POST() {
  console.log("[v0] Manual monitor trigger at", new Date().toISOString())

  try {
    const result = await runMonitorCycle()
    console.log("[v0] Manual trigger result:", JSON.stringify(result).slice(0, 500))
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[v0] Manual trigger error:", error)
    return NextResponse.json(
      { success: false, message: `Erro: ${error instanceof Error ? error.message : "Unknown"}`, alerts: [], opportunities: [] },
      { status: 500 }
    )
  }
}

// PUT - Alias for external cron services that use PUT
export async function PUT() {
  return POST()
}

// HEAD/OPTIONS - Health check for cron services that probe before calling
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Allow": "GET, POST, PUT, HEAD, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, PUT, HEAD, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

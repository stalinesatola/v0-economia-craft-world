import { NextResponse } from "next/server"
import { getConfig } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const config = getConfig()
    const maintenance = config.maintenance ?? { enabled: false, message: "" }
    return NextResponse.json(maintenance)
  } catch {
    return NextResponse.json({ enabled: false, message: "" })
  }
}

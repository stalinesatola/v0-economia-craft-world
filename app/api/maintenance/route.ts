import { NextResponse } from "next/server"
import { getConfigSection } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const maintenance = await getConfigSection("maintenance") as { enabled: boolean; message: string } | null
    return NextResponse.json(maintenance ?? { enabled: false, message: "" })
  } catch {
    return NextResponse.json({ enabled: false, message: "" })
  }
}

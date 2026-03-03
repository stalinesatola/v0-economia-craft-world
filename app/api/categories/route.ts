import { NextResponse } from "next/server"
import { getConfigSection } from "@/lib/config-manager"

export async function GET() {
  try {
    const categories = await getConfigSection("categories")
    return NextResponse.json(categories ?? [])
  } catch {
    return NextResponse.json([])
  }
}

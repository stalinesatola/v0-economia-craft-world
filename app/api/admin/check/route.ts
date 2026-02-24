import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Lightweight auth check - no config loading
export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true, username: auth.username, role: auth.role })
}

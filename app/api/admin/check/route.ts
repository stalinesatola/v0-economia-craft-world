import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { getUserByUsername, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_VIEWER_PERMISSIONS } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  let permissions = auth.role === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_VIEWER_PERMISSIONS
  if (auth.username !== "admin") {
    try {
      const user = await getUserByUsername(auth.username)
      if (user?.permissions) {
        permissions = user.permissions
      }
    } catch {
      // Use defaults
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: { username: auth.username, role: auth.role, permissions },
  })
}

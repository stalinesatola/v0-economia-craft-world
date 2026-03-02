import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"

export async function POST() {
  await clearSession()
  // Limpar cookie de sessao com header Set-Cookie
  const response = NextResponse.json({ success: true })
  response.cookies.delete("cw_admin_session")
  return response
}

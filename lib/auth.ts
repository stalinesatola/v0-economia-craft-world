import { cookies } from "next/headers"
import { NextRequest } from "next/server"

const SESSION_COOKIE = "cw_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

// Simple token: hash of password + secret
function generateToken(password: string): string {
  // Simple base64-encoded session token
  const payload = JSON.stringify({
    auth: true,
    ts: Math.floor(Date.now() / 1000),
    hash: Buffer.from(password).toString("base64"),
  })
  return Buffer.from(payload).toString("base64")
}

function verifyToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
    if (!payload.auth || !payload.ts) return false

    // Check if token is not expired (24h)
    const now = Math.floor(Date.now() / 1000)
    if (now - payload.ts > SESSION_MAX_AGE) return false

    // Verify the hash matches current password
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) return false
    const expectedHash = Buffer.from(adminPassword).toString("base64")
    return payload.hash === expectedHash
  } catch {
    return false
  }
}

export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return password === adminPassword
}

export async function createSession(): Promise<string> {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) throw new Error("ADMIN_PASSWORD not configured")

  const token = generateToken(adminPassword)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })

  return token
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifyToken(token)
}

// For API route handlers: validate from request
export function validateAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifyToken(token)
}

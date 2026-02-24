import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { createHash } from "crypto"

const SESSION_COOKIE = "cw_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

// Hash password using SHA-256
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

interface SessionPayload {
  auth: boolean
  ts: number
  user: string
  role: string
  sig: string
}

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.CRON_SECRET || "craft-world-economy"
}

function generateToken(username: string, role: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const sig = createHash("sha256").update(`${username}:${role}:${ts}:${getSecret()}`).digest("hex")
  const payload: SessionPayload = { auth: true, ts, user: username, role, sig }
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

function verifyToken(token: string): { valid: boolean; username: string; role: string } {
  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
    if (!payload.auth || !payload.ts || !payload.user) return { valid: false, username: "", role: "" }

    // Check expiry
    const now = Math.floor(Date.now() / 1000)
    if (now - payload.ts > SESSION_MAX_AGE) return { valid: false, username: "", role: "" }

    // Verify signature
    const expectedSig = createHash("sha256").update(`${payload.user}:${payload.role}:${payload.ts}:${getSecret()}`).digest("hex")
    if (payload.sig !== expectedSig) return { valid: false, username: "", role: "" }

    return { valid: true, username: payload.user, role: payload.role }
  } catch {
    return { valid: false, username: "", role: "" }
  }
}

// Validate password against env var (superadmin) or config users
export function validatePassword(password: string): { valid: boolean; username: string; role: string } {
  // Check superadmin (env var)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPassword && password === adminPassword) {
    return { valid: true, username: "admin", role: "admin" }
  }

  // Check config users
  try {
    // Dynamic import to avoid circular dependency
    const { getConfig } = require("@/lib/config-manager")
    const config = getConfig()
    if (config.users && Array.isArray(config.users)) {
      for (const user of config.users) {
        if (verifyPassword(password, user.passwordHash)) {
          return { valid: true, username: user.username, role: user.role }
        }
      }
    }
  } catch {
    // Config not available
  }

  return { valid: false, username: "", role: "" }
}

// Validate with username + password
export function validateUserLogin(username: string, password: string): { valid: boolean; role: string } {
  // Check superadmin
  const adminPassword = process.env.ADMIN_PASSWORD
  if (username === "admin" && adminPassword && password === adminPassword) {
    return { valid: true, role: "admin" }
  }

  // Check config users
  try {
    const { getConfig } = require("@/lib/config-manager")
    const config = getConfig()
    if (config.users && Array.isArray(config.users)) {
      const user = config.users.find((u: { username: string }) => u.username === username)
      if (user && verifyPassword(password, user.passwordHash)) {
        return { valid: true, role: user.role }
      }
    }
  } catch {
    // Config not available
  }

  return { valid: false, role: "" }
}

export async function createSession(username: string, role: string): Promise<string> {
  const token = generateToken(username, role)
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

export async function isAuthenticated(): Promise<{ authenticated: boolean; username: string; role: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return { authenticated: false, username: "", role: "" }
  const result = verifyToken(token)
  return { authenticated: result.valid, username: result.username, role: result.role }
}

export function validateAdminRequest(request: NextRequest): { valid: boolean; username: string; role: string } {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return { valid: false, username: "", role: "" }
  return verifyToken(token)
}

// Change password for a config user
export function changePassword(username: string, newPassword: string): boolean {
  try {
    const { getConfig, updateConfig } = require("@/lib/config-manager")
    const config = getConfig()
    const users = config.users || []
    const idx = users.findIndex((u: { username: string }) => u.username === username)
    if (idx === -1) return false
    users[idx].passwordHash = hashPassword(newPassword)
    updateConfig("users", users)
    return true
  } catch {
    return false
  }
}

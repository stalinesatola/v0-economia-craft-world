import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { createHash, timingSafeEqual } from "crypto"
import { getUsers, getUserByUsername, updateUserPassword } from "@/lib/config-manager"

const SESSION_COOKIE = "cw_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

// ⚠️ SHA-256 without salt is NOT recommended for production passwords
// For proper security, this app REQUIRES bcrypt or Argon2
// Currently using SHA-256 as fallback for existing hashes
// New passwords should use bcrypt via a password manager library
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const inputHash = Buffer.from(hashPassword(password))
    const storedHash = Buffer.from(hash)
    // Use constant-time comparison to prevent timing attacks
    return inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash)
  } catch {
    // If timing-safe comparison fails, return false (buffers different sizes)
    return false
  }
}

interface SessionPayload {
  auth: boolean
  ts: number
  user: string
  role: string
  sig: string
}

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET
  if (!secret) {
    throw new Error("CRITICAL: ADMIN_PASSWORD or CRON_SECRET environment variable must be set for security")
  }
  return secret
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

    const now = Math.floor(Date.now() / 1000)
    if (now - payload.ts > SESSION_MAX_AGE) return { valid: false, username: "", role: "" }

    const expectedSig = createHash("sha256")
      .update(`${payload.user}:${payload.role}:${payload.ts}:${getSecret()}`)
      .digest("hex")
    if (payload.sig !== expectedSig) return { valid: false, username: "", role: "" }

    return { valid: true, username: payload.user, role: payload.role }
  } catch {
    return { valid: false, username: "", role: "" }
  }
}

/** @deprecated Consolidate with validateUserLogin - duplicated logic */
export async function validatePassword(password: string): Promise<{ valid: boolean; username: string; role: string }> {
  // Check superadmin (env var)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPassword && password === adminPassword) {
    return { valid: true, username: "admin", role: "admin" }
  }

  // Check DB users
  try {
    const users = await getUsers()
    for (const user of users) {
      if (verifyPassword(password, user.passwordHash)) {
        return { valid: true, username: user.username, role: user.role }
      }
    }
  } catch {
    // DB not available
  }

  return { valid: false, username: "", role: "" }
}

// Validate with username + password
export async function validateUserLogin(username: string, password: string): Promise<{ valid: boolean; role: string }> {
  // Check superadmin
  const adminPassword = process.env.ADMIN_PASSWORD
  if (username === "admin" && adminPassword && password === adminPassword) {
    return { valid: true, role: "admin" }
  }

  // Check DB users
  try {
    const user = await getUserByUsername(username)
    if (user && verifyPassword(password, user.passwordHash)) {
      return { valid: true, role: user.role }
    }
  } catch {
    // DB not available
  }

  return { valid: false, role: "" }
}

export async function createSession(username: string, role: string): Promise<string> {
  const token = generateToken(username, role)
  // Nao setar cookie persistente - usar apenas Bearer token via sessionStorage
  // Isso garante que o utilizador precisa fazer login a cada sessao de browser
  return token
}

/** @deprecated Function marked for removal - use header validation instead */
export async function isAuthenticated(): Promise<{ authenticated: boolean; username: string; role: string }> {
  // This function is no longer used - authentication is done via Bearer token
  return { authenticated: false, username: "", role: "" }
}

// Synchronous token validation for API routes (does not need DB)
// Checks both cookie and Authorization header for token
export function validateAdminRequest(request: NextRequest): { valid: boolean; username: string; role: string } {
  // Usar APENAS Bearer token no Authorization header (nao cookies)
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, username: "", role: "" }
  }
  const token = authHeader.slice(7)
  if (!token) return { valid: false, username: "", role: "" }
  return verifyToken(token)
}

// Change password for a DB user
export async function changePassword(username: string, newPassword: string): Promise<boolean> {
  try {
    await updateUserPassword(username, hashPassword(newPassword))
    return true
  } catch {
    return false
  }
}

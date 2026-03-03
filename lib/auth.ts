import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { createHash } from "crypto"
import { getUsers, getUserByUsername, updateUserPassword } from "@/lib/config-manager"

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

// Validate password against env var (superadmin) or DB users
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

export async function clearSession(): Promise<void> {
  // Limpar cookie antigo se existir (de sessoes anteriores)
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
  } catch {
    // Cookie may not exist
  }
}

/** @deprecated Nao usado - autenticacao agora usa apenas Bearer token via validateAdminRequest */
export async function isAuthenticated(): Promise<{ authenticated: boolean; username: string; role: string }> {
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

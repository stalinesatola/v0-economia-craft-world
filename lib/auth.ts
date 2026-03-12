import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { createHash, randomBytes } from "crypto"
import bcryptjs from "bcryptjs"
import { getUsers, getUserByUsername, updateUserPassword } from "@/lib/config-manager"

const SESSION_COOKIE = "cw_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours
const BCRYPT_ROUNDS = 12

// Use bcrypt for password hashing (much more secure than SHA-256)
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcryptjs.compare(password, hash)
  } catch {
    return false
  }
}

interface SessionPayload {
  auth: boolean
  ts: number
  user: string
  role: string
  nonce: string
  sig: string
}

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET
  if (!secret) {
    throw new Error("ADMIN_PASSWORD or CRON_SECRET must be configured")
  }
  return secret
}

function generateToken(username: string, role: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const nonce = randomBytes(16).toString("hex")
  const sig = createHash("sha256").update(`${username}:${role}:${ts}:${nonce}:${getSecret()}`).digest("hex")
  const payload: SessionPayload = { auth: true, ts, user: username, role, nonce, sig }
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

function verifyToken(token: string): { valid: boolean; username: string; role: string } {
  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
    if (!payload.auth || !payload.ts || !payload.user || !payload.nonce) return { valid: false, username: "", role: "" }

    const now = Math.floor(Date.now() / 1000)
    // Token expiry: 24 hours
    if (now - payload.ts > SESSION_MAX_AGE) return { valid: false, username: "", role: "" }

    const expectedSig = createHash("sha256")
      .update(`${payload.user}:${payload.role}:${payload.ts}:${payload.nonce}:${getSecret()}`)
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
      const isValid = await verifyPassword(password, user.passwordHash)
      if (isValid) {
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
    if (user) {
      const isValid = await verifyPassword(password, user.passwordHash)
      if (isValid) {
        return { valid: true, role: user.role }
      }
    }
  } catch {
    // DB not available
  }

  return { valid: false, role: "" }
}

export async function createSession(username: string, role: string): Promise<string> {
  const token = generateToken(username, role)
  return token
}

export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
  } catch {
    // Cookie may not exist
  }
}

export async function isAuthenticated(): Promise<{ authenticated: boolean; username: string; role: string }> {
  return { authenticated: false, username: "", role: "" }
}

export function validateAdminRequest(request: NextRequest): { valid: boolean; username: string; role: string } {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, username: "", role: "" }
  }
  const token = authHeader.slice(7)
  if (!token) return { valid: false, username: "", role: "" }
  return verifyToken(token)
}

export async function changePassword(username: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword)
    await updateUserPassword(username, hashedPassword)
    return true
  } catch {
    return false
  }
}


import { NextRequest } from "next/server"
import { createHash, timingSafeEqual, scryptSync, randomBytes } from "node:crypto"
import { getUsers, getUserByUsername, updateUserPassword } from "@/lib/config-manager"

const SESSION_COOKIE = "cw_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

// Use scrypt for password hashing (much more secure than SHA-256)
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedValue: string): boolean {
  try {
    // Check if it's the old SHA-256 format or the new salt:hash format
    if (!storedValue.includes(":")) {
      // Fallback for legacy SHA-256 hashes
      const legacyHash = createHash("sha256").update(password).digest("hex")
      return timingSafeEqual(Buffer.from(legacyHash), Buffer.from(storedValue))
    }

    const [salt, hash] = storedValue.split(":")
    const loginHash = scryptSync(password, salt, 64).toString("hex")
    
    const loginHashBuffer = Buffer.from(loginHash)
    const storedHashBuffer = Buffer.from(hash)
    
    return loginHashBuffer.length === storedHashBuffer.length && 
           timingSafeEqual(loginHashBuffer, storedHashBuffer)
  } catch (error) {
    console.error("[v0] Auth verification error:", error)
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

// Validate with username + password
export async function validateUserLogin(username: string, password: string): Promise<{ valid: boolean; role: string }> {
  console.log("[v0] validateUserLogin - checking username:", username)
  
  // Check superadmin
  const adminPassword = process.env.ADMIN_PASSWORD
  console.log("[v0] ADMIN_PASSWORD env var set:", !!adminPassword)
  
  if (username === "admin") {
    console.log("[v0] Checking admin password...")
    console.log("[v0] Password provided length:", password.length)
    console.log("[v0] Admin password length:", adminPassword?.length)
    console.log("[v0] Passwords match:", password === adminPassword)
    
    if (adminPassword && password === adminPassword) {
      console.log("[v0] Admin authentication successful")
      return { valid: true, role: "admin" }
    }
  }

  // Check DB users
  try {
    const user = await getUserByUsername(username)
    if (user && verifyPassword(password, user.passwordHash)) {
      return { valid: true, role: user.role }
    }
  } catch (error) {
    console.log("[v0] DB user check error:", error)
    // DB not available
  }

  console.log("[v0] validateUserLogin failed for user:", username)
  return { valid: false, role: "" }
}

export async function createSession(username: string, role: string): Promise<string> {
  const token = generateToken(username, role)
  // Use Bearer token via sessionStorage (client-side)
  return token
}

// Synchronous token validation for API routes (does not need DB)
export function validateAdminRequest(request: NextRequest): { valid: boolean; username: string; role: string } {
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

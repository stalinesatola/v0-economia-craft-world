import { NextRequest, NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (consider using Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>()

export function createRateLimiter(windowMs: number, maxRequests: number) {
  return function rateLimiter(getKey: (request: NextRequest) => string) {
    return (request: NextRequest) => {
      const key = getKey(request)
      const now = Date.now()
      const entry = rateLimitStore.get(key)

      if (!entry || now > entry.resetTime) {
        // New window
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return { allowed: true, remaining: maxRequests - 1 }
      }

      if (entry.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        }
      }

      entry.count++
      return { allowed: true, remaining: maxRequests - entry.count }
    }
  }
}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function rateLimitResponse(remaining: number, retryAfter?: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        ...(retryAfter && { "Retry-After": retryAfter.toString() }),
      },
    }
  )
}

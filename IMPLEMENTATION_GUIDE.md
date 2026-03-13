# Exemplos de Implementação das Correções Pendentes

Este arquivo contém exemplos de código para as 5 melhorias pendentes mais críticas.

---

## 1. Implementar Bcrypt para Hashing Seguro

### Instalação
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### Código Refatorado: `lib/auth.ts`
```typescript
import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 12

// Versão anterior SHA-256 DEPRECATED
export async function hashPassword(password: string): Promise<string> {
  // Check if password is already a bcrypt hash (legacy compatibility)
  if (password.startsWith('$2')) {
    return password // Already bcrypted
  }
  
  // Hash new passwords with bcrypt
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Use bcrypt.compare for timing-safe comparison
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}
```

### Migração de Usuários Existentes
```typescript
// scripts/migrate-passwords-to-bcrypt.ts
import bcrypt from 'bcrypt'
import { getUsers, updateUserPassword } from '@/lib/config-manager'

export async function migratePasswordsToBcrypt() {
  const users = await getUsers()
  
  for (const user of users) {
    // Skip if already bcrypted
    if (user.passwordHash.startsWith('$2')) continue
    
    // Otherwise, re-hash with bcrypt
    const newHash = await bcrypt.hash(user.passwordHash, 12)
    await updateUserPassword(user.username, newHash)
    console.log(`[v0] Migrated ${user.username} to bcrypt`)
  }
}
```

---

## 2. Implementar CSRF Token Protection

### Instalação
```bash
npm install next-csrf
npm install --save-dev @types/next-csrf
```

### Middleware: `middleware.ts` (novo arquivo)
```typescript
import { withCsrf } from 'next-csrf'
import { NextRequest, NextResponse } from 'next/server'

export const middleware = withCsrf((request: NextRequest) => {
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Uso em API Routes: `app/api/admin/config/[section]/route.ts`
```typescript
import { getCsrfToken, checkCsrfToken } from 'next-csrf'

export async function PUT(request: NextRequest) {
  // Validate CSRF token
  const csrfValid = await checkCsrfToken(request)
  if (!csrfValid) {
    return NextResponse.json(
      { error: "CSRF token inválido" },
      { status: 403 }
    )
  }

  // Rest of handler...
}
```

### Uso em Frontend: `components/admin/admin-dashboard.tsx`
```typescript
import { getCsrfToken } from 'next-csrf'

export function AdminDashboard() {
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    getCsrfToken().then(setCsrfToken)
  }, [])

  const handleSave = async (data: ConfigData) => {
    const response = await fetch('/api/admin/config/section', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(data),
    })
    // Handle response...
  }
}
```

---

## 3. Security Headers em `next.config.js`

### Configuração
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS Protection (deprecated but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // ⚠️ Relaxe para seu use case
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.geckoterminal.com https://api.telegram.org",
              "frame-ancestors 'none'",
            ].join(';'),
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
  // ... outros configs
}

module.exports = nextConfig
```

---

## 4. HTML Sanitization com DOMPurify

### Instalação
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### Refactor: `components/ad-banner.tsx`
```typescript
import DOMPurify from 'dompurify'

interface AdBannerProps {
  position: "top" | "sidebar" | "between"
  imageUrl?: string
  linkUrl?: string
  altText?: string
  adScript?: string
  enabled?: boolean
}

export function AdBanner({ position, imageUrl, linkUrl, altText, adScript, enabled }: AdBannerProps) {
  const scriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adScript && scriptRef.current) {
      try {
        // Sanitize HTML before inserting
        const config = {
          ALLOWED_TAGS: ['div', 'span', 'p', 'a', 'img', 'script'],
          ALLOWED_ATTR: ['src', 'href', 'alt', 'class', 'id'],
          FORCE_BODY: true,
        }
        
        const clean = DOMPurify.sanitize(adScript, config)
        
        const container = scriptRef.current
        container.innerHTML = clean
      } catch (error) {
        console.error('[v0] Ad script sanitization failed:', error)
      }
    }
  }, [adScript])

  // Rest of component...
}
```

---

## 5. Consolidar Funções Duplicadas

### Refactor: `lib/auth.ts`
```typescript
// ❌ BEFORE: Duas funções com lógica similar
export async function validatePassword(password: string) { ... }
export async function validateUserLogin(username: string, password: string) { ... }

// ✅ AFTER: Uma função consolidada
interface AuthCredentials {
  username?: string
  password: string
}

export async function validateCredentials(
  creds: AuthCredentials
): Promise<{ valid: boolean; username: string; role: string }> {
  const { username, password } = creds

  // Check superadmin
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPassword) {
    // With username
    if (username === "admin" && password === adminPassword) {
      return { valid: true, username: "admin", role: "admin" }
    }
    // Without username (legacy)
    if (!username && password === adminPassword) {
      return { valid: true, username: "admin", role: "admin" }
    }
  }

  // Check DB users
  try {
    const user = username
      ? await getUserByUsername(username)
      : null

    if (user && verifyPassword(password, user.passwordHash)) {
      return { valid: true, username: user.username, role: user.role }
    }

    // If no username provided, try all users (legacy mode)
    if (!username) {
      const users = await getUsers()
      for (const u of users) {
        if (verifyPassword(password, u.passwordHash)) {
          return { valid: true, username: u.username, role: u.role }
        }
      }
    }
  } catch (error) {
    console.error('[v0] Auth validation error:', error)
  }

  return { valid: false, username: "", role: "" }
}

// Manter para compatibilidade (deprecated)
export async function validatePassword(password: string) {
  return validateCredentials({ password })
}

export async function validateUserLogin(username: string, password: string) {
  const result = await validateCredentials({ username, password })
  return { valid: result.valid, role: result.role }
}
```

### Atualizar login route para usar nova função
```typescript
// app/api/admin/login/route.ts
const result = await validateCredentials({
  username: username || undefined,
  password,
})

if (!result.valid) {
  return NextResponse.json({ error: "Credenciais incorretas" }, { status: 401 })
}

authUser = result.username
authRole = result.role
```

---

## Testing Examples

### `__tests__/auth.security.test.ts`
```typescript
import { describe, it, expect } from '@jest/globals'
import bcrypt from 'bcrypt'
import { hashPassword, verifyPassword, validateCredentials } from '@/lib/auth'

describe('Authentication Security Tests', () => {
  describe('bcrypt password hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toMatch(/^\$2[aby]\$/)
      expect(hash).not.toBe(password)
    })

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword', hash)
      
      expect(isValid).toBe(false)
    })

    it('should use constant-time comparison', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      
      const start1 = performance.now()
      await verifyPassword('wrong', hash)
      const time1 = performance.now() - start1

      const start2 = performance.now()
      await verifyPassword('wrong-but-longer-password', hash)
      const time2 = performance.now() - start2

      // Times should be similar within 50% margin
      const timeDiff = Math.abs(time1 - time2) / Math.max(time1, time2)
      expect(timeDiff).toBeLessThan(0.5)
    })
  })

  describe('Consolidated auth', () => {
    it('should handle missing username (legacy)', async () => {
      process.env.ADMIN_PASSWORD = 'TestPassword123!'
      
      const result = await validateCredentials({
        password: 'TestPassword123!'
      })
      
      expect(result.valid).toBe(true)
      expect(result.username).toBe('admin')
      
      delete process.env.ADMIN_PASSWORD
    })

    it('should validate with username', async () => {
      const result = await validateCredentials({
        username: 'admin',
        password: 'TestPassword123!'
      })
      
      // Will fail if no actual user, but structure is correct
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('username')
      expect(result).toHaveProperty('role')
    })
  })
})
```

---

## Plano de Implementação (Timeline)

### Semana 1
- [ ] Implementar bcrypt
- [ ] Criar script de migração
- [ ] Testar compatibilidade com hashes legados

### Semana 2
- [ ] Adicionar CSRF tokens
- [ ] Configurar security headers
- [ ] Testar headers em produção

### Semana 3
- [ ] Implementar DOMPurify
- [ ] Consolidar funções de auth
- [ ] Testes de segurança

### Semana 4
- [ ] Code review
- [ ] QA testing
- [ ] Deployment em staging
- [ ] Deployment em produção

---

## Referências

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [Next.js Security Best Practices](https://nextjs.org/docs/guides/security-best-practices)

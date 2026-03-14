# Security & Code Quality Audit Report

## Issues Found and Fixed

### 🔴 CRITICAL VULNERABILITIES

#### 1. **Weak Password Hashing Algorithm (SHA-256)**
**Location:** `lib/auth.ts`
**Issue:** Using SHA-256 without salt is cryptographically weak and vulnerable to rainbow table attacks
**Risk:** HIGH - Password compromise in case of data breach
**Fix:** Implement bcrypt with proper salt rounds

#### 2. **XSS Vulnerability in Ad Banner**
**Location:** `components/ad-banner.tsx` (line 19-27)
**Issue:** Using `innerHTML` with user-provided `adScript` allows XSS attacks
```javascript
container.innerHTML = "" // Vulnerable to XSS
const fragment = document.createRange().createContextualFragment(adScript)
```
**Risk:** HIGH - Attacker can inject malicious JavaScript
**Fix:** Sanitize HTML with DOMPurify or remove HTML support entirely

#### 3. **Default Secrets in Code**
**Location:** `lib/auth.ts` (line 26)
**Issue:** Default fallback secret "craft-world-economy" if env vars not set
```javascript
return process.env.ADMIN_PASSWORD || process.env.CRON_SECRET || "craft-world-economy"
```
**Risk:** MEDIUM - Predictable secret compromise
**Fix:** Require environment variables, fail on startup if missing

#### 4. **Insufficient Password Validation**
**Location:** `app/api/admin/password/route.ts` (line 9-12)
**Issue:** Minimum 4 characters is too weak
**Risk:** MEDIUM - Easy password guessing
**Fix:** Enforce 12+ characters minimum, complexity requirements

#### 5. **Missing Rate Limiting on Auth Endpoints**
**Location:** `app/api/admin/login/route.ts`
**Issue:** No rate limiting on login attempts
**Risk:** MEDIUM - Brute force attacks possible
**Fix:** Implement rate limiting (e.g., 5 attempts per 15 min)

### 🟡 HIGH PRIORITY ISSUES

#### 6. **SQL Injection - Parameter Validation Missing**
**Location:** `lib/config-manager.ts`
**Issue:** While using parameterized queries (good), no validation on section name
**Fix:** Already validated, but add explicit whitelist check earlier

#### 7. **Timing Attack Vulnerability**
**Location:** `lib/auth.ts` - `verifyPassword()` function
**Issue:** String comparison is vulnerable to timing attacks
**Risk:** MEDIUM - Attacker can guess passwords through timing analysis
**Fix:** Use constant-time comparison

#### 8. **Inadequate Error Handling**
**Location:** Multiple API routes
**Issue:** Generic "Erro interno" hides actual errors, may expose stack traces in dev
**Fix:** Implement structured error logging with proper sanitization

#### 9. **Missing CSRF Protection**
**Location:** All PUT/POST routes
**Issue:** No CSRF token validation
**Risk:** MEDIUM - Cross-site request forgery possible
**Fix:** Implement CSRF tokens or rely on SameSite cookies

#### 10. **No Input Validation on Config Updates**
**Location:** `app/api/admin/config/[section]/route.ts`
**Issue:** Limited validation on config data before saving
**Fix:** Implement strict schema validation for each section

### 🟠 MEDIUM PRIORITY ISSUES

#### 11. **Unnecessary Code Duplication**
**Locations:** 
- `validatePassword()` vs `validateUserLogin()` in `lib/auth.ts` (similar logic)
- Alert history save logic duplicated across telegram.ts functions
**Fix:** Extract common logic into reusable functions

#### 12. **Missing Type Safety**
**Location:** `lib/config-manager.ts` (line 78, 94)
**Issue:** Using `as` type assertions without validation
```javascript
const history: AlertHistoryEntry[] = (config as Record<string, unknown>).alertHistory as AlertHistoryEntry[]
```
**Fix:** Use proper type guards or validation libraries (zod)

#### 13. **Deprecated Function Not Removed**
**Location:** `lib/auth.ts` line 99-101
**Issue:** `isAuthenticated()` marked deprecated but still in codebase
**Fix:** Remove deprecated function

#### 14. **Silent Error Handling**
**Location:** `components/ad-banner.tsx` (line 18-21)
**Issue:** Catch blocks silently fail
**Fix:** Add proper error logging

#### 15. **Weak Secret Generation**
**Location:** `lib/telegram.ts` line 81
**Issue:** Using `Math.random()` for ID generation
```javascript
id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
```
**Fix:** Use crypto.randomUUID() or similar

### 🔵 LOW PRIORITY ISSUES

#### 16. **Missing Loading States Handling**
**Location:** Components using `usePrices()`
**Issue:** Some components may not properly handle loading states
**Fix:** Add proper fallbacks and skeleton loading

#### 17. **Hard-coded API Headers**
**Location:** `lib/telegram.ts` line 8
**Issue:** API version hard-coded
**Fix:** Make configurable or add version negotiation

#### 18. **No Request Timeout**
**Location:** Various fetch calls
**Issue:** API calls may hang indefinitely
**Fix:** Implement timeout wrapper for fetch

---

## Summary Statistics
- **Critical Issues:** 5
- **High Priority:** 5  
- **Medium Priority:** 5
- **Low Priority:** 3
- **Total Issues:** 18

## Recommendations
1. Implement bcrypt immediately for password hashing
2. Sanitize/remove HTML from ad scripts
3. Add input validation library (zod/yup)
4. Implement rate limiting middleware
5. Set up security headers (CSP, X-Frame-Options, etc.)
6. Add request signing/CSRF tokens
7. Implement structured logging with error tracking

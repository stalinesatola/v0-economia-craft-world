import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

// Check tables
const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
console.log("Tables:", tables.map(t => t.table_name))

// Check app_config rows
const configs = await sql`SELECT key, length(value::text) as val_length FROM app_config`
console.log("Config sections:", configs)

// Check admin_users
const users = await sql`SELECT username, role, created_at FROM admin_users`
console.log("Admin users:", users)

// Quick test: simulate login flow
const adminPwd = process.env.ADMIN_PASSWORD
console.log("ADMIN_PASSWORD available:", !!adminPwd, "length:", adminPwd?.length)

// Test getConfig assembly
const allConfig = await sql`SELECT key, value FROM app_config`
const config = {}
for (const row of allConfig) {
  config[row.key] = row.value
}
console.log("Config keys:", Object.keys(config))
console.log("Has pools:", !!config.pools)
console.log("Has thresholds:", !!config.thresholds)

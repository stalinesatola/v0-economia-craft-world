import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function main() {
  // Check all config sections
  const rows = await sql`SELECT section, length(data::text) as data_len, updated_at FROM app_config ORDER BY section`
  console.log("=== Config Sections ===")
  for (const row of rows) {
    console.log(`  ${row.section}: ${row.data_len} chars, updated: ${row.updated_at}`)
  }

  // Check telegram specifically
  const telegram = await sql`SELECT data FROM app_config WHERE section = 'telegram'`
  console.log("\n=== Telegram Data ===")
  console.log(JSON.stringify(telegram[0]?.data, null, 2))

  // Check users
  const users = await sql`SELECT username, role, created_at FROM admin_users`
  console.log("\n=== Admin Users ===")
  for (const u of users) {
    console.log(`  ${u.username} (${u.role}) - ${u.created_at}`)
  }

  // Test write + read cycle
  console.log("\n=== Testing Write/Read ===")
  const testData = { botToken: "TEST_BOT_123", chatId: "-100999", enabled: true, intervalMinutes: 15 }
  await sql`UPDATE app_config SET data = ${JSON.stringify(testData)}::jsonb WHERE section = 'telegram'`
  
  const readBack = await sql`SELECT data FROM app_config WHERE section = 'telegram'`
  console.log("Written:", JSON.stringify(testData))
  console.log("Read back:", JSON.stringify(readBack[0]?.data))
  console.log("Match:", JSON.stringify(testData) === JSON.stringify(readBack[0]?.data))
  
  // Restore to empty defaults
  const defaults = { botToken: "", chatId: "", enabled: false, intervalMinutes: 30 }
  await sql`UPDATE app_config SET data = ${JSON.stringify(defaults)}::jsonb WHERE section = 'telegram'`
  console.log("Restored to defaults")
}

main().catch(console.error)

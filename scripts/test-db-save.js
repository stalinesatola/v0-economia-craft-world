import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function test() {
  // 1. Read current telegram config
  const before = await sql`SELECT data FROM app_config WHERE section = 'telegram'`
  console.log("BEFORE:", JSON.stringify(before[0]?.data))

  // 2. Write a test value
  const testData = JSON.stringify({
    botToken: "TEST_TOKEN_123",
    chatId: "-100TEST",
    enabled: true,
    intervalMinutes: 10,
    messageTemplate: "test"
  })
  await sql`
    INSERT INTO app_config (section, data)
    VALUES ('telegram', ${testData}::jsonb)
    ON CONFLICT (section) DO UPDATE SET data = ${testData}::jsonb
  `

  // 3. Read it back
  const after = await sql`SELECT data FROM app_config WHERE section = 'telegram'`
  console.log("AFTER:", JSON.stringify(after[0]?.data))

  // 4. Verify
  const saved = after[0]?.data
  if (saved?.botToken === "TEST_TOKEN_123" && saved?.chatId === "-100TEST" && saved?.enabled === true) {
    console.log("SUCCESS: Data persisted correctly!")
  } else {
    console.log("FAIL: Data did NOT persist correctly!")
    console.log("Expected botToken: TEST_TOKEN_123, got:", saved?.botToken)
  }

  // 5. Also check all sections
  const allSections = await sql`SELECT section FROM app_config ORDER BY section`
  console.log("All sections:", allSections.map(r => r.section).join(", "))
}

test().catch(e => console.error("Error:", e))

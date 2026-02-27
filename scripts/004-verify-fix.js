import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`SELECT section, substring(data::text, 1, 80) as preview FROM app_config ORDER BY section`;
console.log("Config sections:", rows.length);
for (const r of rows) {
  console.log(`  ${r.section}: ${r.preview}...`);
}

const users = await sql`SELECT id, username, role, substring(password_hash, 1, 20) as hash_preview FROM admin_users`;
console.log("\nUsers:", users.length);
for (const u of users) {
  console.log(`  ${u.username} (${u.role}) hash: ${u.hash_preview}...`);
}

const pw = process.env.ADMIN_PASSWORD
const db = process.env.DATABASE_URL
console.log("ADMIN_PASSWORD set:", !!pw, "length:", pw?.length, "preview:", pw ? pw.substring(0,3) + "..." + pw.substring(pw.length-3) : "NOT SET")
console.log("DATABASE_URL set:", !!db)

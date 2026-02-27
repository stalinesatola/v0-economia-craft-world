const adminPwd = process.env.ADMIN_PASSWORD
console.log("ADMIN_PASSWORD exists:", !!adminPwd)
console.log("ADMIN_PASSWORD length:", adminPwd?.length || 0)
console.log("ADMIN_PASSWORD value:", adminPwd ? adminPwd.substring(0, 3) + "***" + adminPwd.substring(adminPwd.length - 3) : "(not set)")
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)

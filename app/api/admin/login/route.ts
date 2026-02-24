import { NextRequest, NextResponse } from "next/server"
import { validatePassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password obrigatoria" }, { status: 400 })
    }

    const adminPwd = process.env.ADMIN_PASSWORD
    console.log("[v0] ADMIN_PASSWORD configured:", !!adminPwd)
    console.log("[v0] ADMIN_PASSWORD length:", adminPwd?.length ?? 0)
    console.log("[v0] Input password length:", password.length)
    console.log("[v0] Passwords match:", password === adminPwd)

    if (!validatePassword(password)) {
      return NextResponse.json({ error: "Password incorreta" }, { status: 401 })
    }

    await createSession()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

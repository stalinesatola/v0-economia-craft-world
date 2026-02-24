import { NextRequest, NextResponse } from "next/server"
import { validatePassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password obrigatoria" }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: "Password incorreta" }, { status: 401 })
    }

    await createSession()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { validatePassword, createSession } from "@/lib/auth"
import { getFullConfig } from "@/lib/config-manager"

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

    // Return config directly to avoid a second API call
    const config = getFullConfig()
    const safeConfig = {
      ...config,
      telegram: {
        ...config.telegram,
        botToken: config.telegram.botToken ? "****" + config.telegram.botToken.slice(-8) : "",
      },
    }

    return NextResponse.json({ success: true, config: safeConfig })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { getConfig } from "@/lib/config-manager"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  const auth = validateAdminRequest(request)
  if (!auth.valid) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { platform } = await request.json()
    const config = await getConfig()
    const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })

    if (platform === "twitter") {
      if (!config.sharing?.twitter?.enabled) {
        return NextResponse.json({ error: "Partilha X.com desativada" }, { status: 400 })
      }
      const { postTweet } = await import("@/lib/twitter")
      const text = `Craft World Economy - Teste\nPartilha automatica a funcionar!\n${now}\n#CraftWorld #Ronin`
      const result = await postTweet(text, config.sharing.twitter)
      return NextResponse.json(result)
    }

    if (platform === "telegram") {
      if (!config.sharing?.telegramChannels?.enabled) {
        return NextResponse.json({ error: "Partilha Telegram Canais desativada" }, { status: 400 })
      }
      const chatIds = config.sharing.telegramChannels.chatIds ?? []
      if (chatIds.length === 0) {
        return NextResponse.json({ error: "Nenhum canal configurado" }, { status: 400 })
      }

      const text = `<b>Craft World Economy - Teste</b>\nPartilha em canais a funcionar!\n${now}`
      const results = await Promise.all(
        chatIds.map(async (chatId) => {
          const res = await sendTelegramMessage(text, undefined, chatId)
          return { chatId, ...res }
        })
      )

      const allOk = results.every((r) => r.success)
      return NextResponse.json({
        success: allOk,
        message: allOk
          ? `Mensagem enviada para ${results.length} canal(is)`
          : `Enviado para ${results.filter(r => r.success).length}/${results.length} canais`,
        details: results,
      })
    }

    return NextResponse.json({ error: "Plataforma invalida" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

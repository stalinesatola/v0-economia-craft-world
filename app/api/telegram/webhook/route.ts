import { NextRequest, NextResponse } from "next/server"
import { handleBotCommand, sendTelegramMessage } from "@/lib/telegram"
import { getConfig } from "@/lib/config-manager"

export const dynamic = "force-dynamic"

// POST - Telegram webhook (receives messages from Telegram)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = body.message

    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const text = message.text.trim()
    const chatIdFromMessage = String(message.chat.id)

    // Only process commands (starting with /)
    if (!text.startsWith("/")) {
      return NextResponse.json({ ok: true })
    }

    console.log(`[v0] Telegram webhook received command: ${text} from chat: ${chatIdFromMessage}`)

    const config = await getConfig()
    const botToken = config.telegram?.botToken

    if (!botToken) {
      console.error("[v0] Bot token not configured")
      return NextResponse.json({ ok: true })
    }

    // Process the command and send response
    const responseText = await handleBotCommand(text, chatIdFromMessage, botToken)
    await sendTelegramMessage(responseText, botToken, chatIdFromMessage)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}

// GET - Setup webhook URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "setup") {
    try {
      const config = await getConfig()
      const botToken = config.telegram?.botToken

      if (!botToken) {
        return NextResponse.json({ success: false, message: "Bot token nao configurado" }, { status: 400 })
      }

      // Use the current host to build webhook URL
      const host = request.headers.get("host") || "localhost:3000"
      const protocol = host.includes("localhost") ? "http" : "https"
      const webhookUrl = `${protocol}://${host}/api/telegram/webhook`

      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
        }),
      })

      const data = await res.json()
      return NextResponse.json({
        success: data.ok,
        message: data.ok ? `Webhook configurado: ${webhookUrl}` : `Erro: ${data.description}`,
        webhookUrl,
      })
    } catch (error) {
      return NextResponse.json({ success: false, message: `Erro: ${error instanceof Error ? error.message : "Unknown"}` }, { status: 500 })
    }
  }

  if (action === "info") {
    try {
      const config = await getConfig()
      const botToken = config.telegram?.botToken
      if (!botToken) {
        return NextResponse.json({ success: false, message: "Bot token nao configurado" })
      }
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
      const data = await res.json()
      return NextResponse.json(data)
    } catch (error) {
      return NextResponse.json({ success: false, message: `Erro: ${error instanceof Error ? error.message : "Unknown"}` })
    }
  }

  if (action === "remove") {
    try {
      const config = await getConfig()
      const botToken = config.telegram?.botToken
      if (!botToken) {
        return NextResponse.json({ success: false, message: "Bot token nao configurado" })
      }
      const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`)
      const data = await res.json()
      return NextResponse.json({ success: data.ok, message: data.ok ? "Webhook removido" : data.description })
    } catch (error) {
      return NextResponse.json({ success: false, message: `Erro: ${error instanceof Error ? error.message : "Unknown"}` })
    }
  }

  return NextResponse.json({ message: "Use ?action=setup|info|remove" })
}

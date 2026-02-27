import { NextResponse } from "next/server"
import { getConfig } from "@/lib/config-manager"

export async function GET() {
  try {
    const config = getConfig()
    return NextResponse.json(config.customization ?? {
      headerLogo: "",
      headerText: "Craft World Economy",
      footerCredits: "",
      footerLinks: "",
      footerDisclaimer: "",
      loginTitle: "Seja Bem-vindo",
      loginCredits: "",
    })
  } catch {
    return NextResponse.json({})
  }
}

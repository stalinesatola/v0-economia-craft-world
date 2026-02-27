import { NextResponse } from "next/server"
import { getConfigSection } from "@/lib/config-manager"

export async function GET() {
  try {
    const customization = await getConfigSection("customization")
    return NextResponse.json(customization ?? {
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

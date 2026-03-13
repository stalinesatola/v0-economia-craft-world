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
      primaryColor: "",
      accentColor: "",
      backgroundColor: "",
      modules: { showOpportunities: true, showStats: true, showBanners: true, showChain: true },
      template: "default",
      footerSocialLinks: { github: "", telegram: "", twitter: "" },
      footerBannerAd: { enabled: false, imageUrl: "", linkUrl: "", altText: "Advertisement" },
    })
  } catch {
    return NextResponse.json({})
  }
}

import { createHmac, randomBytes } from "crypto"

interface TwitterConfig {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessSecret: string
}

// OAuth 1.0a signature for Twitter API v2
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join("&")
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  return createHmac("sha1", signingKey).update(baseString).digest("base64")
}

function generateOAuthHeader(
  method: string,
  url: string,
  config: TwitterConfig
): string {
  const nonce = randomBytes(16).toString("hex")
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  }

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    config.apiSecret,
    config.accessSecret
  )

  oauthParams.oauth_signature = signature

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(", ")

  return `OAuth ${headerParts}`
}

export async function postTweet(
  text: string,
  config: TwitterConfig
): Promise<{ success: boolean; message: string; tweetId?: string }> {
  if (!config.apiKey || !config.apiSecret || !config.accessToken || !config.accessSecret) {
    return { success: false, message: "Credenciais Twitter/X.com nao configuradas" }
  }

  const url = "https://api.twitter.com/2/tweets"
  const authHeader = generateOAuthHeader("POST", url, config)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        message: `Twitter API error: ${data.detail || data.title || JSON.stringify(data.errors) || res.status}`,
      }
    }

    return {
      success: true,
      message: "Tweet publicado com sucesso",
      tweetId: data.data?.id,
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro de rede: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

import { cookies } from "next/headers"
import { SignJWT } from "jose"

const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID!
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/gh-callback`
const SCOPE = "read:user read:org repo"

export async function GET() {
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // Generate state parameter
  const state = generateRandomString(32)
  
  // Store PKCE and state in secure httpOnly cookie
  const cookieStore = await cookies()
  const pkceData = { codeVerifier, state, timestamp: Date.now() }
  const pkceToken = await new SignJWT(pkceData)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!))
  
  cookieStore.set("nextauth.pkce", pkceToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })
  
  // Build GitHub OAuth URL
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    allow_signup: "true",
  })
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`
  
  // Return HTML page with JavaScript redirect (avoids Vercel edge redirect following)
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting to GitHub...</title>
  <meta http-equiv="refresh" content="0;url=${githubAuthUrl}">
</head>
<body>
  <p>Redirecting to GitHub for authentication...</p>
  <script>window.location.href = "${githubAuthUrl}";</script>
</body>
</html>`
  
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join("")
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64urlEncode(new Uint8Array(digest))
}

function base64urlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}
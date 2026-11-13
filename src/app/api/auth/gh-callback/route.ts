import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"

const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID!
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_SECRET!
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/gh-callback`

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  
  const errorUrl = `${process.env.NEXTAUTH_URL}/?error=`
  const successUrl = `${process.env.NEXTAUTH_URL}/`
  
  if (error) {
    return htmlRedirect(`${errorUrl}${error}`)
  }
  
  if (!code || !state) {
    return htmlRedirect(`${errorUrl}missing_params`)
  }
  
  // Verify PKCE and state from cookie
  const cookieStore = await cookies()
  const pkceToken = cookieStore.get("nextauth.pkce")?.value
  
  if (!pkceToken) {
    return htmlRedirect(`${errorUrl}missing_pkce`)
  }
  
  let pkceData: { codeVerifier: string; state: string; timestamp: number }
  try {
    const { payload } = await jwtVerify(
      pkceToken,
      new TextEncoder().encode(process.env.AUTH_SECRET!)
    )
    pkceData = payload as any
  } catch {
    return htmlRedirect(`${errorUrl}invalid_pkce`)
  }
  
  // Verify state matches
  if (pkceData.state !== state) {
    return htmlRedirect(`${errorUrl}state_mismatch`)
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: pkceData.codeVerifier,
    }),
  })
  
  const tokenData = await tokenResponse.json()
  
  if (tokenData.error) {
    return htmlRedirect(`${errorUrl}token_exchange_failed`)
  }
  
  const accessToken = tokenData.access_token
  
  // Fetch user info from GitHub
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  })
  
  const user = await userResponse.json()
  
  if (!user.login) {
    return htmlRedirect(`${errorUrl}user_fetch_failed`)
  }
  
  // Create session token
  const sessionToken = await new SignJWT({
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      image: user.avatar_url,
      login: user.login,
    },
    accessToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!))
  
  // Clear PKCE cookie and set session cookie via Set-Cookie headers
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signing in...</title>
  <meta http-equiv="refresh" content="0;url=${successUrl}">
</head>
<body>
  <p>Signing in...</p>
  <script>window.location.href = "${successUrl}";</script>
</body>
</html>`
  
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": [
        `nextauth.pkce=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        `nextauth.session-token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
      ].join(", "),
    },
  })
}

function htmlRedirect(url: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.href = "${url}";</script>
</body>
</html>`
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
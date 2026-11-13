import { cookies } from "next/headers"

export async function POST(request: Request) {
  const url = new URL(request.url)
  const callbackUrl = url.searchParams.get("callbackUrl") || process.env.NEXTAUTH_URL || "/"
  
  const cookieStore = await cookies()
  cookieStore.delete("nextauth.session-token")
  cookieStore.delete("nextauth.pkce")
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signing out...</title>
  <meta http-equiv="refresh" content="0;url=${callbackUrl}">
</head>
<body>
  <p>Signing out...</p>
  <script>window.location.href = "${callbackUrl}";</script>
</body>
</html>`
  
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const callbackUrl = url.searchParams.get("callbackUrl") || process.env.NEXTAUTH_URL || "/"
  
  const cookieStore = await cookies()
  cookieStore.delete("nextauth.session-token")
  cookieStore.delete("nextauth.pkce")
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signing out...</title>
  <meta http-equiv="refresh" content="0;url=${callbackUrl}">
</head>
<body>
  <p>Signing out...</p>
  <script>window.location.href = "${callbackUrl}";</script>
</body>
</html>`
  
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export async function auth(): Promise<{ accessToken?: string; user?: any } | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("nextauth.session-token")?.value
  
  if (!sessionToken) {
    return null
  }
  
  try {
    const { payload } = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(process.env.AUTH_SECRET!)
    )
    return payload as any
  } catch {
    return null
  }
}

// Provider configuration for reference
export const providers = [
  {
    id: "github",
    name: "GitHub",
    type: "oauth",
    signinUrl: "/api/auth/signin/github",
    callbackUrl: "/api/auth/callback/github",
  },
]
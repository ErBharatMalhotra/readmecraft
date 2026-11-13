import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export async function GET() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("nextauth.session-token")?.value
  
  if (!sessionToken) {
    return Response.json(null)
  }
  
  try {
    const { payload } = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(process.env.AUTH_SECRET!)
    )
    return Response.json(payload)
  } catch {
    return Response.json(null)
  }
}
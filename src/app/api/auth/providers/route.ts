export async function GET() {
  return Response.json({
    github: {
      id: "github",
      name: "GitHub",
      type: "oauth",
      signinUrl: "/api/auth/signin/github",
      callbackUrl: "/api/auth/gh-callback",
    },
  })
}
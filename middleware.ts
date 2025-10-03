export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/orchestration/:path*",
    "/api/audit/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/api/admin/:path*",
    "/api/account/:path*",
  ],
}

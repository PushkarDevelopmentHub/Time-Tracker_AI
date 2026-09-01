export { default } from "next-auth/middleware";

// Protects every page except /login itself and NextAuth's own API routes.
// Without this, an unauthenticated visit (e.g. incognito) can still render
// pages like /dashboard, whose fetch calls then fail with 401 and crash
// the page trying to read data that was never returned.
export const config = {
  matcher: [
    "/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/constants/config";
const protectedPrefixes = [
  "/dashboard",
  "/listings",
  "/appointments",
  "/notifications",
  "/analytics",
  "/admin",
  "/profile",
];
/** The cookie gates navigation only. The API verifies identity and ownership. */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    protectedPrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    ) &&
    !request.cookies.has(AUTH_COOKIE_NAME)
  ) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp|woff2)$).*)",
  ],
};

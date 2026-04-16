import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Edge-safe: only checks for session-cookie presence.
// Role enforcement happens in /operator and /rider layouts (server components).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname === "/rider" ||
    pathname.startsWith("/rider/") ||
    pathname === "/operator" ||
    pathname.startsWith("/operator/");

  if (!needsAuth) return NextResponse.next();

  const cookie = getSessionCookie(req, { cookiePrefix: "indek" });
  if (cookie) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/operator/:path*", "/rider/:path*"],
};

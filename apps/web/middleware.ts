import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Edge-safe: only checks for session-cookie presence.
// Role enforcement happens in /operator and /rider layouts (server components).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname === "/merchant" ||
    pathname.startsWith("/merchant/") ||
    pathname === "/rider" ||
    pathname.startsWith("/rider/") ||
    pathname === "/operator" ||
    pathname.startsWith("/operator/");

  if (!needsAuth) return NextResponse.next();

  const cookie = getSessionCookie(req, { cookiePrefix: "indek" });
  if (cookie) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (pathname.startsWith("/merchant")) {
    url.pathname = "/sign-in/merchant";
  } else if (pathname.startsWith("/rider")) {
    url.pathname = "/sign-in/rider";
  } else {
    url.pathname = "/sign-in/operator";
  }
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/merchant/:path*", "/operator/:path*", "/rider/:path*"],
};

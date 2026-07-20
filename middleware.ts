import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo";

const ANALYTICS_CONTROL_PARAM = "_vaw";
const ANALYTICS_OPTOUT_COOKIE = "_va_ignore";
const ANALYTICS_OPTOUT_TOKEN = "14222395ae64e5837db1794d545dc8c36894a8c3e5213747";
const ANALYTICS_OPTIN_TOKEN = "17c86ae461cbe4fca0c4db69395784d5ab3609da073fa7b1";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host.endsWith(".vercel.app")) {
    const siteUrl = new URL(getSiteUrl());
    const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl);

    if (destination.host !== host) {
      return NextResponse.redirect(destination, 308);
    }
  }

  const analyticsControl = request.nextUrl.searchParams.get(ANALYTICS_CONTROL_PARAM);
  if (
    analyticsControl === ANALYTICS_OPTOUT_TOKEN ||
    analyticsControl === ANALYTICS_OPTIN_TOKEN
  ) {
    const destination = request.nextUrl.clone();
    destination.searchParams.delete(ANALYTICS_CONTROL_PARAM);

    const response = NextResponse.redirect(destination, 307);
    response.cookies.set(
      ANALYTICS_OPTOUT_COOKIE,
      analyticsControl === ANALYTICS_OPTOUT_TOKEN ? "1" : "",
      {
        httpOnly: false,
        maxAge: analyticsControl === ANALYTICS_OPTOUT_TOKEN ? 60 * 60 * 24 * 365 : 0,
        path: "/",
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      },
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

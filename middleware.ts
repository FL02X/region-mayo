import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (!host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const siteUrl = new URL(getSiteUrl());
  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl);

  if (destination.host === host) {
    return NextResponse.next();
  }

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: ["/:path*"],
};

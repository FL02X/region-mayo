"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const ANALYTICS_OPTOUT_COOKIE = "_va_ignore=1";

function discardOptedOutEvents(event: BeforeSendEvent) {
  const optedOut = document.cookie
    .split(";")
    .some((cookie) => cookie.trim() === ANALYTICS_OPTOUT_COOKIE);

  return optedOut ? null : event;
}

export function VercelAnalytics() {
  return <Analytics beforeSend={discardOptedOutEvents} />;
}

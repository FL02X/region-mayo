import { cookies, headers } from "next/headers";

type ViewMode = "grid" | "compact";

const normalizeCookieValue = (value?: string) => {
  if (!value) return undefined;
  return decodeURIComponent(value);
};

const parseCookieHeader = (cookieHeader: string, name: string) => {
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith(`${name}=`)) {
      return normalizeCookieValue(trimmed.slice(name.length + 1));
    }
  }

  return undefined;
};

export async function readCookieValue(name: string) {
  const cookieStore = await cookies();
  const getFn = (cookieStore as { get?: (key: string) => { value?: string } | undefined }).get;

  if (typeof getFn === "function") {
    return normalizeCookieValue(getFn.call(cookieStore, name)?.value);
  }

  const headerStore = await headers();
  return parseCookieHeader(headerStore.get("cookie") ?? "", name);
}

const MOBILE_USER_AGENT_PATTERN =
  /Android|BlackBerry|iPhone|iPod|IEMobile|Mobile|Opera Mini|webOS/i;

export async function readInitialViewMode(name: string): Promise<ViewMode> {
  const cookieValue = await readCookieValue(name);
  if (cookieValue === "grid" || cookieValue === "compact") {
    return cookieValue;
  }

  const headerStore = await headers();
  const clientHintMobile = headerStore.get("sec-ch-ua-mobile");
  if (clientHintMobile === "?1") return "compact";
  if (clientHintMobile === "?0") return "grid";

  return MOBILE_USER_AGENT_PATTERN.test(headerStore.get("user-agent") ?? "")
    ? "compact"
    : "grid";
}

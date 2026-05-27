import { cookies, headers } from "next/headers";

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

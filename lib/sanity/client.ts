type SanityEnv = {
  projectId: string
  dataset: string
  apiVersion: string
  token?: string
}

export const SANITY_CACHE_TAG = "sanity"

function getSanityEnv(): SanityEnv {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const apiVersion = process.env.SANITY_API_VERSION ?? "2024-01-01"
  const token = process.env.SANITY_READ_TOKEN

  if (!projectId) {
    throw new Error("Missing env var SANITY_PROJECT_ID")
  }
  if (!dataset) {
    throw new Error("Missing env var SANITY_DATASET")
  }

  return {
    projectId,
    dataset,
    apiVersion,
    token: token || undefined,
  }
}

type SanityQueryClient = {
  fetch<T = any>(query: string, params?: Record<string, unknown>): Promise<T>
}

let cachedClient: SanityQueryClient | null = null

export function isSanityNetworkError(error: unknown): boolean {
  let current: unknown = error

  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) {
      const name = current.name.toLowerCase()
      const message = current.message.toLowerCase()
      if (
        name.includes("abort") ||
        name.includes("timeout") ||
        message.includes("fetch failed") ||
        message.includes("connect timeout") ||
        message.includes("network") ||
        message.includes("enotfound") ||
        message.includes("eai_again") ||
        message.includes("econnrefused") ||
        message.includes("etimedout") ||
        message.includes("econnreset")
      ) {
        return true
      }
    }

    if (typeof current === "object" && current !== null) {
      const code = "code" in current ? String(current.code).toLowerCase() : ""
      if (
        code.includes("und_err") ||
        code.includes("enotfound") ||
        code.includes("eai_again") ||
        code.includes("econnrefused") ||
        code.includes("etimedout") ||
        code.includes("econnreset")
      ) {
        return true
      }

      current = "cause" in current ? current.cause : null
      continue
    }

    break
  }

  return false
}

export function getSanityClient() {
  if (cachedClient) return cachedClient
  const env = getSanityEnv()

  cachedClient = {
    async fetch<T = any>(query: string, params?: Record<string, unknown>): Promise<T> {
      const url = `https://${env.projectId}.api.sanity.io/v${env.apiVersion}/data/query/${encodeURIComponent(
        env.dataset,
      )}`

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (env.token) {
        headers.Authorization = `Bearer ${env.token}`
      }

      const cacheOptions: RequestInit =
        process.env.NODE_ENV === "development"
          ? { cache: "no-store" }
          : ({
              cache: "force-cache",
              next: {
                tags: [SANITY_CACHE_TAG],
              },
            } as RequestInit)

      const devTimeoutMs = Number(process.env.SANITY_DEV_FETCH_TIMEOUT_MS ?? 2000)
      const signal =
        process.env.NODE_ENV === "development" && Number.isFinite(devTimeoutMs) && devTimeoutMs > 0
          ? AbortSignal.timeout(devTimeoutMs)
          : undefined

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, params: params ?? {} }),
        signal,
        ...cacheOptions,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Sanity query failed (${res.status}): ${text}`)
      }

      const json = (await res.json()) as { result: T }
      return json.result
    },
  }

  return cachedClient
}

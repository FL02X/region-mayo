type SanityEnv = {
  projectId: string
  dataset: string
  apiVersion: string
  useCdn: boolean
  token?: string
}

function getSanityEnv(): SanityEnv {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const apiVersion = process.env.SANITY_API_VERSION ?? "2024-01-01"
  const useCdn = process.env.SANITY_USE_CDN !== "false"
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
    useCdn,
    token: token || undefined,
  }
}

type SanityQueryClient = {
  fetch<T = any>(query: string, params?: Record<string, unknown>): Promise<T>
}

let cachedClient: SanityQueryClient | null = null

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

      // Sanity caches published queries on the edge; for draft/preview you need a token.
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, params: params ?? {} }),
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


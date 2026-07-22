type SanityWriteEnv = {
  projectId: string
  dataset: string
  apiVersion: string
  token: string
}

type SanityAssetUploadResult = {
  _id: string
  url?: string
}

function getSanityWriteEnv(): SanityWriteEnv {
  const projectId =
    process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset =
    process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET
  const apiVersion = process.env.SANITY_API_VERSION ?? '2025-01-01'
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

  if (!projectId || !dataset || !token) {
    throw new Error('Missing Sanity write configuration')
  }

  return { projectId, dataset, apiVersion, token }
}

function getSanityReadEnv() {
  const projectId =
    process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset =
    process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET
  const apiVersion = process.env.SANITY_API_VERSION ?? '2025-01-01'
  const token =
    process.env.SANITY_WRITE_TOKEN ||
    process.env.SANITY_API_TOKEN ||
    process.env.SANITY_READ_TOKEN

  if (!projectId || !dataset) {
    throw new Error('Missing Sanity configuration')
  }

  return { projectId, dataset, apiVersion, token }
}

export function hasSanityWriteConfig(): boolean {
  return Boolean(
    (process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) &&
      (process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET) &&
      (process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN),
  )
}

export async function sanityQueryNoStore<T = any>(
  query: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const env = getSanityReadEnv()
  const url = `https://${env.projectId}.api.sanity.io/v${env.apiVersion}/data/query/${encodeURIComponent(
    env.dataset,
  )}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (env.token) {
    headers.Authorization = `Bearer ${env.token}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, params: params ?? {} }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Sanity query failed (${response.status}): ${text}`)
  }

  const json = (await response.json()) as { result: T }
  return json.result
}

export async function sanityMutate(
  mutations: Array<Record<string, unknown>>,
): Promise<unknown> {
  const env = getSanityWriteEnv()
  const url = `https://${env.projectId}.api.sanity.io/v${env.apiVersion}/data/mutate/${encodeURIComponent(
    env.dataset,
  )}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.token}`,
    },
    body: JSON.stringify({ mutations }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Sanity mutation failed (${response.status}): ${text}`)
  }

  return response.json()
}

export async function uploadSanityImageAsset(
  file: File,
  filename: string,
): Promise<SanityAssetUploadResult> {
  const env = getSanityWriteEnv()
  const url = new URL(
    `https://${env.projectId}.api.sanity.io/v${env.apiVersion}/assets/images/${encodeURIComponent(
      env.dataset,
    )}`,
  )
  url.searchParams.set('filename', filename)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': file.type,
    },
    body: await file.arrayBuffer(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Sanity asset upload failed (${response.status}): ${text}`)
  }

  const json = await response.json()
  const document = json.document ?? json

  if (!document?._id) {
    throw new Error('Sanity asset upload did not return an asset id')
  }

  return {
    _id: document._id,
    url: document.url,
  }
}

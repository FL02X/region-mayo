const PLACEHOLDER_IMAGE = "/placeholder.svg"

interface SanityImageVariantOptions {
  width?: number
  height?: number
  quality?: number
  format?: "webp" | "jpg" | "png" | "avif"
  fit?: "crop" | "clip" | "fill" | "max" | "min"
}

/**
 * Converts Sanity "image" field values into a usable URL for `next/image`.
 *
 * This expects GROQ to fetch image asset URLs, e.g.:
 * `image{asset->{url}}` or `photos[]{asset->{url}}`.
 */
export function sanityImageUrl(source: any): string {
  if (typeof source === "string" && source.length > 0) return source
  const url = source?.asset?.url
  if (typeof url === "string" && url.length > 0) return url
  // If GROQ didn't include asset url for some reason, keep the UI stable.
  return PLACEHOLDER_IMAGE
}

export function sanityImageVariantUrl(
  source: any,
  options: SanityImageVariantOptions = {},
): string {
  const url = sanityImageUrl(source)
  if (url === PLACEHOLDER_IMAGE) return url

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return url
  }

  if (options.width) parsedUrl.searchParams.set("w", String(options.width))
  if (options.height) parsedUrl.searchParams.set("h", String(options.height))
  if (options.quality) parsedUrl.searchParams.set("q", String(options.quality))
  if (options.format) parsedUrl.searchParams.set("fm", options.format)
  if (options.fit) parsedUrl.searchParams.set("fit", options.fit)

  return parsedUrl.toString()
}

export function sanityImagesUrls(sources: Array<any> | undefined | null): string[] {
  if (!sources || sources.length === 0) return []
  return sources
    .map((s) => sanityImageUrl(s))
    .filter((u) => typeof u === "string" && u.length > 0)
}

const PLACEHOLDER_IMAGE = "/placeholder.svg"

/**
 * Converts Sanity "image" field values into a usable URL for `next/image`.
 *
 * This expects GROQ to fetch image asset URLs, e.g.:
 * `image{asset->{url}}` or `photos[]{asset->{url}}`.
 */
export function sanityImageUrl(source: any): string {
  const url = source?.asset?.url
  if (typeof url === "string" && url.length > 0) return url
  // If GROQ didn't include asset url for some reason, keep the UI stable.
  return PLACEHOLDER_IMAGE
}

export function sanityImagesUrls(sources: Array<any> | undefined | null): string[] {
  if (!sources || sources.length === 0) return []
  return sources
    .map((s) => sanityImageUrl(s))
    .filter((u) => typeof u === "string" && u.length > 0)
}


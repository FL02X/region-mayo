import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { SANITY_CACHE_TAG } from "@/sanity/lib/client";
import { sanityQueryNoStore } from "@/sanity/lib/write-client";

// Secret token to verify webhook requests from Sanity
const REVALIDATION_TOKEN = process.env.SANITY_REVALIDATION_TOKEN;
const ALL_CONTENT_PATHS = [
  "/",
  "/coros",
  "/templos",
  "/directiva",
  "/directiva-dorcas",
  "/directiva-varones",
  "/pastores",
  "/album",
  "/album/galerias",
  "/album/grabaciones",
  "/buscar",
];

function getDocumentType(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const payload = body as Record<string, unknown>;
  const candidate =
    payload._type ??
    payload.type ??
    payload.documentType ??
    (payload.document && typeof payload.document === "object"
      ? (payload.document as Record<string, unknown>)._type
      : undefined);

  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : undefined;
}

function getStringPath(value: unknown, path: string[]): string | undefined {
  let current = value;

  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" && current.length > 0 ? current : undefined;
}

function getAlbumSlug(body: unknown): string | undefined {
  const paths = [
    ["slug", "current"],
    ["document", "slug", "current"],
    ["albumSlug"],
    ["document", "albumSlug"],
    ["album", "slug", "current"],
    ["document", "album", "slug", "current"],
  ];

  for (const path of paths) {
    const slug = getStringPath(body, path);
    if (slug) return slug;
  }

  return undefined;
}

function getDocumentId(body: unknown): string | undefined {
  return (
    getStringPath(body, ["_id"]) ||
    getStringPath(body, ["document", "_id"]) ||
    getStringPath(body, ["id"]) ||
    getStringPath(body, ["documentId"])
  );
}

async function getAlbumSlugFromPhotoSubmission(body: unknown): Promise<string | undefined> {
  const rawId = getDocumentId(body);
  if (!rawId) return undefined;

  const id = rawId.replace(/^drafts\./, "");

  try {
    const slug = await sanityQueryNoStore<string | null>(
      `*[
        _type == "albumPhotoSubmission" &&
        _id in [$id, "drafts." + $id]
      ][0].album->slug.current`,
      { id },
    );

    return slug || undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  // Verify the revalidation token
  const token = request.headers.get("x-sanity-token");

  if (!REVALIDATION_TOKEN) {
    console.warn(
      "⚠️  SANITY_REVALIDATION_TOKEN not set. Webhooks will not be verified."
    );
  }

  if (REVALIDATION_TOKEN && token !== REVALIDATION_TOKEN) {
    return NextResponse.json(
      { message: "Invalid token" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const _type = getDocumentType(body);

    // Map Sanity document types to paths that need revalidation
    const pathsToRevalidate: string[] = [];
    const tagsToRevalidate: string[] = [SANITY_CACHE_TAG];

    // Add document type as a tag
    if (_type) {
      tagsToRevalidate.push(_type);
    }

    // Map specific document types to routes
    switch (_type) {
      case "album": {
        const albumSlug = getAlbumSlug(body);
        pathsToRevalidate.push("/album");
        pathsToRevalidate.push("/album/galerias");
        pathsToRevalidate.push("/album/grabaciones");
        if (albumSlug) pathsToRevalidate.push(`/album/${albumSlug}`);
        if (albumSlug) pathsToRevalidate.push(`/album/galerias/${albumSlug}`);
        if (albumSlug) pathsToRevalidate.push(`/album/grabaciones/${albumSlug}`);
        tagsToRevalidate.push("album");
        break;
      }
      case "albumPhotoSubmission": {
        const albumSlug = getAlbumSlug(body) || (await getAlbumSlugFromPhotoSubmission(body));
        pathsToRevalidate.push("/album");
        pathsToRevalidate.push("/album/galerias");
        pathsToRevalidate.push("/album/grabaciones");
        if (albumSlug) pathsToRevalidate.push(`/album/${albumSlug}`);
        if (albumSlug) pathsToRevalidate.push(`/album/galerias/${albumSlug}`);
        if (albumSlug) pathsToRevalidate.push(`/album/grabaciones/${albumSlug}`);
        tagsToRevalidate.push("album", "albumPhotoSubmission");
        break;
      }
      case "event":
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/album");
        pathsToRevalidate.push("/album/galerias");
        pathsToRevalidate.push("/album/grabaciones");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("events");
        break;
      case "coro":
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/coros");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("coros");
        break;
      case "templo":
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/templos");
        pathsToRevalidate.push("/pastores");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("templos");
        break;
      case "pastor":
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/pastores");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("pastors");
        break;
      case "directiva":
      case "directivaGeneration":
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/directiva");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("directiva");
        break;
      case "directivaDorcasGeneration":
        pathsToRevalidate.push("/directiva-dorcas");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("directiva-dorcas");
        break;
      case "directivaVaronesGeneration":
        pathsToRevalidate.push("/directiva-varones");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("directiva-varones");
        break;
      case "heroCard":
      case "prayerWall":
      case "socialPostCache":
        pathsToRevalidate.push("/");
        tagsToRevalidate.push(_type);
        break;
      case "prayer":
        pathsToRevalidate.push("/");
        tagsToRevalidate.push("prayerWall", "prayers");
        break;
      case "region":
      case "siteSettings":
        // Revalidate all main pages when region or site settings change
        pathsToRevalidate.push(...ALL_CONTENT_PATHS);
        tagsToRevalidate.push("region", "siteSettings");
        break;
      default:
        // Unknown or custom Sanity document types can feed shared sections.
        pathsToRevalidate.push(...ALL_CONTENT_PATHS);
    }

    // Revalidate paths
    const uniquePaths = Array.from(new Set(pathsToRevalidate));
    const uniqueTags = Array.from(new Set(tagsToRevalidate));

    for (const path of uniquePaths) {
      await revalidatePath(path);
      console.log(`✅ Revalidated path: ${path}`);
    }

    // Revalidate tags
    for (const tag of uniqueTags) {
      await revalidateTag(tag, { expire: 0 });
      console.log(`✅ Revalidated tag: ${tag}`);
    }

    return NextResponse.json(
      {
        revalidated: true,
        documentType: _type ?? null,
        paths: uniquePaths,
        tags: uniqueTags,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Revalidation error:", err);
    return NextResponse.json(
      { message: "Error revalidating", error: String(err) },
      { status: 500 }
    );
  }
}

// Allow only POST requests
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}

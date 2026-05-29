import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { SANITY_CACHE_TAG } from "@/lib/sanity/client";

// Secret token to verify webhook requests from Sanity
const REVALIDATION_TOKEN = process.env.SANITY_REVALIDATION_TOKEN;
const ALL_CONTENT_PATHS = [
  "/",
  "/coros",
  "/templos",
  "/directiva",
  "/pastores",
  "/album",
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
      case "event":
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/album");
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
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/directiva");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("directiva");
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

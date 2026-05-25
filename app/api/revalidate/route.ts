import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Secret token to verify webhook requests from Sanity
const REVALIDATION_TOKEN = process.env.SANITY_REVALIDATION_TOKEN;

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
    const body = await request.json();
    const { _type, operation = "publish" } = body;

    // Map Sanity document types to paths that need revalidation
    const pathsToRevalidate: string[] = [];
    const tagsToRevalidate: string[] = [];

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
      case "region":
      case "siteSettings":
        // Revalidate all main pages when region or site settings change
        pathsToRevalidate.push("/");
        pathsToRevalidate.push("/coros");
        pathsToRevalidate.push("/templos");
        pathsToRevalidate.push("/directiva");
        pathsToRevalidate.push("/pastores");
        pathsToRevalidate.push("/album");
        pathsToRevalidate.push("/buscar");
        tagsToRevalidate.push("region", "siteSettings");
        break;
      default:
        // For unknown types, just revalidate the homepage
        pathsToRevalidate.push("/");
    }

    // Revalidate paths
    for (const path of pathsToRevalidate) {
      await revalidatePath(path);
      console.log(`✅ Revalidated path: ${path}`);
    }

    // Revalidate tags
    for (const tag of tagsToRevalidate) {
      await revalidateTag(tag);
      console.log(`✅ Revalidated tag: ${tag}`);
    }

    return NextResponse.json(
      {
        revalidated: true,
        paths: pathsToRevalidate,
        tags: tagsToRevalidate,
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

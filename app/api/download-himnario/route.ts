import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// Simple in-memory rate limiter (restart with cada deploy)
// Para producción, considera Redis
const downloadLimiter = new Map<
  string,
  { timestamp: number; count: number }
>();

const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 horas en ms
const RATE_LIMIT_MAX = 10; // 1 descarga por IP cada 24 horas

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0].trim() : "unknown") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = downloadLimiter.get(ip);

  if (!record) {
    downloadLimiter.set(ip, { timestamp: now, count: 1 });
    return false;
  }

  const timeSinceFirst = now - record.timestamp;

  if (timeSinceFirst > RATE_LIMIT_WINDOW) {
    // Ventana de 24h expiró, reiniciar
    downloadLimiter.set(ip, { timestamp: now, count: 1 });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true; // Rate limited
  }

  record.count++;
  return false;
}

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  // Log download attempt
  console.log(`[DOWNLOAD] IP: ${clientIp}, UA: ${userAgent}, Time: ${new Date().toISOString()}`);

  // Rate limit check
  if (isRateLimited(clientIp)) {
    console.warn(`[RATE_LIMIT] IP: ${clientIp} exceeded limit`);
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "HIMNARIO MENSAJEROS DEL GRAN REY.pdf"
    );

    const fileBuffer = await readFile(filePath);

    // Log successful download
    console.log(`[DOWNLOAD_SUCCESS] IP: ${clientIp}`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="HIMNARIO MENSAJEROS DEL GRAN REY.pdf"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error(`[DOWNLOAD_ERROR] IP: ${clientIp}, Error:`, error);
    return new NextResponse("File not found or error reading file", {
      status: 500,
    });
  }
}

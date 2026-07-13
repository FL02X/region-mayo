import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { SANITY_CACHE_TAG } from "@/lib/sanity/client"
import { refreshProductStockAvailabilityCache } from "@/lib/product-order-sheets"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    const result = await refreshProductStockAvailabilityCache()
    if (result.changed > 0) await revalidateTag(SANITY_CACHE_TAG, { expire: 0 })
    return NextResponse.json({ success: true, products: result.availability.length, changed: result.changed })
  } catch (error) {
    console.error("[product-stock-cron]", error)
    return NextResponse.json({ error: "No se pudieron actualizar las existencias." }, { status: 500 })
  }
}

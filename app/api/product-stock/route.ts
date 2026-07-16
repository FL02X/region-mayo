import { NextRequest, NextResponse } from "next/server"
import { getProductStockAvailability } from "@/lib/product-order-sheets"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter((id: unknown): id is string => typeof id === "string" && id.length <= 200)
      : []
    const orderIds = Array.isArray(body.orderIds)
      ? body.orderIds.filter((id: unknown): id is string => typeof id === "string" && id.length <= 100)
      : []
    const products = await getProductStockAvailability(productIds, orderIds)
    return NextResponse.json({ products })
  } catch (error) {
    console.error("[product-stock]", error)
    return NextResponse.json({ error: "No se pudo consultar las existencias." }, { status: 500 })
  }
}

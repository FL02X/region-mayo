import { NextRequest, NextResponse } from "next/server"
import { createProductOrder } from "@/lib/product-order-sheets"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createProductOrder({
      productId: String(body.productId ?? ""),
      name: body.name,
      phone: body.phone,
      paymentType: body.paymentType,
      variantId: typeof body.variantId === "string" ? body.variantId : null,
      size: typeof body.size === "string" ? body.size : null,
      quantity: Number(body.quantity),
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el pedido."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

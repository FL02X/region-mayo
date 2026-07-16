export const RECORRIDO_ORDERS_STORAGE_KEY = "recorrido-product-orders"

export type StoredProductOrder = {
  id: string
  productId: string
  customerName: string
  variantId?: string
  variantName?: string
  size?: string
  paymentType: "deposit" | "full"
  paymentAmount: number
  quantity: number
  createdAt?: string
}

export function isAcceptedPaymentStatus(value: unknown) {
  const status = String(value ?? "").trim().toUpperCase()
  return status === "ANTICIPO RECIBIDO"
    || status === "PAGO COMPLETO"
    || status === "PAGADO"
    || status === "PAGADO COMPLETO"
}

export function isCancellablePaymentStatus(value: unknown) {
  return String(value ?? "").trim().toUpperCase() !== "CANCELADO"
    && !isAcceptedPaymentStatus(value)
}

function isStoredProductOrder(value: unknown): value is StoredProductOrder {
  if (!value || typeof value !== "object") return false
  const order = value as Partial<StoredProductOrder>
  return typeof order.id === "string"
    && order.id.length > 0
    && order.id.length <= 100
    && typeof order.productId === "string"
    && order.productId.length > 0
    && order.productId.length <= 200
    && typeof order.customerName === "string"
    && order.customerName.length <= 80
    && (order.variantId === undefined || typeof order.variantId === "string")
    && (order.variantName === undefined || typeof order.variantName === "string")
    && (order.size === undefined || typeof order.size === "string")
    && (order.paymentType === "deposit" || order.paymentType === "full")
    && typeof order.paymentAmount === "number"
    && Number.isFinite(order.paymentAmount)
    && order.paymentAmount >= 0
    && typeof order.quantity === "number"
    && Number.isInteger(order.quantity)
    && order.quantity > 0
    && (order.createdAt === undefined || typeof order.createdAt === "string")
}

export function parseStoredProductOrders(value: string | null) {
  if (!value) return []
  try {
    const orders: unknown = JSON.parse(value)
    return Array.isArray(orders) ? orders.filter(isStoredProductOrder) : []
  } catch {
    return []
  }
}

export function addStoredProductOrder(orders: StoredProductOrder[], order: StoredProductOrder) {
  return [...orders.filter((current) => current.id !== order.id), order]
}

export function removeStoredProductOrder(orders: StoredProductOrder[], orderId: string) {
  return orders.filter((order) => order.id !== orderId)
}

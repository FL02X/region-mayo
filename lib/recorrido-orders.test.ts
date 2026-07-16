const assert: typeof import("node:assert/strict") = require("node:assert/strict")
const test: typeof import("node:test") = require("node:test")
const {
  addStoredProductOrder,
  isAcceptedPaymentStatus,
  isCancellablePaymentStatus,
  parseStoredProductOrders,
  removeStoredProductOrder,
} = require("./recorrido-orders.ts") as typeof import("./recorrido-orders")

const order: import("./recorrido-orders").StoredProductOrder = {
  id: "order-1",
  productId: "product-1",
  customerName: "Ana",
  paymentType: "deposit",
  paymentAmount: 200,
  quantity: 1,
}

test("keeps valid local orders and replaces duplicate IDs", () => {
  assert.deepEqual(parseStoredProductOrders(JSON.stringify([order, { id: 3 }])), [order])
  assert.deepEqual(parseStoredProductOrders(JSON.stringify([{ ...order, createdAt: "2026-07-15T00:00:00.000Z" }])), [{ ...order, createdAt: "2026-07-15T00:00:00.000Z" }])
  assert.deepEqual(addStoredProductOrder([order], { ...order, quantity: 2 }), [{ ...order, quantity: 2 }])
  assert.deepEqual(removeStoredProductOrder([order], order.id), [])
  assert.deepEqual(parseStoredProductOrders("not-json"), [])
})

test("recognizes only accepted payment labels", () => {
  assert.equal(isAcceptedPaymentStatus("ANTICIPO RECIBIDO"), true)
  assert.equal(isAcceptedPaymentStatus("PAGO COMPLETO"), true)
  assert.equal(isAcceptedPaymentStatus("PENDIENTE"), false)
  assert.equal(isAcceptedPaymentStatus("CANCELADO"), false)
  assert.equal(isCancellablePaymentStatus("PENDIENTE"), true)
  assert.equal(isCancellablePaymentStatus("ANTICIPO RECIBIDO"), false)
  assert.equal(isCancellablePaymentStatus("PAGO COMPLETO"), false)
  assert.equal(isCancellablePaymentStatus("CANCELADO"), false)
})

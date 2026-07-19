import assert from "node:assert/strict"
import { test } from "node:test"
import {
  getOrderRowValidationRequests,
  getPaymentConditionalFormatRequests,
  getPhoneLinkRequest,
  getSummaryValues,
} from "./product-order-sheets"

const headers = [
  "ID",
  "Nombre",
  "Teléfono",
  "Fecha y hora",
  "Modalidad de pago",
  "Talla",
  "Cantidad",
  "Pago total (MXN)",
  "Pago esperado (MXN)",
  "Comprobante de pago",
  "Saldo pendiente (MXN)",
]

test("keeps payment colors by row and builds the supplier summary", () => {
  const rules = getPaymentConditionalFormatRequests(7, headers) as any[]
  assert.deepEqual(rules.map((request) => request.addConditionalFormatRule.rule.booleanRule.condition.values[0].userEnteredValue), [
    '=$J2="PENDIENTE"',
    '=$J2="ANTICIPO RECIBIDO"',
    '=$J2="PAGO COMPLETO"',
    '=$J2="CANCELADO"',
  ])
  assert.deepEqual(rules[0].addConditionalFormatRule.rule.ranges[0], {
    sheetId: 7,
    startRowIndex: 1,
    startColumnIndex: 0,
    endColumnIndex: headers.length,
  })

  const summary = getSummaryValues("Camisetas", headers)
  assert.deepEqual(summary[0], ["CONTROL DE PAGOS", "", ""])
  assert.deepEqual(summary[1], ["PAGADAS CON ANTICIPO", "PAGADAS COMPLETAS", ""])
  assert.equal(summary[2][2], "")
  assert.deepEqual(summary[7], ["PEDIDOS CONFIRMADOS", "", ""])
  assert.deepEqual(summary[8], ["Talla", "Total a pedir", ""])
  assert.equal(summary[10][0], "CH")
  assert.match(summary[10][1], /ANTICIPO RECIBIDO/)
  assert.match(summary[10][1], /PAGO COMPLETO/)

  const phone = getPhoneLinkRequest(7, 2, headers, "6441234567") as any
  assert.equal(phone.updateCells.rows[0].values[0].userEnteredValue.stringValue, "+526441234567")
  assert.equal(phone.updateCells.rows[0].values[0].userEnteredFormat.textFormat.link.uri, "https://wa.me/526441234567")

  const withoutDeposit = getOrderRowValidationRequests(7, headers, [2], false) as any
  assert.deepEqual(withoutDeposit[0].setDataValidation.rule.condition.values.map((item: any) => item.userEnteredValue), [
    "PENDIENTE",
    "PAGO COMPLETO",
    "CANCELADO",
  ])
  const withDeposit = getOrderRowValidationRequests(7, headers, [3], true) as any
  assert.deepEqual(withDeposit[0].setDataValidation.rule.condition.values.map((item: any) => item.userEnteredValue), [
    "PENDIENTE",
    "ANTICIPO RECIBIDO",
    "PAGO COMPLETO",
    "CANCELADO",
  ])
})

test("groups confirmed orders by variant and size when variants are enabled", () => {
  const variantHeaders = [
    "ID",
    "Nombre",
    "Teléfono",
    "Fecha y hora",
    "Modalidad de pago",
    "Variante",
    "Talla",
    "Cantidad",
    "Precio total (MXN)",
    "Pago esperado (MXN)",
    "Comprobante de pago",
  ]
  const summary = getSummaryValues("Camisetas", variantHeaders, {
    id: "camisetas",
    name: "Camiseta Recorrido",
    originalVariantName: "Camiseta de manga corta",
    price: 300,
    allowSizeSelection: true,
    variantsEnabled: true,
    variants: [{ id: "manga-larga", name: "Manga larga", photos: [] }],
    allowMultipleQuantity: true,
    isDisabled: false,
  })

  assert.deepEqual(summary[8], ["Talla", "Camiseta de manga corta", "Manga larga"])
  assert.equal(summary[9][0], "TOTAL")
  assert.match(summary[9][1], /\$F\$2:\$F="Camiseta de manga corta"/)
  assert.match(summary[9][2], /\$F\$2:\$F="Manga larga"/)
  assert.equal(summary[10][0], "CH")
  assert.match(summary[10][1], /\$G\$2:\$G="CH"/)
  assert.match(summary[10][1], /ANTICIPO RECIBIDO.+PAGO COMPLETO/)
})

test("omits sizes and keeps piece totals when size selection is disabled", () => {
  const summary = getSummaryValues("Productos", [
    "ID",
    "Nombre",
    "Teléfono",
    "Fecha y hora",
    "Modalidad de pago",
    "Variante",
    "Precio total (MXN)",
    "Pago esperado (MXN)",
    "Comprobante de pago",
  ], {
    id: "producto",
    name: "Producto",
    originalVariantName: "Original",
    price: 300,
    allowSizeSelection: false,
    variantsEnabled: true,
    variants: [{ id: "especial", name: "Especial", photos: [] }],
    allowMultipleQuantity: false,
    isDisabled: false,
  })

  assert.equal(summary.flat().includes("Talla"), false)
  assert.deepEqual(summary[8], ["Variante", "Total a pedir", ""])
  assert.equal(summary[9][0], "Original")
  assert.equal(summary[10][0], "Especial")
})

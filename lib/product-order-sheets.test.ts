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

test("keeps payment colors by row and the summary without a title row", () => {
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
  assert.deepEqual(summary[0], ["SOLICITADAS", "CON ANTICIPO", "PAGADAS COMPLETAS", "TOTAL A PEDIR"])
  assert.equal(summary[1][3], "=B2+C2")
  assert.equal(summary[5][3], "=B6+C6")
  assert.deepEqual(summary[9], ["TOTAL", "=SUM(B6:B9)", "=SUM(C6:C9)", "=SUM(D6:D9)"])

  const phone = getPhoneLinkRequest(7, 2, headers, "6441234567") as any
  assert.equal(phone.updateCells.rows[0].values[0].userEnteredValue.stringValue, "+526441234567")
  assert.equal(phone.updateCells.rows[0].values[0].userEnteredFormat.textFormat.link.uri, "https://wa.me/526441234567")

  const withoutDeposit = getOrderRowValidationRequests(7, headers, [2], false) as any
  assert.deepEqual(withoutDeposit[0].setDataValidation.rule.condition.values.map((item: any) => item.userEnteredValue), [
    "PENDIENTE",
    "PAGO COMPLETO",
    "CANCELADO",
  ])
})

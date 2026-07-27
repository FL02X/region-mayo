import assert from "node:assert/strict"
import { test } from "node:test"
import {
  REGISTRATION_FOLLOW_UP_VALUES,
  getInternationalPhone,
  getRegistrationFollowUp,
  getWhatsappUrl,
  isValidSubmissionId,
} from "./registration-sheet"

test("registration sheet workflow defaults", () => {
  assert.equal(getRegistrationFollowUp("NO", "NO"), "NO REQUIERE")
  assert.equal(getRegistrationFollowUp("SÍ", "NO"), "POR CONTACTAR")
  assert.equal(getRegistrationFollowUp("NO", "AÚN NO LO SÉ"), "POR CONTACTAR")
  assert.equal(getInternationalPhone("521 644 123 4567"), "+526441234567")
  assert.equal(getInternationalPhone('=HYPERLINK("https://wa.me/526441234567","+526441234567")'), "+526441234567")
  assert.equal(getWhatsappUrl("6441234567"), "https://wa.me/526441234567")
  assert.equal(isValidSubmissionId("b7c106c6-4d68-4a3f-a925-61872fc47c32"), true)
  assert.equal(isValidSubmissionId("not-a-uuid"), false)
  assert.deepEqual(REGISTRATION_FOLLOW_UP_VALUES, [
    "NO REQUIERE",
    "POR CONTACTAR",
    "CONTACTADO",
    "CANCELADO / REGISTRO INVALIDO",
  ])
})

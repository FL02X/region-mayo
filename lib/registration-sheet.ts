export const REGISTRATION_FOLLOW_UP_VALUES = [
  "NO REQUIERE",
  "POR CONTACTAR",
  "CONTACTADO",
  "CANCELADO / REGISTRO INVALIDO",
] as const

export const getRegistrationFollowUp = (lodging: string, transport: string) =>
  lodging === "NO" && transport === "NO" ? "NO REQUIERE" : "POR CONTACTAR"

export function formatRegistrationDate(date: Date) {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Chihuahua",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
  return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute}`
}

export function normalizeMexicanPhone(input: unknown) {
  const text = typeof input === "string" ? input : ""
  const whatsappPhone = text.match(/wa\.me\/52(\d{10})/)?.[1]
  if (whatsappPhone) return whatsappPhone

  const digits = text.replace(/\D/g, "").slice(0, 15)
  if (digits.length === 13 && digits.startsWith("521")) return digits.slice(3)
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2)
  return digits
}

export function getInternationalPhone(input: unknown) {
  const phone = normalizeMexicanPhone(input)
  return phone.length === 10 ? `+52${phone}` : String(input ?? "")
}

export function getWhatsappUrl(input: unknown) {
  const phone = normalizeMexicanPhone(input)
  return phone.length === 10 ? `https://wa.me/52${phone}` : null
}

// ============================================
// Region Mayo - Phone Number Utilities
// Default country code: Mexico (+52)
// ============================================

const DEFAULT_COUNTRY_CODE = "52"

/**
 * Format a phone number with Mexico country code for WhatsApp
 * Removes any non-digit characters and ensures +52 prefix
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "")
  
  // If already starts with country code, return as is
  if (digitsOnly.startsWith(DEFAULT_COUNTRY_CODE)) {
    return digitsOnly
  }
  
  // If starts with 1 (like +1 for US), keep it
  if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
    return digitsOnly
  }
  
  // Otherwise, prepend Mexico country code
  return `${DEFAULT_COUNTRY_CODE}${digitsOnly}`
}

/**
 * Generate a WhatsApp wa.me link
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  const baseUrl = `https://wa.me/${formattedPhone}`
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`
  }
  
  return baseUrl
}

/**
 * Format phone number for display (Mexican format)
 * Input: 6441234567
 * Output: +52 644 123 4567
 */
export function formatPhoneForDisplay(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "")
  
  // Remove country code if present
  const localNumber = digitsOnly.startsWith(DEFAULT_COUNTRY_CODE) 
    ? digitsOnly.slice(2) 
    : digitsOnly
  
  // Format as: XXX XXX XXXX
  if (localNumber.length === 10) {
    return `+52 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`
  }
  
  // Return with country code prefix if we can't format
  return `+52 ${localNumber}`
}

/**
 * Validate Mexican phone number
 */
export function isValidMexicanPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "")
  
  // Mexican numbers are 10 digits (without country code)
  // Or 12 digits (with +52 country code)
  return digitsOnly.length === 10 || 
    (digitsOnly.length === 12 && digitsOnly.startsWith(DEFAULT_COUNTRY_CODE))
}

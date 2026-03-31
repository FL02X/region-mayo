"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getWhatsAppLink, formatPhoneForDisplay } from "@/lib/phone-utils"

interface WhatsAppButtonProps {
  phone: string
  message?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showNumber?: boolean
  className?: string
}

export function WhatsAppButton({
  phone,
  message,
  variant = "default",
  size = "default",
  showNumber = false,
  className = "",
}: WhatsAppButtonProps) {
  const whatsappLink = getWhatsAppLink(phone, message)
  const formattedNumber = formatPhoneForDisplay(phone)

  return (
    <Button
      variant={variant}
      size={size}
      asChild
      className={`bg-[#25D366] hover:bg-[#20BD5A] text-white ${className}`}
    >
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        {showNumber ? formattedNumber : "WhatsApp"}
      </a>
    </Button>
  )
}

// Icon-only variant for compact layouts
export function WhatsAppIconButton({
  phone,
  message,
  className = "",
}: {
  phone: string
  message?: string
  className?: string
}) {
  const whatsappLink = getWhatsAppLink(phone, message)

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors ${className}`}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  )
}

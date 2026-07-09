"use client"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  countryCode?: string
}

function normalizeMexicanPhoneInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "")

  if (digitsOnly.length >= 13 && digitsOnly.startsWith("521")) {
    return digitsOnly.slice(3, 13)
  }

  if (digitsOnly.length >= 12 && digitsOnly.startsWith("52")) {
    return digitsOnly.slice(2, 12)
  }

  return digitsOnly.slice(0, 10)
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, countryCode = "+52", className = "", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(normalizeMexicanPhoneInput(e.target.value))
    }

    // Format number for display: XXX XXX XXXX
    const formatForDisplay = (num: string): string => {
      if (num.length <= 3) return num
      if (num.length <= 6) return `${num.slice(0, 3)} ${num.slice(3)}`
      return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`
    }

    return (
      <div className="flex">
        {/* Country Code Prefix */}
        <div className="flex items-center justify-center px-3 rounded-l-xl border border-r-0 bg-muted text-muted-foreground text-sm font-medium min-w-[60px]">
          {countryCode}
        </div>
        {/* Phone Number Input */}
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={formatForDisplay(value)}
          onChange={handleChange}
          placeholder="644 123 4567"
          className={`rounded-l-none rounded-r-xl h-11 ${className}`}
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

"use client"

import { useState } from "react"
import { Clock, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTime } from "@/lib/time-context"

type DebugTimePickerProps = {
  panelPlacement?: "above" | "below"
  compact?: boolean
}

export function DebugTimePicker({ panelPlacement = "above", compact = false }: DebugTimePickerProps) {
  const { currentTime, setDebugTime, isDebugMode, debugTime } = useTime()
  const [isOpen, setIsOpen] = useState(false)
  const [dateValue, setDateValue] = useState("")
  const [timeValue, setTimeValue] = useState("12:00")

  const handleSetTime = () => {
    if (!dateValue) return
    
    const [year, month, day] = dateValue.split("-").map(Number)
    const [hours, minutes] = timeValue.split(":").map(Number)
    
    const newDate = new Date(year, month - 1, day, hours, minutes, 0)
    setDebugTime(newDate)
    setIsOpen(false)
  }

  const handleReset = () => {
    setDebugTime(null)
    setDateValue("")
    setTimeValue("12:00")
  }

  const formatDisplayTime = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Quick preset buttons
  const presets = [
    { label: "Hoy", days: 0 },
    { label: "-5 días", days: -5 },
    { label: "-3 días", days: -3 },
    { label: "-1 día", days: -1 },
    { label: "+1 día", days: 1 },
    { label: "+3 días", days: 3 },
    { label: "+5 días", days: 5 },
  ]

  const applyPreset = (days: number) => {
    const now = new Date()
    now.setDate(now.getDate() + days)
    now.setHours(12, 0, 0, 0)
    setDebugTime(now)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors ${
          compact ? "h-9 w-9 px-0" : "h-8 px-2.5"
        } ${
          isDebugMode 
            ? "bg-amber-500 text-white hover:bg-amber-600" 
            : "bg-white text-muted-foreground hover:bg-slate-50"
        }`}
        title="Cambiar tiempo (debug)"
      >
        <Clock className="h-3.5 w-3.5" />
        {isDebugMode && !compact && (
          <span className="max-w-[100px] truncate">
            {formatDisplayTime(currentTime)}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div
            className={`z-50 rounded-xl border bg-white p-4 text-foreground shadow-lg ${
              panelPlacement === "below"
                ? "fixed left-4 right-4 top-[59px] w-auto"
                : "absolute left-0 bottom-full mb-2 w-72"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-foreground">
                Cambiar Tiempo (Debug)
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Time Display */}
            <div className="bg-slate-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-xs text-muted-foreground">
                {isDebugMode ? "Tiempo simulado:" : "Tiempo actual:"}
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDisplayTime(currentTime)}
              </p>
            </div>

            {/* Quick Presets */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Atajos rápidos:</p>
              <div className="flex flex-wrap gap-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset.days)}
                    className="h-7 px-2 text-xs rounded-lg"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual Date/Time Input */}
            <div className="space-y-2 mb-3">
              <p className="text-xs text-muted-foreground">O selecciona manualmente:</p>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="w-24 h-9 text-sm"
                />
              </div>
              <Button 
                onClick={handleSetTime} 
                disabled={!dateValue}
                className="w-full h-9 text-sm"
              >
                Aplicar
              </Button>
            </div>

            {/* Reset Button */}
            {isDebugMode && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="w-full h-9 text-sm"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Volver al tiempo real
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

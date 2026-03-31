"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

interface MonthNavigatorProps {
  selectedMonth: Date
  onMonthSelect: (date: Date) => void
  eventDates?: Date[]
}

export function MonthNavigator({ selectedMonth, onMonthSelect, eventDates = [] }: MonthNavigatorProps) {
  const [viewYear, setViewYear] = useState(selectedMonth.getFullYear())

  const navigateYear = (direction: "prev" | "next") => {
    setViewYear(prev => direction === "next" ? prev + 1 : prev - 1)
  }

  const isSelected = (monthIndex: number) => {
    return selectedMonth.getMonth() === monthIndex && selectedMonth.getFullYear() === viewYear
  }

  const isCurrentMonth = (monthIndex: number) => {
    const today = new Date()
    return today.getMonth() === monthIndex && today.getFullYear() === viewYear
  }

  const hasEvents = (monthIndex: number) => {
    return eventDates.some(date => 
      date.getMonth() === monthIndex && date.getFullYear() === viewYear
    )
  }

  const getEventCount = (monthIndex: number) => {
    return eventDates.filter(date => 
      date.getMonth() === monthIndex && date.getFullYear() === viewYear
    ).length
  }

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1)
    onMonthSelect(newDate)
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border">
      {/* Year Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateYear("prev")}
          className="h-9 w-9 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-semibold text-xl">{viewYear}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateYear("next")}
          className="h-9 w-9 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const eventCount = getEventCount(index)
          return (
            <button
              key={month}
              onClick={() => handleMonthClick(index)}
              className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all ${
                isSelected(index)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isCurrentMonth(index)
                  ? "bg-accent/50 text-foreground ring-2 ring-primary/30"
                  : hasEvents(index)
                  ? "bg-secondary hover:bg-secondary/80"
                  : "hover:bg-secondary/50 text-muted-foreground"
              }`}
            >
              <span className="text-sm font-medium">{month.slice(0, 3)}</span>
              {eventCount > 0 && (
                <span className={`text-xs mt-0.5 ${
                  isSelected(index) ? "text-primary-foreground/80" : "text-primary"
                }`}>
                  {eventCount} {eventCount === 1 ? "evento" : "eventos"}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

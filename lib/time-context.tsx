"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface TimeContextType {
  currentTime: Date
  setDebugTime: (date: Date | null) => void
  isDebugMode: boolean
  debugTime: Date | null
}

interface TimeProviderProps {
  children: ReactNode
  initialTimeISO?: string
}

const TimeContext = createContext<TimeContextType | undefined>(undefined)

export function TimeProvider({ children, initialTimeISO }: TimeProviderProps) {
  const [realTime, setRealTime] = useState(() => new Date(initialTimeISO ?? Date.now()))
  const [debugTime, setDebugTime] = useState<Date | null>(null)
  
  // Update real time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // If debug time is set, also update it every second but keeping the same offset
  useEffect(() => {
    if (!debugTime) return
    
    const interval = setInterval(() => {
      setDebugTime(prev => {
        if (!prev) return null
        return new Date(prev.getTime() + 1000)
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [debugTime !== null])
  
  const currentTime = debugTime ?? realTime
  
  return (
    <TimeContext.Provider 
      value={{ 
        currentTime, 
        setDebugTime, 
        isDebugMode: debugTime !== null,
        debugTime 
      }}
    >
      {children}
    </TimeContext.Provider>
  )
}

export function useTime() {
  const context = useContext(TimeContext)
  if (context === undefined) {
    throw new Error("useTime must be used within a TimeProvider")
  }
  return context
}

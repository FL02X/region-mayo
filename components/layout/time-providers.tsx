"use client";

// Donde: envuelve contenido de la home. 
// Viewports: todos. 
// Funcion: provee contexto compartido de tiempo sin pintar UI propia.
import React from "react";
import { TimeProvider } from "@/lib/time-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TimeProvider>{children}</TimeProvider>;
}

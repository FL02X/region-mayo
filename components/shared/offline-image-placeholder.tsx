"use client";

import { WifiOff } from "lucide-react";

interface OfflineImagePlaceholderProps {
  label?: string;
}

export function OfflineImagePlaceholder({
  label = "Imagen no disponible sin conexion",
}: OfflineImagePlaceholderProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/35 text-muted-foreground">
      <WifiOff className="h-7 w-7 opacity-45" aria-hidden="true" />
      <span className="px-4 text-center text-[11px] font-medium uppercase tracking-[0.12em] opacity-70">
        {label}
      </span>
    </div>
  );
}

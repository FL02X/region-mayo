"use client";

import { WifiOff } from "lucide-react";

export function OfflineImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/35 text-muted-foreground">
      <WifiOff className="h-7 w-7 opacity-45" aria-hidden="true" />
    </div>
  );
}

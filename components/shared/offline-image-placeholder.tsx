"use client";

import { WifiOff } from "lucide-react";

export function OfflineImagePlaceholder() {
  return (
    <div className="offline-image-placeholder absolute inset-0 hidden items-center justify-center bg-muted/35 text-muted-foreground">
      <WifiOff className="h-7 w-7 opacity-45" aria-hidden="true" />
    </div>
  );
}

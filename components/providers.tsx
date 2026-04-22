"use client";

import React from "react";
import { TimeProvider } from "@/lib/time-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TimeProvider>{children}</TimeProvider>;
}

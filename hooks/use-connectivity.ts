"use client";

import { useEffect, useState } from "react";

type NetworkInfo = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
};

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);
  const [connection, setConnection] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const nav = navigator as Navigator & {
      connection?: any;
      mozConnection?: any;
      webkitConnection?: any;
    };
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const updateConnection = () => {
      if (!conn) return;
      setConnection({
        effectiveType: conn.effectiveType,
        saveData: conn.saveData,
        downlink: conn.downlink,
        rtt: conn.rtt,
      });
    };

    if (conn?.addEventListener) {
      updateConnection();
      conn.addEventListener("change", updateConnection);
    }

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      conn?.removeEventListener?.("change", updateConnection);
    };
  }, []);

  return { isOnline, connection };
}

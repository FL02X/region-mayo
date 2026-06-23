"use client";

// Donde: home, debajo de las secciones principales. Viewports: desktop y mobile. Funcion: muestra tarjetas informativas y descarga himnario.
import { useEffect, useState } from "react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { HomeInfoCard } from "@/components/sections/home/home-info-cards/home-info-card";
import {
  HOME_INFO_CARDS,
  HOME_INFO_DOWNLOAD_COPY,
  HYMNAL_DOWNLOAD_URL,
  HYMNAL_FILE_NAME,
} from "@/components/sections/home/home-info-cards/home-info-copy";

export function HomeInfoCards() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { isOnline } = useConnectivity();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const effectiveOnline = hasMounted ? isOnline : true;

  const handleDownload = async () => {
    try {
      if (!effectiveOnline) {
        alert(HOME_INFO_DOWNLOAD_COPY.offlineAlert);
        return;
      }

      setIsDownloading(true);
      const response = await fetch(HYMNAL_DOWNLOAD_URL, {
        method: "GET",
      });

      if (response.status === 429) {
        alert(HOME_INFO_DOWNLOAD_COPY.rateLimitAlert);
        return;
      }

      if (!response.ok) {
        throw new Error("Error en la descarga");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = HYMNAL_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando:", error);
      alert(HOME_INFO_DOWNLOAD_COPY.errorAlert);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 bg-[#F9FAFB]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
        {HOME_INFO_CARDS.map((card) => (
          <HomeInfoCard
            key={card.id}
            card={card}
            isDownloading={isDownloading}
            isOnline={effectiveOnline}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </div>
  );
}

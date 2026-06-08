"use client";

import { Heart, BookOpen, Music, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useConnectivity } from "@/hooks/use-connectivity";

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
        alert("Sin conexion. Conectate a internet para descargar el archivo.");
        return;
      }
      setIsDownloading(true);
      const response = await fetch("/api/download-himnario", {
        method: "GET",
      });

      if (response.status === 429) {
        alert(
          "Has alcanzado el límite de descargas. Intenta nuevamente en 24 horas."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Error en la descarga");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "HIMNARIO MENSAJEROS DEL GRAN REY.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando:", error);
      alert("Hubo un error al descargar el archivo. Intenta nuevamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const cards = [
    {
      id: "free-services",
      color: "#f59e0b",
      icon: Heart,
      title: "Servicios gratuitos",
      subtitle: "Todos somos bienvenidos. Nuestros servicios son completamente gratuitos.",
      href: null,
      onClick: null,
    },
    {
      id: "bible",
      color: "#b45309",
      icon: BookOpen,
      title: "Biblia Reina-Valera 1909",
      subtitle: "La traducción que usamos y recomendamos. Accede a ella aquí.",
      href: "https://www.mercadolibre.com.mx/biblia-rv1909-mediana-negro-indice-vr055ti-de-reina-valera-1909-editorial-sociedades-biblicas-tapa-blanda-en-espanol/p/MLM45695178",
      onClick: null,
    },
    {
      id: "hymnal",
      color: "#2563eb",
      icon: Music,
      title: "Himnario Mensajeros del Gran Rey",
      subtitle: "Descarga nuestro himnario para cantar con nosotros.",
      href: null,
      onClick: handleDownload,
    },
  ];

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 bg-[#F9FAFB]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const content = (
            <>
              <div className="p-4 md:p-5 h-full flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 flex items-center justify-center">
                    {card.id === "free-services" ? (
                      <Heart className="h-5 w-5 md:h-6 md:w-6" style={{ color: "#2f5e93" }} aria-hidden="true" />
                    ) : (
                      <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: "#2f5e93" }} aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                      {card.id === "free-services" ? "Bienvenido" : card.id === "bible" ? "Nuestra Biblia" : "Canta Con Nosotros"}
                    </p>
                    <p className="text-sm font-medium text-foreground leading-tight mb-2">
                      {card.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {card.subtitle}
                      {card.id === "hymnal" && isDownloading && " (Descargando...)"}
                      {card.id === "hymnal" && !effectiveOnline && " (Sin conexion)"}
                    </p>
                    <div className="mt-2">
                      {card.href ? (
                        <a
                          href={card.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5e93] hover:text-[#284e79] transition-colors"
                        >
                          Ver ejemplo de biblia
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      ) : card.onClick ? (
                        <button
                          type="button"
                          onClick={card.onClick}
                          disabled={!effectiveOnline}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5e93] hover:text-[#284e79] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Descargar Himnario
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
          return (
            <div key={card.id} className="bg-paper-highlight border border-[#E5E7EB] overflow-hidden h-full flex flex-col">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

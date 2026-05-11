"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallModal({ isOpen, onClose }: InstallModalProps) {
  const { canInstall, promptInstall, isInstalled, isIos } = useInstallPrompt();
  const [installMessage, setInstallMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setInstallMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleInstall = async () => {
    const choice = await promptInstall();
    if (!choice) {
      setInstallMessage("La instalacion no esta disponible en este navegador.");
      return;
    }

    if (choice.outcome === "accepted") {
      setInstallMessage("Instalacion iniciada. Busca el icono en tu pantalla de inicio.");
    } else {
      setInstallMessage("Instalacion cancelada. Puedes intentarlo mas tarde.");
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="absolute inset-0 sm:relative sm:inset-auto bg-background w-full sm:max-w-lg sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl border border-border"
      >
        <div className="shrink-0 bg-background z-10 px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="install-title" className="font-bold text-lg text-foreground uppercase tracking-wide">
                Instalar app
              </h2>
              <p className="text-sm text-muted-foreground">Region Mayo en tu dispositivo.</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none shrink-0 h-10 w-10 hover:bg-muted">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isInstalled ? (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              La app ya esta instalada en este dispositivo.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Puedes instalar Region Mayo para abrirla rapido desde tu pantalla de inicio.
              </p>

              {!isIos && (
                <Button
                  onClick={handleInstall}
                  className="rounded-none h-12 px-5 uppercase tracking-wider font-semibold"
                  disabled={!canInstall}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar ahora
                </Button>
              )}

              {isIos && (
                <div className="border border-border/60 bg-white p-4">
                  <p className="text-sm font-semibold text-foreground">Instalar en iOS</p>
                  <ol className="mt-2 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Abre esta pagina en Safari.</li>
                    <li>Toca el boton de compartir.</li>
                    <li>Selecciona "Agregar a inicio".</li>
                  </ol>
                </div>
              )}

              {installMessage && (
                <p className="text-xs text-muted-foreground">{installMessage}</p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 bg-background border-t border-border/50 p-4">
          <Button onClick={onClose} className="w-full rounded-none h-12 uppercase tracking-wider font-semibold">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

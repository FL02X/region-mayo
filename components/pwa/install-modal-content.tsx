// Donde: contenido interno de InstallModal. 
// Viewports: desktop y mobile. 
// Funcion: muestra textos, pasos iOS y boton instalable.

import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallModalHeaderProps {
  onClose: () => void;
}

export function InstallModalHeader({ onClose }: InstallModalHeaderProps) {
  return (
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
  );
}

interface InstallModalBodyProps {
  isInstalled: boolean;
  isIos: boolean;
  canInstall: boolean;
  isPreparingOffline: boolean;
  installMessage: string | null;
  bundleLabel: string;
  onInstall: () => void;
}

export function InstallModalBody({
  isInstalled,
  isIos,
  canInstall,
  isPreparingOffline,
  installMessage,
  bundleLabel,
  onInstall,
}: InstallModalBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-6">
      {isInstalled ? (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          La app ya esta instalada en este dispositivo.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Agrega la app a tu celular y descarga el contenido principal para usarla sin conexion.
          </p>
          <p className="text-xs text-muted-foreground">
            Algunas secciones pueden requerir conexion.
          </p>

          {!isIos && (
            <Button
              onClick={onInstall}
              className="rounded-none h-12 px-5 uppercase tracking-wider font-semibold"
              disabled={!canInstall || isPreparingOffline}
            >
              <Download className="h-4 w-4 mr-2" />
              {isPreparingOffline ? "Preparando..." : `Instalar ahora (${bundleLabel})`}
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
  );
}

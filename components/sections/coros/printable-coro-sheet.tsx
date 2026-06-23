// Donde: ventana de impresion desde /coros. Viewports: desktop y mobile al imprimir. Funcion: arma la ficha imprimible de un coro.
import { Church, Music, User } from "lucide-react";
import { PrintableInfoSheet } from "@/components/shared/copy-print-actions";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import type { Coro } from "@/lib/types";
import { getCoroImageUrl } from "@/components/sections/coros/coros-helpers";

export function PrintableCoroSheet({ coro }: { coro: Coro }) {
  const imageUrl = getCoroImageUrl(coro.photo, "print");

  return (
    <PrintableInfoSheet
      title={coro.coroName}
      imageUrl={imageUrl}
      imageAlt={coro.coroName}
      fallbackIcon={<Music className="h-10 w-10" aria-hidden="true" />}
      sections={[
        ...(coro.temploName
          ? [
              {
                id: "templo",
                label: "Iglesia Sede",
                icon: <Church className="rm-print-icon" aria-hidden="true" />,
                content: (
                  <p>
                    {coro.temploName}
                    {coro.address ? `\n${coro.address}` : ""}
                  </p>
                ),
              },
            ]
          : []),
        {
          id: "president",
          label: "Presidente de Coro",
          icon: <User className="rm-print-icon" aria-hidden="true" />,
          content: (
            <p>
              {coro.presidentName}
              {coro.presidentPhone
                ? `\n${formatPhoneForDisplay(coro.presidentPhone)}`
                : ""}
            </p>
          ),
        },
      ]}
    />
  );
}

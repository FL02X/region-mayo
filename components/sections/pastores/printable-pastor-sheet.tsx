// Donde: ventana de impresion desde /pastores. Viewports: desktop y mobile al imprimir. Funcion: arma la ficha imprimible de un pastor.
import { Church, Phone, Users } from "lucide-react";
import { PrintableInfoSheet } from "@/components/shared/copy-print-actions";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import type { Pastor } from "@/lib/types";
import { getPastorImageUrl } from "@/components/sections/pastores/pastores-helpers";

export function PrintablePastorSheet({ pastor }: { pastor: Pastor }) {
  const imageUrl = getPastorImageUrl(pastor.photo, "print");

  return (
    <PrintableInfoSheet
      title={pastor.fullName}
      imageUrl={imageUrl}
      imageAlt={pastor.fullName}
      fallbackIcon={<Users className="h-10 w-10" aria-hidden="true" />}
      sections={[
        ...(pastor.temploName
          ? [
              {
                id: "templo",
                label: "Iglesia Sede",
                icon: <Church className="rm-print-icon" aria-hidden="true" />,
                content: (
                  <p>
                    {pastor.temploName}
                    {pastor.churchNumber
                      ? `\nPastor Local de Iglesia #${pastor.churchNumber}`
                      : ""}
                    {pastor.address ? `\n${pastor.address}` : ""}
                  </p>
                ),
              },
            ]
          : []),
        ...(pastor.phone
          ? [
              {
                id: "phone",
                label: "Número de Teléfono",
                icon: <Phone className="rm-print-icon" aria-hidden="true" />,
                content: <p>{formatPhoneForDisplay(pastor.phone)}</p>,
              },
            ]
          : []),
      ]}
    />
  );
}

// Donde: ventana de impresion desde /directiva. 
// Viewports: desktop y mobile al imprimir. 
// Funcion: arma la ficha imprimible de un miembro de directiva.
import { Church, Phone, UserCircle } from "lucide-react";
import { PrintableInfoSheet } from "@/components/shared/copy-print-actions";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import type { DirectivaMember } from "@/lib/types";
import {
  getDirectivaImageUrl,
  getDirectivaRoleLabel,
} from "@/components/sections/directiva/directiva-helpers";

export function PrintableDirectivaSheet({ member }: { member: DirectivaMember }) {
  const imageUrl = getDirectivaImageUrl(member.photo, "print");
  const roleLabel = getDirectivaRoleLabel(member.role);

  return (
    <PrintableInfoSheet
      title={member.fullName}
      imageUrl={imageUrl}
      imageAlt={member.fullName}
      fallbackIcon={<UserCircle className="h-10 w-10" aria-hidden="true" />}
      sections={[
        ...(roleLabel
          ? [
              {
                id: "role",
                label: "Cargo",
                icon: (
                  <UserCircle className="rm-print-icon" aria-hidden="true" />
                ),
                content: <p>{roleLabel}</p>,
              },
            ]
          : []),
        ...(member.temploName
          ? [
              {
                id: "templo",
                label: "Iglesia Sede",
                icon: <Church className="rm-print-icon" aria-hidden="true" />,
                content: (
                  <p>
                    {member.temploName}
                    {member.address ? `\n${member.address}` : ""}
                  </p>
                ),
              },
            ]
          : []),
        {
          id: "phone",
          label: "Contacto",
          icon: <Phone className="rm-print-icon" aria-hidden="true" />,
          content: <p>{formatPhoneForDisplay(member.phone)}</p>,
        },
      ]}
    />
  );
}

// Donde: extremo derecho del header desktop. 
// Viewports: desktop/tablet md+. 
// Funcion: muestra enlaces sociales configurables.
import { Facebook, Instagram } from "lucide-react";

interface HeaderSocialLinksProps {
  instagramUrl: string;
  facebookUrl: string;
  onItemHover: (element: HTMLElement) => void;
}

export function HeaderSocialLinks({
  instagramUrl,
  facebookUrl,
  onItemHover,
}: HeaderSocialLinksProps) {
  return (
    <div className="flex items-center gap-0.5 shrink-0 max-[914px]:gap-1.5">
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="desktop-header-item flex items-center justify-center h-8 w-8 max-[914px]:h-11 max-[914px]:w-11 text-white hover:text-white transition-colors"
        aria-label="Síguenos en Instagram"
        onMouseEnter={(event) => onItemHover(event.currentTarget)}
      >
        <Instagram className="desktop-header-icon h-[16px] w-[16px]" aria-hidden="true" strokeWidth={1.75} />
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="desktop-header-item flex items-center justify-center h-8 w-8 max-[914px]:h-11 max-[914px]:w-11 text-white hover:text-white transition-colors"
        aria-label="Síguenos en Facebook"
        onMouseEnter={(event) => onItemHover(event.currentTarget)}
      >
        <Facebook className="desktop-header-icon h-[16px] w-[16px]" aria-hidden="true" strokeWidth={1.75} />
      </a>
    </div>
  );
}

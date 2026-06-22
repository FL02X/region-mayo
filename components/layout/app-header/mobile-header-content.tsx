import Link from "next/link";
import { Search } from "lucide-react";
import { MobileMenu } from "@/components/layout/side-menu.mobile";
import { DebugTimePicker } from "@/components/shared/debug-time-picker";
import { MobileHeaderBrand } from "@/components/layout/app-header/header-brand";

interface MobileHeaderContentProps {
  instagramUrl: string;
  facebookUrl: string;
}

export function MobileHeaderContent({
  instagramUrl,
  facebookUrl,
}: MobileHeaderContentProps) {
  return (
    <div className="md:hidden flex items-center h-full px-3 gap-2 relative z-[62]">
      <MobileHeaderBrand />

      <div className="flex-1" />

      {process.env.NODE_ENV === "development" && (
        <div className="mb-1 shrink-0">
          <DebugTimePicker panelPlacement="below" compact />
        </div>
      )}

      <Link
        href="/buscar"
        className="mr-2 mb-1 flex items-center justify-center h-9 w-9 shrink-0 text-white hover:text-white transition-colors"
        aria-label="Ir a búsqueda"
      >
        <Search className="h-[23px] w-[23px]" strokeWidth={1} />
      </Link>

      <div className="mb-1 md:hidden flex items-center justify-end text-white relative z-[62] h-full shrink-0">
        <MobileMenu instagramUrl={instagramUrl} facebookUrl={facebookUrl} />
      </div>
    </div>
  );
}

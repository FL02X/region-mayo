"use client";

// Donde: root layout, pensado para la home mobile. 
// Viewports: mobile. 
// Funcion: banner de instalacion; hoy esta apagado por bandera.

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { InstallModal } from "@/components/pwa/install-modal";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

function shouldShowInstallAppBanner() {
  // El banner inferior queda apagado; la instalacion se ofrece desde el menu movil.
  return false;
}

export function InstallAppBanner() {
  const { isInstalled } = useInstallPrompt();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!shouldShowInstallAppBanner()) {
    return null;
  }

  if (isInstalled || pathname !== "/") {
    return null;
  }

  return (
    <>
      <div className="h-[102px] md:hidden" aria-hidden="true" />
      <aside
        className="fixed inset-x-0 bottom-0 z-[65] flex min-h-[102px] items-center gap-[clamp(10px,3vw,24px)] overflow-hidden bg-[#21252b] bg-[linear-gradient(0deg,#15191f_0%,#21252b_58%,#2b3440_100%)] px-[clamp(12px,3vw,20px)] py-[clamp(10px,2.8vw,16px)] text-white shadow-[0_-14px_34px_-22px_rgba(0,0,0,0.85)] md:hidden"
        aria-label="Instalar app Region Mayo"
      >
        <div className="flex h-[108px] w-[clamp(64px,22vw,118px)] shrink-0 items-start justify-center overflow-hidden max-[330px]:hidden" aria-hidden="true">
          <Image
            src="/images/app_mobile2.png"
            alt=""
            width={1122}
            height={1402}
            className="h-[167%] w-full select-none object-contain object-top"
            draggable={false}
          />
        </div>

        <div className="p-3 flex min-w-0 flex-1 flex-col gap-[clamp(7px,2vw,12px)]">
          <div className="min-w-0">
            <p className="max-w-[20rem] text-[clamp(19px,3.7vw,17px)] font-bold leading-[1.18] text-white max-[360px]:hidden">
              Guardanos en tu dispositivo.
            </p>
            <p className="mt-1.5 max-w-[19rem] text-[clamp(11px,3vw,13px)] font-medium leading-snug text-white/72 max-[430px]:hidden">
              Usala en tu celular sin conexion a Internet
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex min-h-9 w-full max-w-[250px] items-center justify-center gap-2 self-start bg-white px-[clamp(10px,3vw,16px)] py-2 text-[clamp(16px,2.65vw,12px)] font-bold uppercase leading-tight text-[#21252b] shadow-sm transition-colors hover:bg-[#eef2f6] focus-visible:outline-white sm:max-w-none"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-normal text-center">Instalar como App</span>
          </button>
        </div>
      </aside>

      <InstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

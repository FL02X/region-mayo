"use client";

import { useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { InstallModal } from "@/components/pwa/install-modal";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

function shouldShowInstallAppBanner() {
  return false;
}

export function InstallAppBanner() {
  const { isInstalled } = useInstallPrompt();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!shouldShowInstallAppBanner()) {
    return null;
  }

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <aside
        className="fixed inset-x-0 bottom-0 z-[65] overflow-visible bg-[#21252b] bg-[linear-gradient(0deg,#15191f_0%,#21252b_58%,#2b3440_100%)] text-white shadow-[0_-14px_34px_-22px_rgba(0,0,0,0.85)]"
        aria-label="Instalar app Region Mayo"
      >
        <div className="mx-auto flex h-[146px] max-w-[950px] items-center gap-3.5 overflow-hidden px-3.5 pr-4 sm:h-[150px] sm:gap-6 sm:px-5">
          <div className="relative h-full w-[98px] shrink-0 sm:w-[126px]" aria-hidden="true">
            <Image
              src="/images/app_mobile.png"
              alt=""
              width={1122}
              height={1402}
              className="absolute bottom-[-70px] left-[-24px] h-[208px] w-auto max-w-none select-none sm:bottom-[-78px] sm:left-[-28px] sm:h-[226px]"
              draggable={false}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-4 sm:gap-3">
            <div className="min-w-0">
              <p className="max-w-[20rem] text-[15px] font-bold leading-[1.18] text-white sm:text-[17px]">
                Agrega la App MGR Region Mayo
              </p>
              <p className="mt-1.5 max-w-[19rem] text-[12px] font-medium leading-snug text-white/72 sm:text-[13px]">
                Usala en tu celular sin conexion a Internet
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-9 w-full max-w-[250px] items-center justify-center gap-2 self-start bg-white px-3 py-2 text-[10px] font-bold uppercase leading-tight text-[#21252b] shadow-sm transition-colors hover:bg-[#eef2f6] focus-visible:outline-white sm:max-w-none sm:px-4 sm:text-[12px]"
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-normal text-center">Agregar a la pantalla de Inicio</span>
            </button>
          </div>
        </div>
      </aside>

      <InstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

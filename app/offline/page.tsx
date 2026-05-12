import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#f1f1f1] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-[#e5e7eb] p-6 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <WifiOff className="h-6 w-6 text-amber-700" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-[#1f2937]">Sin conexion</h1>
        <p className="mt-2 text-sm text-[#4b5563]">
          Esta seccion necesita internet. Si ya habias visitado la pagina, intenta volver cuando
          tengas conexion.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-none border border-[#1f2937] px-4 py-2 text-sm font-semibold text-[#1f2937] hover:bg-[#1f2937] hover:text-white transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { InstallModal } from "@/components/pwa/install-modal";

export default function InstallPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f1f1f1]">
      <InstallModal isOpen onClose={() => router.push("/")} />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

type PermissionCard = {
  id: "notifications" | "location";
  title: string;
  description: string;
  icon: typeof Bell;
  status: PermissionState;
  onRequest: () => void;
};

const statusLabels: Record<PermissionState, string> = {
  granted: "Permitido",
  denied: "Bloqueado",
  prompt: "No solicitado",
  unsupported: "No disponible",
};

export function PermissionsPanel() {
  const [notificationStatus, setNotificationStatus] = useState<PermissionState>("prompt");
  const [locationStatus, setLocationStatus] = useState<PermissionState>("prompt");
  const [locationHint, setLocationHint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window) {
      setNotificationStatus(Notification.permission as PermissionState);
    } else {
      setNotificationStatus("unsupported");
    }

    const updateLocationStatus = async () => {
      if (!navigator.geolocation) {
        setLocationStatus("unsupported");
        return;
      }

      if (navigator.permissions?.query) {
        try {
          const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          setLocationStatus(status.state as PermissionState);
        } catch {
          setLocationStatus("prompt");
        }
      }
    };

    updateLocationStatus();
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission as PermissionState);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationHint(null);

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus("granted");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
        }
        setLocationHint("No pudimos obtener la ubicacion. Puedes intentarlo de nuevo.");
      },
      { timeout: 8000 },
    );
  };

  const cards: PermissionCard[] = [
    {
      id: "notifications",
      title: "Notificaciones",
      description: "Avisos importantes y recordatorios.",
      icon: Bell,
      status: notificationStatus,
      onRequest: requestNotifications,
    },
    {
      id: "location",
      title: "Ubicacion",
      description: "Encontrar templos cercanos cuando lo necesites.",
      icon: MapPin,
      status: locationStatus,
      onRequest: requestLocation,
    },
  ];

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const statusLabel = statusLabels[card.status];
        const isGranted = card.status === "granted";

        return (
          <div key={card.id} className="border border-border/60 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  isGranted ? "text-emerald-600" : "text-muted-foreground",
                )}
              >
                {statusLabel}
              </span>
              <Button
                variant={isGranted ? "outline" : "default"}
                size="sm"
                onClick={card.onRequest}
                className="rounded-none w-full"
                disabled={card.status === "unsupported"}
              >
                {isGranted ? "Listo" : "Permitir"}
              </Button>
            </div>

            {card.id === "location" && locationHint && (
              <p className="mt-2 text-xs text-amber-700">{locationHint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

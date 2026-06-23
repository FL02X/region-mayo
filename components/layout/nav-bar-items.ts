// Donde: no renderiza UI directo. 
// Viewports: afecta desktop y mobile. 
// Funcion: centraliza textos, rutas e iconos editables de navegacion.
import {
  Church,
  Home,
  Images,
  Music,
  Settings,
  Smartphone,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface LayoutNavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export const DEFAULT_INSTAGRAM_URL = "https://instagram.com/regionmayo";
export const DEFAULT_FACEBOOK_URL = "https://facebook.com/regionmayo";

// Estas listas concentran los textos e iconos que mas probablemente cambian.
export const desktopNavItems: LayoutNavigationItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/templos", label: "Templos", icon: Church },
  { href: "/pastores", label: "Pastores", icon: Users },
  { href: "/coros", label: "Coros", icon: Music },
  { href: "/album", label: "Álbum", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

export const mobileMainMenuItems: LayoutNavigationItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/coros", label: "Coros Locales", icon: Music },
  { href: "/album", label: "Álbum de Actividades", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

export const iglesiasMenuItems: LayoutNavigationItem[] = [
  { href: "/templos", label: "Congregaciones", icon: Church },
  { href: "/pastores", label: "Pastores", icon: Users },
];

export const settingsMenuItem: LayoutNavigationItem = {
  href: "/configuracion",
  label: "Configuracion",
  icon: Settings,
};

export const installMenuItem: LayoutNavigationItem = {
  href: "/instalar",
  label: "Instalar app",
  icon: Smartphone,
};

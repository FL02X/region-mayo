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

interface LayoutNavigationBase {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface LayoutNavigationRouteItem extends LayoutNavigationBase {
  kind: "item";
  href: string;
  onSelect?: never;
}

export interface LayoutNavigationActionItem extends LayoutNavigationBase {
  kind: "item";
  href?: never;
  onSelect: () => void;
}

export type LayoutNavigationItem =
  | LayoutNavigationRouteItem
  | LayoutNavigationActionItem;

export interface LayoutNavigationGroup extends LayoutNavigationBase {
  kind: "group";
  items: LayoutNavigationItem[];
}

export type LayoutNavigationEntry =
  | LayoutNavigationItem
  | LayoutNavigationGroup;

export const DEFAULT_INSTAGRAM_URL = "https://instagram.com/regionmayo";
export const DEFAULT_FACEBOOK_URL = "https://facebook.com/regionmayo";

const inicioItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "inicio",
  href: "/",
  label: "Inicio",
  icon: Home,
};

const templosItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "templos",
  href: "/templos",
  label: "Templos",
  icon: Church,
};

const pastoresItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "pastores",
  href: "/pastores",
  label: "Pastores",
  icon: Users,
};

const corosItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "coros",
  href: "/coros",
  label: "Coros",
  icon: Music,
};

const albumItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "album",
  href: "/album",
  label: "Álbum",
  icon: Images,
};

const directivaItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "directiva",
  href: "/directiva",
  label: "Directiva",
  icon: UserCircle,
};

const directorioDesktopGroup: LayoutNavigationGroup = {
  kind: "group",
  id: "directorio",
  label: "Directorio",
  icon: Users,
  items: [
    { ...pastoresItem, description: "Directorio regional" },
    { ...corosItem, description: "Directorio regional" },
    { ...directivaItem, description: "Directorio regional" },
  ],
};

const iglesiasMobileGroup: LayoutNavigationGroup = {
  kind: "group",
  id: "iglesias",
  label: "Iglesias",
  icon: Church,
  items: [
    { ...templosItem, label: "Congregaciones" },
    pastoresItem,
  ],
};

const directorioMobileGroup: LayoutNavigationGroup = {
  ...directorioDesktopGroup,
  items: [corosItem, directivaItem],
};

// El orden y los grupos se modifican directamente en estas listas.
export const desktopNavItems: LayoutNavigationEntry[] = [
  inicioItem,
  templosItem,
  directorioDesktopGroup,
  albumItem,
];

export const mobileMainMenuItems: LayoutNavigationEntry[] = [
  inicioItem,
  iglesiasMobileGroup,
  directorioMobileGroup,
  { ...albumItem, label: "Álbum de Actividades" },
];

export const settingsMenuItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "configuracion",
  href: "/configuracion",
  label: "Configuracion",
  icon: Settings,
};

export const installMenuItem: LayoutNavigationRouteItem = {
  kind: "item",
  id: "instalar",
  href: "/instalar",
  label: "Instalar app",
  icon: Smartphone,
};

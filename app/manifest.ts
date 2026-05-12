import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Region Mayo",
    short_name: "Region Mayo",
    description: "Catalogo digital de eventos y actividades de Region Mayo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f1f1f1",
    theme_color: "#21252b",
    icons: [
      {
        src: "/images/region-mayo-logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/images/region-mayo-logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}

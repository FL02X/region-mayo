import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IGC Region Mayo",
    short_name: "IGC Mayo",
    description: "Consulte el calendario regional, templos, pastores, coros y actividades de la Iglesia Gentil de Cristo en la Región Mayo.",
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

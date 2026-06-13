import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/configuracion", "/instalar", "/offline", "/studio", "/subir"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

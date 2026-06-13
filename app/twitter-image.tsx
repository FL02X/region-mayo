import { ImageResponse } from "next/og";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0f172a 0%, #173e61 55%, #2f5e93 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <img
          src={absoluteUrl("/images/region-mayo-logo-512.jpg")}
          alt=""
          width={88}
          height={88}
          style={{
            borderRadius: "999px",
            border: "3px solid rgba(255,255,255,0.18)",
            objectFit: "cover",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "68px", lineHeight: 1.05, fontWeight: 800 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: "28px", lineHeight: 1.35, color: "rgba(255,255,255,0.9)" }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

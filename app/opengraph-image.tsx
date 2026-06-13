import { ImageResponse } from "next/og";
import { absoluteUrl, SITE_DESCRIPTION, SITE_FULL_NAME } from "@/lib/seo";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1d4d7a 48%, #2f5e93 100%)",
          color: "white",
          padding: "64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "760px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <img
              src={absoluteUrl("/images/region-mayo-logo-512.jpg")}
              alt=""
              width={96}
              height={96}
              style={{
                borderRadius: "999px",
                border: "3px solid rgba(255,255,255,0.18)",
                objectFit: "cover",
              }}
            />
            <span>{SITE_FULL_NAME}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                fontSize: "66px",
                lineHeight: 1.03,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Región Mayo
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.9)",
                maxWidth: "700px",
              }}
            >
              {SITE_DESCRIPTION}
            </div>
          </div>
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            fontSize: "20px",
            fontWeight: 700,
            padding: "14px 18px",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          Sitio oficial
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

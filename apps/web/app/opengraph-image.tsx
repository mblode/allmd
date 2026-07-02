import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name} — Turn the whole universe into markdown`;
export const contentType = "image/png";
export const size = { height: 630, width: 1200 };

// Design tokens mirrored from globals.css (dark scheme, OKLCH → sRGB).
const BACKGROUND = "#0a0a0a";
const FOREGROUND = "#fafafa";
const MUTED = "#a1a1a1";
const PRIMARY = "#e84c88";
const SURFACE = "rgba(255, 255, 255, 0.04)";
const BORDER = "rgba(255, 255, 255, 0.1)";

// Glide is a variable WOFF2 font, which next/og (Satori) cannot decode, so we
// fall back to the bundled default font — it covers the Latin text used here.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: BACKGROUND,
        backgroundImage:
          "radial-gradient(circle at 50% 30%, rgba(232, 76, 136, 0.22), transparent 55%)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "80px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: FOREGROUND,
          display: "flex",
          fontSize: 168,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          lineHeight: 1,
        }}
      >
        allmd
      </div>
      <div
        style={{
          color: MUTED,
          display: "flex",
          fontSize: 46,
          marginTop: 24,
          textAlign: "center",
        }}
      >
        Turn the whole universe into markdown.
      </div>
      <div
        style={{
          alignItems: "center",
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          color: FOREGROUND,
          display: "flex",
          fontSize: 30,
          gap: 18,
          marginTop: 56,
          padding: "22px 34px",
        }}
      >
        <span style={{ color: PRIMARY, display: "flex" }}>$</span>
        <span style={{ display: "flex" }}>npx skills add mblode/allmd</span>
      </div>
    </div>,
    { ...size }
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

// The card WhatsApp, LinkedIn and X show when someone shares any page of the site.
export const alt = "N3 Thinktech · IA Laboratory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  // next.config.ts keeps these files in the deployment (outputFileTracingIncludes).
  const font = (name: string) => readFile(join(process.cwd(), "src/app", name));
  const [black, semibold] = await Promise.all([font("Inter-Black.ttf"), font("Inter-SemiBold.ttf")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(120deg, #06060c 0%, #0b0b14 52%, #2a0b10 100%)",
          color: "white",
          padding: "90px 96px",
          position: "relative",
        }}
      >
        {/* Red rule */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "#dc2626" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, fontFamily: "InterBlack", letterSpacing: -3, lineHeight: 1 }}>
            N3 Thinktech
          </div>
          <div
            style={{
              fontSize: 30,
              fontFamily: "InterSemiBold",
              color: "#f87171",
              letterSpacing: 9,
              marginTop: 18,
            }}
          >
            IA LABORATORY
          </div>
          <div
            style={{
              fontSize: 36,
              fontFamily: "InterSemiBold",
              color: "#a1a1aa",
              lineHeight: 1.35,
              marginTop: 42,
              maxWidth: 900,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: 64,
            fontSize: 26,
            fontFamily: "InterSemiBold",
            color: "#71717a",
          }}
        >
          n3labs.potenttial.site
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "InterBlack", data: black, style: "normal", weight: 900 },
        { name: "InterSemiBold", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The card WhatsApp, LinkedIn and X show when someone shares a link.
 * Fonts live in src/app and are kept in the deployment by outputFileTracingIncludes
 * (next.config.ts); every route that renders a card must be listed there.
 */

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const font = (name: string) => readFile(join(process.cwd(), "src/app", name));
  const [black, semibold] = await Promise.all([font("Inter-Black.ttf"), font("Inter-SemiBold.ttf")]);
  return [
    { name: "InterBlack", data: black, style: "normal" as const, weight: 900 as const },
    { name: "InterSemiBold", data: semibold, style: "normal" as const, weight: 600 as const },
  ];
}

export function OgCard({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) {
  return (
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
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "#dc2626" }} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 104, fontFamily: "InterBlack", letterSpacing: -3, lineHeight: 1 }}>{title}</div>
        <div style={{ fontSize: 30, fontFamily: "InterSemiBold", color: "#f87171", letterSpacing: 9, marginTop: 18 }}>
          {eyebrow}
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
          {description}
        </div>
      </div>

      <div
        style={{ position: "absolute", left: 96, bottom: 64, fontSize: 26, fontFamily: "InterSemiBold", color: "#71717a" }}
      >
        n3labs.potenttial.site
      </div>
    </div>
  );
}

import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, ogFonts } from "@/lib/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const alt = "N3 Thinktech · IA Laboratory";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(<OgCard title="N3 Thinktech" eyebrow="IA LABORATORY" description={SITE_DESCRIPTION} />, {
    ...size,
    fonts: await ogFonts(),
  });
}

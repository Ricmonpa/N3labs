import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, ogFonts } from "@/lib/og";

export const alt = "Scan GEO completo · N3";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function PanelOpenGraphImage() {
  return new ImageResponse(
    <OgCard
      title="Scan GEO"
      eyebrow="DIAGNÓSTICO COMPLETO"
      description="Medimos si ChatGPT, Gemini, Claude y Perplexity recomiendan tu marca, con la evidencia de cada respuesta."
    />,
    { ...size, fonts: await ogFonts() },
  );
}

import { notFound, redirect } from "next/navigation";
import { demoIndustries, slugOf } from "@/lib/demo";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return demoIndustries().map((i) => ({ industria: i.id }));
}

/** /demo-geo/autos lleva al informe desde la primera marca de la industria. */
export default async function DemoIndustry({ params }: PageProps<"/demo-geo/[industria]">) {
  const { industria } = await params;
  const industry = demoIndustries().find((i) => i.id === industria);
  if (!industry) notFound();
  redirect(`/demo-geo/${industry.id}/${slugOf(industry.brands[0].name)}`);
}

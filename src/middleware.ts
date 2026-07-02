import { NextResponse, type NextRequest } from "next/server";

// Sets a default language cookie based on the visitor's country (Vercel geo).
// USA → English, Mexico and everywhere else → Spanish.
// Only sets it when the visitor hasn't already chosen or been assigned one,
// so an explicit toggle or ?lang= always wins.
export function middleware(request: NextRequest) {
  const res = NextResponse.next();

  const hasChoice = request.cookies.has("n3-lang"); // user toggled
  const hasGeo = request.cookies.has("n3-geo"); // already geo-assigned

  if (!hasChoice && !hasGeo) {
    const country = request.headers.get("x-vercel-ip-country") ?? "";
    const lang = country === "US" ? "en" : "es";
    res.cookies.set("n3-geo", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  // Run on page routes only — skip Next internals, API and static assets
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

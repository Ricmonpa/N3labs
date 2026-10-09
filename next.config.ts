import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean URLs for the static client proposals living under public/.
  // The shared-card route reads these fonts from disk at runtime.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/app/Inter-*.ttf"],
    "/panel/opengraph-image": ["./src/app/Inter-*.ttf"],
    "/scan-geo/opengraph-image": ["./src/app/Inter-*.ttf"],
  },
  async redirects() {
    // The full GEO diagnosis is paid now: the hook leads to booking a call instead.
    return [
      { source: "/geo", destination: "/geotest.html", permanent: false },
      // The tours demo lives at /travy; keep old /demo links and the /travi spelling working.
      { source: "/demo", destination: "/travy", permanent: false },
      { source: "/demo/:path*", destination: "/travy", permanent: false },
      { source: "/travi", destination: "/travy", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/avante", destination: "/avante/index.html" },
      { source: "/avante/demo", destination: "/avante/demo/index.html" },
      { source: "/autycom", destination: "/autycom/index.html" },
      { source: "/leviton-legibilidad", destination: "/leviton-legibilidad/index.html" },
      { source: "/bubbleup", destination: "/bubbleup/index.html" },
      { source: "/travy", destination: "/travy/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/avante/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/autycom/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/leviton-legibilidad/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/bubbleup/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/travy/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

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
    return [{ source: "/geo", destination: "/geotest.html", permanent: false }];
  },
  async rewrites() {
    return [
      { source: "/avante", destination: "/avante/index.html" },
      { source: "/avante/demo", destination: "/avante/demo/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/avante/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

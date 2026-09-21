import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean URLs for the static client proposals living under public/.
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

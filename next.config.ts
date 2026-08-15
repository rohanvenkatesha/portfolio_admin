import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Firebase Storage download URLs. Next refuses to optimise remote images
     * from hosts that aren't explicitly allowed, which stops this app being
     * used as an open image proxy for arbitrary URLs.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

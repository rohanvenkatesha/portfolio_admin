import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * No remotePatterns: every image is a repo file under public/media, which
   * next/image optimises at build time. Adding a remote host here would also
   * let this app be used as an image proxy for it, so the list stays empty
   * until something actually needs to be there.
   */
};

export default nextConfig;

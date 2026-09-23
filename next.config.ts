import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Gomti-Sathi",
  assetPrefix: "/Gomti-Sathi/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

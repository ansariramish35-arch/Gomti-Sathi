import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/1M1B-PROJECT",
  assetPrefix: "/1M1B-PROJECT/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

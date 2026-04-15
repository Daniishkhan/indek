import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@indek/shared", "@indek/domain", "@indek/db"]
};

export default nextConfig;

import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in some subpaths.
  transpilePackages: ["three"],
};

export default config;

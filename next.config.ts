import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in some subpaths.
  transpilePackages: ["three"],
  // Permite um segundo servidor (preview) sem disputar a pasta de build do `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default config;

import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Importa só os ícones e primitivos usados em vez do barril inteiro.
  experimental: { optimizePackageImports: ["@phosphor-icons/react", "@base-ui/react", "cmdk"] },
  // three.js ships untranspiled ESM in some subpaths.
  transpilePackages: ["three"],
  // Permite um segundo servidor (preview) sem disputar a pasta de build do `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default config;

import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  // Keep local production builds modest on small assessment machines.
  experimental: { cpus: 2, webpackBuildWorker: false },
};
export default config;

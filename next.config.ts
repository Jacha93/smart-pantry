import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-Mode nur für Production (für Docker)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
};

export default nextConfig;

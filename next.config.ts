import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-Mode nur für Production (für Docker)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Optimierungen für Development-Mode
  ...(process.env.NODE_ENV === 'development' && {
    // Deaktiviere unnötige Optimierungen in Dev für bessere HMR-Performance
    swcMinify: false,
  }),
};

export default nextConfig;

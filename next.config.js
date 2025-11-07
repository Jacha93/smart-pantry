/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-Mode nur für Production (für Docker)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Optimierungen für Development-Mode
  ...(process.env.NODE_ENV === 'development' && {
    // Deaktiviere unnötige Optimierungen in Dev für bessere HMR-Performance
    swcMinify: false,
  }),
}

module.exports = nextConfig

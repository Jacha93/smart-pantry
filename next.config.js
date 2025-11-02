/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-Mode nur für Production (für Docker)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
}

module.exports = nextConfig

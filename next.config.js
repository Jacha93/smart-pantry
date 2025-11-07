/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-Mode nur für Production (für Docker)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Next.js 16: Turbopack ist jetzt Standard, keine explizite Konfiguration nötig
  // React Compiler Support (stabil in Next.js 16) - optional, kann später aktiviert werden
  // reactCompiler: true, // Benötigt babel-plugin-react-compiler
}

module.exports = nextConfig

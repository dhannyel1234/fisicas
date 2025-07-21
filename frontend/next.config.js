/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/:path*`
      }
    ];
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },

  // Variáveis de ambiente públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_APP_NAME: 'Hyper-V Platform',
    NEXT_PUBLIC_APP_VERSION: '1.0.0'
  },

  // Configurações de imagem
  images: {
    domains: ['cdn.discordapp.com'],
    formats: ['image/webp', 'image/avif']
  },

  // Configurações experimentais
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },

  // Configurações de output
  output: 'standalone',
  
  // ESLint
  eslint: {
    dirs: ['pages', 'components', 'lib', 'hooks', 'store']
  },

  // TypeScript
  typescript: {
    tsconfigPath: './tsconfig.json'
  }
};

module.exports = nextConfig;
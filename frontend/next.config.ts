import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Keboola Docker deployment

  // Flatten standalone output so server.js lands at standalone/server.js
  outputFileTracingRoot: __dirname,

  // Proxy /api/* to the FastAPI backend during local development
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8050/api/:path*' },
    ]
  },
}

export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Keboola Docker deployment

  // Set tracing root to frontend/ so standalone output is flat:
  // server.js lands at standalone/server.js (not nested by absolute path).
  // In Docker: /app/frontend/.next/standalone/server.js
  outputFileTracingRoot: __dirname,

  // Proxy /api/* to the FastAPI backend during local development
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8050/api/:path*' },
    ]
  },
}

export default nextConfig

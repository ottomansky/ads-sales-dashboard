import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Keboola Docker deployment

  // Set tracing root to project root (parent of frontend/).
  // This makes standalone output use paths relative to the project root,
  // so server.js lands at standalone/frontend/server.js — matching
  // the Docker container path /app/frontend/.next/standalone/frontend/server.js
  outputFileTracingRoot: path.join(__dirname, '../'),

  // Proxy /api/* to the FastAPI backend during local development
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8050/api/:path*' },
    ]
  },
}

export default nextConfig

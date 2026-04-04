#!/bin/bash
set -Eeuo pipefail

# Install Python backend dependencies
cd /app/backend && uv sync &

# Install Node.js deps + build Next.js standalone
cd /app/frontend && npm install --no-audit --no-fund && npm run build \
  && cp -R .next/static .next/standalone/.next/static \
  && cp -R public .next/standalone/public &

wait

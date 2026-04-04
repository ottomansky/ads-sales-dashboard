#!/bin/bash
set -Eeuo pipefail

# Install Python dependencies
cd /app/backend && uv sync

# Install Node.js runtime dependencies for Next.js standalone server.
# The standalone build is committed to git but node_modules is gitignored.
# This installs only production deps (~10s) so server.js can resolve 'next'.
cd /app/frontend/.next/standalone/frontend && npm install --omit=dev --no-audit --no-fund

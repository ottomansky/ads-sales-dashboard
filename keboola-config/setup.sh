#!/bin/bash
set -Eeuo pipefail

# Install Python + Node.js deps in parallel for faster startup
cd /app/backend && uv sync &
cd /app/frontend && npm install --omit=dev --no-audit --no-fund &
wait

#!/bin/bash
set -e
echo "=== Step 1: Vite build ==="
vite build
echo "=== Step 2: Esbuild server ==="
esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outfile=api/index.js
echo "=== Step 3: Copy public ==="
node scripts/copy-public.mjs
echo "=== Build complete ==="

#!/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
for PID in $(lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true); do kill -9 "$PID" 2>/dev/null || true; done
cd "$ROOT_DIR"
if [ ! -x "node_modules/.bin/vite" ]; then npm install --legacy-peer-deps; fi
exec npm run dev -- --host 127.0.0.1 --port 3000

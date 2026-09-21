#!/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
for PID in $(lsof -tiTCP:8000 -sTCP:LISTEN 2>/dev/null || true); do kill -9 "$PID" 2>/dev/null || true; done
cd "$ROOT_DIR/backend"
if [ ! -x "venv/bin/python" ]; then python3 -m venv venv; fi
source venv/bin/activate
if ! python3 -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  python3 -m pip install -r requirements.txt
fi
exec python3 -m uvicorn main:app --reload --port 8000

#!/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

for PID in $(lsof -tiTCP:8000 -sTCP:LISTEN 2>/dev/null || true); do kill -9 "$PID" 2>/dev/null || true; done
for PID in $(lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true); do kill -9 "$PID" 2>/dev/null || true; done

cd "$ROOT_DIR/backend"
if [ ! -x "venv/bin/python" ]; then python3 -m venv venv; fi
source venv/bin/activate
if ! python3 -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  python3 -m pip install -r requirements.txt
fi
python3 -m uvicorn main:app --reload --port 8000 > /tmp/urdhva_backend.log 2>&1 &
BACK_PID=$!

cd "$ROOT_DIR"
if [ ! -x "node_modules/.bin/vite" ]; then npm install --legacy-peer-deps; fi
npm run dev -- --host 127.0.0.1 --port 3000 > /tmp/urdhva_frontend.log 2>&1 &
FRONT_PID=$!

cleanup() {
  kill "$FRONT_PID" "$BACK_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

for i in {1..30}; do
  if curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1 && curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
    open http://127.0.0.1:3000
    echo
    echo "URDHVA is running"
    echo "Frontend: http://127.0.0.1:3000"
    echo "Backend : http://127.0.0.1:8000"
    echo "API docs: http://127.0.0.1:8000/docs"
    echo "Backend log: /tmp/urdhva_backend.log"
    echo "Frontend log: /tmp/urdhva_frontend.log"
    echo "Press Ctrl+C to stop both."
    wait "$FRONT_PID"
    exit 0
  fi
  sleep 1
done

echo "URDHVA did not become ready within 30 seconds." >&2
echo "Backend log: /tmp/urdhva_backend.log" >&2
echo "Frontend log: /tmp/urdhva_frontend.log" >&2
exit 1

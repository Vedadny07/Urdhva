# URDHVA V14 — Final Localhost Start

## One Terminal
From the extracted V14 project folder:

```bash
chmod +x START_BOTH_MAC.sh
./START_BOTH_MAC.sh
```

The script frees ports 8000/3000, creates the backend virtual environment if needed, installs missing dependencies, starts FastAPI on 8000, starts Vite on 3000, waits for both health checks, and opens the browser.

Frontend: http://127.0.0.1:3000
Backend: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs

Press Ctrl+C in the terminal to stop both processes started by the script.

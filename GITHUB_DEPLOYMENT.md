# URDHVA GitHub deployment

## Repository
Push the repository source to GitHub. Do not commit `node_modules`, `backend/venv`, `backend/urdhva.db`, caches or secrets.

## Frontend on GitHub Pages
The included workflow `.github/workflows/deploy-pages.yml` builds the React/Vite frontend and deploys `dist`. Add a repository variable named `URDHVA_API_BASE_URL` with the public origin of your deployed FastAPI backend. GitHub Pages cannot run the FastAPI process itself.

## Backend
Deploy the `backend/` directory to a Python host that supports FastAPI/Uvicorn. Set `URDHVA_JWT_SECRET` to a secure random value and configure any authorized utility/ULPIN adapters with environment variables.

## Local
Run `./START_BOTH_MAC.sh` on macOS for the local prototype.

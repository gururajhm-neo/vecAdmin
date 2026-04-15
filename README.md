# Weaviate Admin UI

Open-source admin dashboard for self-hosted or managed Weaviate clusters.

This repository includes:
- `weaviate-admin-api`: FastAPI backend (auth, Weaviate proxy, scoped queries)
- `weaviate-admin-ui`: React + TypeScript frontend (dashboard, schema viewer, data browser, query playground)
- Deployment and setup docs for local, Docker, and EC2 environments

## Features

- JWT-based authentication and protected API routes
- Dashboard with health status, object counts, and memory metrics
- Schema viewer with class/property inspection
- Data browser with pagination, object detail modal, and similarity search
- Query playground with read-only GraphQL validation
- Configurable data scoping via environment variables (default `project_id`)

## Project Structure

```text
.
├── weaviate-admin-api/
├── weaviate-admin-ui/
├── docker-compose.yml
├── start-dev.sh
├── stop-dev.sh
├── DEPLOYMENT.md
├── WEAVIATE_SETUP.md
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- A running Weaviate instance (local or remote)

### 1) Clone and start both services

```bash
./start-dev.sh
```

The script initializes both backend and frontend, creates `.env` files if missing, and starts:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### 2) Default demo credentials

- `engineer1@example.com` / `admin123`
- `engineer2@example.com` / `admin123`

## Configuration

### Backend (`weaviate-admin-api/.env`)

Copy from `weaviate-admin-api/.env.example` and customize:

- `WEAVIATE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `SCOPE_FIELD_NAME` (default: `project_id`)
- `SCOPE_FIELD_VALUE_TYPE` (`int` or `string`)
- `AUTH_USERS_JSON` (optional bootstrap users)
- `PROJECT_METADATA_JSON` (optional friendly scope labels)

### Frontend (`weaviate-admin-ui/.env`)

Copy from `weaviate-admin-ui/.env.example` and customize:

- `REACT_APP_API_URL`
- `REACT_APP_ORGANIZATION_NAME`
- `REACT_APP_APP_TITLE`
- `REACT_APP_APP_DESCRIPTION`
- optional demo credential env vars

## Development Commands

### Backend

```bash
cd weaviate-admin-api
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Run backend tests:

```bash
cd weaviate-admin-api
source venv/bin/activate
pip install -r requirements-dev.txt
PYTHONPATH=. pytest -q
```

### Frontend

```bash
cd weaviate-admin-ui
npm install
npm start
```

Run frontend tests and production build:

```bash
cd weaviate-admin-ui
CI=true npm test -- --watch=false --passWithNoTests
npm run build
```

## Deployment

- See `DEPLOYMENT.md` for EC2 + Nginx + systemd deployment.
- See `WEAVIATE_SETUP.md` for local/remote Weaviate setup options.

## Open-Source Notes

- Brand/custom text is environment-configurable.
- Demo users are intended for local development only.
- Set strong secrets and production auth/user management before internet-facing deployment.

## License

Choose and add your license file (for example MIT or Apache-2.0) before public release.
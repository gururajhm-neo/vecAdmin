# VecAdmin — Open-Source Vector DB Admin UI

A **production-ready admin dashboard** for managing vector databases — supports **Weaviate**, **Qdrant**, **ChromaDB**, and **FAISS** with a single configuration change.

> Built with FastAPI + React + TypeScript + MUI v5. Swap your vector DB backend in one env var.

![Provider chips: Weaviate (green), Qdrant (pink), ChromaDB (orange)]()

## ✨ Features

- 🔌 **Multi-provider** — Weaviate · Qdrant · ChromaDB · FAISS (one `DB_PROVIDER` env var to switch)
- 🔐 **JWT authentication** with configurable user accounts
- 📊 **Dashboard** — health status, object counts, memory metrics
- 🗂️ **Schema viewer** — collections/classes with property inspection and visual graph
- 🔍 **Data browser** — pagination, object detail modal, similarity search
- 🧪 **Query playground** — GraphQL (Weaviate) or JSON (Qdrant/ChromaDB) with read-only validation
- 🎭 **Mock mode** — full demo without any DB (`REACT_APP_MOCK_MODE=true`)
- 🐳 **Docker Compose** — one command to run everything
- 🏢 **Multi-tenant scoping** — isolate data per user via any field (`project_id`, `tenant_id`, etc.)

## Project Structure

```text
.
├── weaviate-admin-api/    # FastAPI backend (Python 3.9+)
│   ├── app/
│   │   ├── providers/     # Weaviate / Qdrant / ChromaDB / FAISS implementations
│   │   ├── api/v1/        # REST endpoints
│   │   ├── services/      # Auth, provider shim
│   │   └── config.py      # All settings via env vars
│   └── requirements.txt
├── weaviate-admin-ui/     # React + TypeScript frontend
│   └── src/
│       ├── pages/         # Dashboard, Schema, Data, Query, Login
│       ├── components/    # Reusable MUI components
│       └── api/mock/      # Mock adapter for demo mode
├── docker-compose.yml
├── start-dev.sh           # Local dev launcher
├── start-mock.sh          # Demo mode launcher (no DB needed)
└── stop-dev.sh
```

## Quick Start

### Option 1 — Demo mode (no DB required)

```bash
./start-mock.sh
# Open http://localhost:3000
# Login: any of the 4 domain cards shown on the login screen
```

### Option 2 — Connect to a real vector DB

```bash
# 1. Configure your backend
cp weaviate-admin-api/.env.example weaviate-admin-api/.env
# Edit .env: set DB_PROVIDER and the matching connection settings

# 2. Start everything
./start-dev.sh
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Frontend UI |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | Swagger / OpenAPI |

**Default demo credentials:** `engineer1@example.com` / `admin123`

## Provider Configuration

Change one line in `weaviate-admin-api/.env`:

```bash
# Weaviate (default) — GraphQL query editor
DB_PROVIDER=weaviate
WEAVIATE_URL=http://localhost:8080

# Qdrant — JSON query editor, pink chip
DB_PROVIDER=qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# ChromaDB — JSON query editor, orange chip
DB_PROVIDER=chroma
CHROMA_HOST=localhost
CHROMA_PORT=8000

# FAISS — JSON query editor, blue chip (local flat-file, no server needed)
DB_PROVIDER=faiss
FAISS_INDEX_DIR=./faiss_data
```

Then restart the backend. The UI adapts automatically — provider chip color, query language, and editor help text all update to match.

## Configuration Reference

### Backend (`weaviate-admin-api/.env`)

| Variable | Default | Description |
|---|---|---|
| `DB_PROVIDER` | `weaviate` | `weaviate` \| `qdrant` \| `chroma` \| `faiss` |
| `WEAVIATE_URL` | `http://localhost:8080` | Weaviate instance URL |
| `QDRANT_HOST` | `localhost` | Qdrant host |
| `QDRANT_PORT` | `6333` | Qdrant port |
| `CHROMA_HOST` | `localhost` | ChromaDB host |
| `CHROMA_PORT` | `8000` | ChromaDB port |
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origins |
| `SCOPE_FIELD_NAME` | `project_id` | Field used to partition data per user |
| `AUTH_USERS_JSON` | *(see below)* | JSON array of user accounts |

### Frontend (`weaviate-admin-ui/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend URL (default: `http://localhost:8000/api/v1`) |
| `REACT_APP_MOCK_MODE` | `true` enables offline demo mode |
| `REACT_APP_ORGANIZATION_NAME` | Org name shown in top bar |

## Development Commands

```bash
# Backend
cd weaviate-admin-api && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend
cd weaviate-admin-ui && npm start

# Backend tests
PYTHONPATH=. pytest -q

# Frontend tests + build
CI=true npm test -- --watch=false --passWithNoTests
npm run build
```

## Docker

```bash
docker compose up --build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for EC2 + Nginx + systemd setup.

## License

This project is licensed under the Apache License 2.0. See `LICENSE`.

## Contributing

Contributions are welcome. Please review `CONTRIBUTING.md` before opening a pull request.

## Code of Conduct

Please review `CODE_OF_CONDUCT.md` to help keep this community open and respectful.

---

> Built and open-sourced by **[JNANIX NGPT Pvt Ltd](https://www.testneo.ai)** · [www.testneo.ai](https://www.testneo.ai)
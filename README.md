# VecAdmin — Open-Source Vector DB Admin UI

> **The pgAdmin / Mongo Express for vector databases.**  
> One dashboard, four backends — swap in 30 seconds.

[![GitHub Repo](https://img.shields.io/badge/GitHub-gururajhm--neo%2FvecAdmin-181717?logo=github)](https://github.com/gururajhm-neo/vecAdmin)
[![Live Demo](https://img.shields.io/badge/🎬%20Live%20Demo-View%20Screenshots%20%26%20Walkthrough-blue)](https://github.com/gururajhm-neo/vecAdmin/issues/1)

---

## 🎬 Live Demo

https://github.com/user-attachments/assets/7d11aa29-505c-4a8f-bc9d-b1cdcb88ee30

> Full walkthrough: [screenshots & issue thread →](https://github.com/gururajhm-neo/vecAdmin/issues/1)

No setup needed — run the mock mode locally in 30 seconds:

```bash
./start-mock.sh
# Open http://localhost:3000  →  Login: engineer1@example.com / admin123
```

---

VecAdmin is a production-ready admin UI for engineers and data teams who work
with vector databases every day but are tired of raw REST calls and CLI
gymnastics. Point it at **Weaviate**, **Qdrant**, **ChromaDB**, or **FAISS**,
and you get a full-featured dashboard with schema inspection, data browsing,
query execution, and an AI assistant that understands your collections — all
secured behind JWT auth.

Built with **FastAPI + React 18 + TypeScript + Material UI v5**.

---

## 🎯 Who is this for?

| Role | How VecAdmin helps |
|---|---|
| **ML / AI Engineers** | Browse embeddings, run similarity queries, inspect schemas without touching code |
| **Backend Engineers** | Explore and test vector DB collections during development; validate data pipelines |
| **Data Teams** | View object counts, filter records, understand collection structure across projects |
| **Platform / DevOps** | Monitor DB health, memory usage, and provider connectivity in one place |
| **OSS Evaluators** | Run the mock mode to demo the full UI with zero infrastructure |

---

## ✨ Features

- 🔌 **Multi-provider** — Weaviate · Qdrant · ChromaDB · FAISS (one `DB_PROVIDER` env var to switch)
- 🤖 **AI Assistant** — ask questions in plain English; the AI generates the right query syntax for your provider and explains results
- 🔐 **JWT authentication** with configurable user accounts
- 📊 **Dashboard** — health status, object counts, memory metrics per collection
- 🗂️ **Schema viewer** — collections/classes with property inspection and visual relationship graph
- 🔍 **Data browser** — pagination, object detail modal, similarity search
- 🧪 **Query playground** — GraphQL (Weaviate) or JSON (Qdrant / ChromaDB / FAISS) with read-only safety validation
- 🌱 **Seed script** — one command to populate any provider with realistic demo data
- 🎭 **Mock mode** — full demo without any DB (`REACT_APP_MOCK_MODE=true`)
- 🐳 **Docker Compose** — one command to run everything
- 🏢 **Multi-tenant scoping** — isolate data per user via any field (`project_id`, `tenant_id`, etc.)

---

## Project Structure

```text
.
├── weaviate-admin-api/    # FastAPI backend (Python 3.9+)
│   ├── app/
│   │   ├── providers/     # Weaviate / Qdrant / ChromaDB / FAISS implementations
│   │   ├── api/v1/        # REST endpoints
│   │   ├── services/      # Auth, AI (Groq/OpenAI/Anthropic/Ollama), provider shim
│   │   └── config.py      # All settings via env vars
│   └── requirements.txt
├── weaviate-admin-ui/     # React + TypeScript frontend
│   └── src/
│       ├── pages/         # Dashboard, Schema, Data, Query, Login
│       ├── components/    # Reusable MUI components
│       └── api/mock/      # Mock adapter for demo mode
├── scripts/
│   └── seed_demo_data.py  # Populate any provider with demo collections
├── docker-compose.yml
├── start-dev.sh           # Local dev launcher
├── start-mock.sh          # Demo mode launcher (no DB needed)
└── stop-dev.sh
```

---

## 🚀 Quick Start

### Option A — Demo mode (no DB, no setup)

```bash
./start-mock.sh
# Open http://localhost:3000
# Login: engineer1@example.com / admin123
```

Mock mode delivers the full UI experience — schema graph, data browser, query
playground, dashboard — driven entirely by static fixtures. No vector database
required.

---

### Option B — FAISS (easiest real DB, no server)

FAISS runs as a local flat-file store — no Docker, no server process.

```bash
# 1. Install backend deps
cd weaviate-admin-api
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# .env already defaults to DB_PROVIDER=faiss

# 3. Seed demo collections (Products · Articles · Users)
python3 ../scripts/seed_demo_data.py --provider faiss

# 4. Start
./start-dev.sh
# Open http://localhost:3000  →  Login: engineer1@example.com / admin123
```

---

### Option C — Qdrant, ChromaDB, or Weaviate

```bash
# 1. Start your vector DB (examples)
docker run -p 6333:6333 qdrant/qdrant                     # Qdrant
docker run -p 8001:8000 chromadb/chroma                   # ChromaDB
docker run -p 8080:8080 semitechnologies/weaviate:latest   # Weaviate

# 2. Configure backend
cp weaviate-admin-api/.env.example weaviate-admin-api/.env
# Edit DB_PROVIDER and the matching host/port/URL

# 3. Seed demo data
cd weaviate-admin-api && source venv/bin/activate
python3 ../scripts/seed_demo_data.py   # reads DB_PROVIDER from .env automatically

# 4. Start
./start-dev.sh
```

| URL | Service |
|---|---|
| http://localhost:3000 | Frontend UI |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | Swagger / OpenAPI |

---

## 🌱 Seeding Demo Data

`scripts/seed_demo_data.py` creates three realistic collections so you can
explore every feature immediately after first login:

| Collection | Records | Fields |
|---|---|---|
| **Products** | 20 | `name`, `category`, `price`, `in_stock` |
| **Articles** | 15 | `title`, `topic`, `author`, `views` |
| **Users** | 10 | `name`, `email`, `role`, `active`, `department` |

```bash
# Auto-detect provider from .env
python3 scripts/seed_demo_data.py

# Override provider explicitly
python3 scripts/seed_demo_data.py --provider faiss
python3 scripts/seed_demo_data.py --provider qdrant
python3 scripts/seed_demo_data.py --provider chroma
python3 scripts/seed_demo_data.py --provider weaviate
```

Once seeded, try these sample AI queries in the Query Playground:

```
Show me all Electronics products under $100
Find articles about AI written by Alice Chen
List active users in the Engineering department
```

---

## 🤖 AI Assistant

The Query Playground has a natural-language bar. Type a question and the AI
generates the correct query format for your active provider — GraphQL for
Weaviate, JSON for Qdrant / ChromaDB / FAISS — then explains results in plain
English.

VecAdmin supports **four AI backends** — pick whichever you already have:

| Provider | `AI_PROVIDER` | Key needed | Cost |
|---|---|---|---|
| **Groq** *(default)* | `groq` | `GROQ_API_KEY` | ✅ Free tier |
| **OpenAI** | `openai` | `OPENAI_API_KEY` | 💳 Pay-per-use |
| **Anthropic** | `anthropic` | `ANTHROPIC_API_KEY` | 💳 Pay-per-use |
| **Ollama** *(local)* | `ollama` | *(none)* | ✅ Free / offline |

### Setup

```bash
# ── Groq (free, recommended) ──────────────────────────────────
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...          # console.groq.com → free account
GROQ_MODEL=llama-3.3-70b-versatile

# ── OpenAI ────────────────────────────────────────────────────
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...         # platform.openai.com
OPENAI_MODEL=gpt-4o-mini

# ── Anthropic ─────────────────────────────────────────────────
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...  # console.anthropic.com
ANTHROPIC_MODEL=claude-3-haiku-20240307

# ── Ollama (local, no internet, no key) ───────────────────────
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
# brew install ollama && ollama pull llama3 && ollama serve
```

Then install the matching pip package (only if not already installed):

```bash
pip install openai       # OpenAI
pip install anthropic    # Anthropic
# Groq is already in requirements.txt
# Ollama needs no pip package — uses HTTP directly
```

### How it works

1. Click **"Ask AI"** in the Query Playground toolbar
2. Type a question — e.g. *"Show me all Electronics products under $50"*
3. The AI generates the query and pre-fills the editor
4. Run it, then click **"Explain"** to get a plain-English summary of the results

> If no key is configured (or Ollama isn't running) the AI bar is hidden and
> the playground works in manual mode.

---

## Provider Configuration

Change one line in `weaviate-admin-api/.env` and restart the backend.
The UI adapts automatically — provider chip color, query language, and editor
help text all update to match.

```bash
# Weaviate — GraphQL query editor, green chip
DB_PROVIDER=weaviate
WEAVIATE_URL=http://localhost:8080

# Qdrant — JSON query editor, pink chip
DB_PROVIDER=qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# ChromaDB — JSON query editor, orange chip
DB_PROVIDER=chroma
CHROMA_HOST=localhost
CHROMA_PORT=8001

# FAISS — JSON query editor, blue chip (no server needed)
DB_PROVIDER=faiss
FAISS_INDEX_DIR=./faiss_data
```

---

## Configuration Reference

### Backend (`weaviate-admin-api/.env`)

| Variable | Default | Description |
|---|---|---|
| `DB_PROVIDER` | `weaviate` | `weaviate` \| `qdrant` \| `chroma` \| `faiss` |
| `WEAVIATE_URL` | `http://localhost:8080` | Weaviate instance URL |
| `QDRANT_HOST` | `localhost` | Qdrant host |
| `QDRANT_PORT` | `6333` | Qdrant port |
| `CHROMA_HOST` | `localhost` | ChromaDB host |
| `CHROMA_PORT` | `8001` | ChromaDB port |
| `FAISS_INDEX_DIR` | `./faiss_data` | Directory for FAISS index files |
| `AI_PROVIDER` | `groq` | `groq` \| `openai` \| `anthropic` \| `ollama` |
| `GROQ_API_KEY` | *(optional)* | Groq API key — free at console.groq.com |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
| `OPENAI_API_KEY` | *(optional)* | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `ANTHROPIC_API_KEY` | *(optional)* | Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-3-haiku-20240307` | Anthropic model name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL (local) |
| `OLLAMA_MODEL` | `llama3` | Ollama model name |
| `JWT_SECRET` | *(required)* | JWT signing secret — **change before deploying** |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRATION_HOURS` | `24` | Token TTL in hours |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed frontend origins |
| `SCOPE_FIELD_NAME` | `project_id` | Field used to partition data per user |
| `AUTH_USERS_JSON` | *(see below)* | JSON array of user accounts |

### Frontend (`weaviate-admin-ui/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend URL (default: `http://localhost:8000/api/v1`) |
| `REACT_APP_MOCK_MODE` | `true` enables offline demo mode |
| `REACT_APP_ORGANIZATION_NAME` | Org name shown in the top navigation bar |

---

## Auth Configuration

Users are defined as a JSON array in `AUTH_USERS_JSON`.
The default ships two demo accounts:

```json
[
  {
    "email": "engineer1@example.com",
    "password": "admin123",
    "name": "Engineer One",
    "role": "admin",
    "project_id": "project-alpha"
  },
  {
    "email": "engineer2@example.com",
    "password": "admin123",
    "name": "Engineer Two",
    "role": "viewer",
    "project_id": "project-beta"
  }
]
```

> ⚠️ **Security:** Change `JWT_SECRET` and all passwords before any public or
> shared deployment. The defaults (`admin123`) are intentionally simple for
> local demos only.

---

## Multi-Tenant Isolation

`SCOPE_FIELD_NAME` (default: `project_id`) controls how VecAdmin partitions data
between users. Every query automatically appends a filter so users only see
records that match their own `project_id` (or whichever field you configure).

To disable scoping (single-tenant / full shared view):

```bash
SCOPE_FIELD_NAME=
```

See [ORG_ID_ISOLATION.md](ORG_ID_ISOLATION.md) for the full design.

---

## 🔧 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `"ready": false` on dashboard | Wrong host/port, or DB not running | Check DB is up; verify `DB_PROVIDER` and connection vars in `.env` |
| All object counts show 0 | Seed data not loaded | Run `python3 scripts/seed_demo_data.py` |
| AI bar not visible in Query Playground | Key not set for active `AI_PROVIDER` | Add the matching API key to `.env` and restart backend |
| CORS error in browser console | Frontend URL not in `CORS_ORIGINS` | Add your frontend URL to `CORS_ORIGINS` in `.env` |
| `faiss-cpu` import error on Apple Silicon | Architecture mismatch | `pip install faiss-cpu` inside the venv; avoid conda mixtures |
| Login returns 401 with correct password | `JWT_SECRET` changed while a token was active | Clear `localStorage` in the browser and log in again |
| Weaviate counts show 0 | Scope filter has no matching field | Set `SCOPE_FIELD_NAME=` to disable scoping |
| ChromaDB port conflict | ChromaDB defaults to 8000 (same as FastAPI default) | Run ChromaDB on 8001 and set `CHROMA_PORT=8001` |

---

## Development Commands

```bash
# ── Backend ──────────────────────────────────────────────────
cd weaviate-admin-api
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Run tests
PYTHONPATH=. pytest -q

# ── Frontend ─────────────────────────────────────────────────
cd weaviate-admin-ui
npm start          # dev server on :3000
npm test           # Jest unit tests
npm run build      # production build → build/
```

---

## Docker

```bash
docker compose up --build
```

This starts the backend (`:8000`) and frontend (`:3000`).
See [DEPLOYMENT.md](DEPLOYMENT.md) for EC2 + Nginx + systemd production setup.

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).

---

## Contributing

Contributions are welcome! The repo is at **https://github.com/gururajhm-neo/vecAdmin**.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request,
and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to help keep this community open
and respectful.

---

## Roadmap

See [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) for planned and in-progress features.

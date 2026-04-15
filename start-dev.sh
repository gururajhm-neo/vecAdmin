#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Weaviate Admin UI - Development Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/weaviate-admin-api"
FRONTEND_DIR="$SCRIPT_DIR/weaviate-admin-ui"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Kill ChromaDB if we started it
    if [ ! -z "$CHROMA_PID" ]; then
        echo -e "${YELLOW}Stopping ChromaDB (PID: $CHROMA_PID)...${NC}"
        kill $CHROMA_PID 2>/dev/null
    fi
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# ============================================
# BACKEND SETUP
# ============================================
echo -e "${BLUE}[1/4] Setting up Backend...${NC}"

cd "$BACKEND_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Activate venv and install dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOL'
WEAVIATE_URL=http://localhost:8080
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=http://localhost:3000
API_V1_PREFIX=/api/v1
APP_NAME=Weaviate Admin API
APP_DESCRIPTION=API for the Weaviate Admin Dashboard
APP_VERSION=1.0.0
SCOPE_FIELD_NAME=project_id
SCOPE_FIELD_VALUE_TYPE=int
EOL
fi

echo -e "${GREEN}✓ Backend setup complete${NC}\n"

# ============================================
# PROVIDER-AWARE DB STARTUP
# ============================================
echo -e "${BLUE}[1b/4] Checking vector DB provider...${NC}"

# Read DB_PROVIDER from .env
DB_PROVIDER=$(grep '^DB_PROVIDER=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
DB_PROVIDER=${DB_PROVIDER:-weaviate}
echo -e "  Provider: ${YELLOW}${DB_PROVIDER}${NC}"

CHROMA_PORT=$(grep '^CHROMA_PORT=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
CHROMA_PORT=${CHROMA_PORT:-8001}
QDRANT_PORT=$(grep '^QDRANT_PORT=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
QDRANT_PORT=${QDRANT_PORT:-6333}

CHROMA_PID=""

if [ "$DB_PROVIDER" = "chroma" ]; then
    # Check if ChromaDB is already running (use TCP check — v2 API removed /api/v1)
    _chroma_alive() { nc -z localhost "${CHROMA_PORT}" 2>/dev/null; }
    if _chroma_alive; then
        echo -e "${GREEN}✓ ChromaDB already running on :${CHROMA_PORT}${NC}"
    else
        echo -e "${YELLOW}Starting ChromaDB on :${CHROMA_PORT}...${NC}"
        source "$BACKEND_DIR/venv/bin/activate"
        # Try chroma CLI first, fall back to python -m
        if command -v chroma > /dev/null 2>&1; then
            chroma run --port "$CHROMA_PORT" > /tmp/chroma.log 2>&1 &
            CHROMA_PID=$!
        else
            python3 -m chromadb.cli.cli run --port "$CHROMA_PORT" > /tmp/chroma.log 2>&1 &
            CHROMA_PID=$!
        fi
        sleep 4
        if _chroma_alive; then
            echo -e "${GREEN}✓ ChromaDB started (PID: $CHROMA_PID)${NC}"
        else
            echo -e "${RED}✗ ChromaDB failed to start. Check: tail -f /tmp/chroma.log${NC}"
            echo -e "${YELLOW}  Try: pip install chromadb && chroma run --port ${CHROMA_PORT}${NC}"
        fi
    fi
    # Seed if empty (use Python client — works with both v1 and v2 API)
    source "$BACKEND_DIR/venv/bin/activate"
    COL_COUNT=$(python3 -W ignore -c "
import chromadb, sys
try:
    c = chromadb.HttpClient(host='localhost', port=${CHROMA_PORT})
    print(len(c.list_collections()))
except Exception:
    print('0')
" 2>/dev/null || echo "0")
    if [ "$COL_COUNT" = "0" ]; then
        echo -e "${YELLOW}No collections found — seeding demo data...${NC}"
        python3 "$SCRIPT_DIR/scripts/seed_demo_data.py" --provider chroma 2>/dev/null && \
            echo -e "${GREEN}✓ Demo data seeded (Products · Articles · Users)${NC}" || \
            echo -e "${YELLOW}⚠ Seed failed — start ChromaDB first, then run: python3 scripts/seed_demo_data.py --provider chroma${NC}"
    else
        echo -e "${GREEN}✓ ChromaDB has ${COL_COUNT} collection(s)${NC}"
    fi

elif [ "$DB_PROVIDER" = "qdrant" ]; then
    if curl -s "http://localhost:${QDRANT_PORT}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Qdrant already running on :${QDRANT_PORT}${NC}"
        source "$BACKEND_DIR/venv/bin/activate"
        COL_COUNT=$(python3 -W ignore -c "
from qdrant_client import QdrantClient
c = QdrantClient(host='localhost', port=${QDRANT_PORT}, timeout=5)
print(len(c.get_collections().collections))
" 2>/dev/null || echo "0")
        if [ "$COL_COUNT" = "0" ]; then
            echo -e "${YELLOW}No collections — seeding demo data...${NC}"
            python3 "$SCRIPT_DIR/scripts/seed_demo_data.py" --provider qdrant 2>/dev/null && \
                echo -e "${GREEN}✓ Demo data seeded${NC}" || true
        else
            echo -e "${GREEN}✓ Qdrant has ${COL_COUNT} collection(s)${NC}"
        fi
    else
        echo -e "${RED}✗ Qdrant not running on :${QDRANT_PORT}${NC}"
        echo -e "${YELLOW}  Start it with: docker run -p ${QDRANT_PORT}:6333 qdrant/qdrant${NC}"
    fi

elif [ "$DB_PROVIDER" = "faiss" ]; then
    FAISS_DIR=$(grep '^FAISS_INDEX_DIR=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
    FAISS_DIR=${FAISS_DIR:-./faiss_data}
    # Resolve relative path
    [[ "$FAISS_DIR" != /* ]] && FAISS_DIR="$BACKEND_DIR/$FAISS_DIR"
    if [ -d "$FAISS_DIR" ] && [ "$(ls -A "$FAISS_DIR" 2>/dev/null)" ]; then
        echo -e "${GREEN}✓ FAISS data found at ${FAISS_DIR}${NC}"
    else
        echo -e "${YELLOW}No FAISS data — seeding...${NC}"
        source "$BACKEND_DIR/venv/bin/activate"
        python3 "$SCRIPT_DIR/scripts/seed_demo_data.py" --provider faiss 2>/dev/null && \
            echo -e "${GREEN}✓ FAISS demo data seeded${NC}" || true
    fi

elif [ "$DB_PROVIDER" = "weaviate" ]; then
    WEAVIATE_URL=$(grep '^WEAVIATE_URL=' "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
    WEAVIATE_URL=${WEAVIATE_URL:-http://localhost:8080}
    if curl -s "${WEAVIATE_URL}/v1/.well-known/ready" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Weaviate reachable at ${WEAVIATE_URL}${NC}"
    else
        echo -e "${RED}✗ Weaviate not reachable at ${WEAVIATE_URL}${NC}"
        echo -e "${YELLOW}  Start it with: docker run -p 8080:8080 semitechnologies/weaviate:latest${NC}"
    fi
fi
echo ""

# ============================================
# FRONTEND SETUP
# ============================================
echo -e "${BLUE}[2/4] Setting up Frontend...${NC}"

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies (this may take a few minutes)...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install frontend dependencies${NC}"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOL'
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_ORGANIZATION_NAME=Your Organization
REACT_APP_APP_TITLE=Weaviate Admin
REACT_APP_APP_DESCRIPTION=Admin tool for monitoring and managing Weaviate
REACT_APP_DEMO_USER_1_EMAIL=engineer1@example.com
REACT_APP_DEMO_USER_1_PASSWORD=admin123
REACT_APP_DEMO_USER_2_EMAIL=engineer2@example.com
REACT_APP_DEMO_USER_2_PASSWORD=admin123
EOL
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}\n"

# ============================================
# START SERVICES
# ============================================
echo -e "${BLUE}[3/4] Starting Services...${NC}\n"

# Start Backend
echo -e "${YELLOW}Starting Backend on http://localhost:8000...${NC}"
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 > /tmp/weaviate-backend.log 2>&1 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check logs: tail -f /tmp/weaviate-backend.log${NC}"
    exit 1
fi

# Start Frontend
echo -e "${YELLOW}Starting Frontend on http://localhost:3000...${NC}"
cd "$FRONTEND_DIR"
PORT=3000 npm start > /tmp/weaviate-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check logs: tail -f /tmp/weaviate-frontend.log${NC}"
    cleanup
    exit 1
fi

# ============================================
# ALL DONE
# ============================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  🚀 All Services Running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "  ${BLUE}Backend:${NC}   http://localhost:8000"
echo -e "  ${BLUE}API Docs:${NC}  http://localhost:8000/docs"
echo -e "  ${BLUE}Provider:${NC}  ${YELLOW}${DB_PROVIDER}${NC}"
echo -e ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo -e "  Email: engineer1@example.com"
echo -e "  Password: admin123"
echo -e ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f /tmp/weaviate-backend.log"
echo -e "  Frontend: tail -f /tmp/weaviate-frontend.log"
echo -e ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Keep script running and wait for Ctrl+C
wait


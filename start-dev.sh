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
EOL
fi

echo -e "${GREEN}✓ Backend setup complete${NC}\n"

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
    echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env
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
echo -e ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo -e "  Email: engineer1@testneo.ai"
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


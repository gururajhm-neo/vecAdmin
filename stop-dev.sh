#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Weaviate Admin UI services...${NC}\n"

# Kill backend processes
BACKEND_PIDS=$(ps aux | grep "uvicorn app.main:app" | grep -v grep | awk '{print $2}')
if [ ! -z "$BACKEND_PIDS" ]; then
    echo -e "${YELLOW}Stopping backend processes...${NC}"
    echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo -e "${YELLOW}No backend processes found${NC}"
fi

# Kill frontend processes
FRONTEND_PIDS=$(ps aux | grep "react-scripts start" | grep -v grep | awk '{print $2}')
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo -e "${YELLOW}Stopping frontend processes...${NC}"
    echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Frontend stopped${NC}"
else
    echo -e "${YELLOW}No frontend processes found${NC}"
fi

# Kill node processes (in case react-scripts spawned child processes)
NODE_PIDS=$(ps aux | grep "node.*weaviate-admin-ui" | grep -v grep | awk '{print $2}')
if [ ! -z "$NODE_PIDS" ]; then
    echo -e "${YELLOW}Stopping remaining node processes...${NC}"
    echo "$NODE_PIDS" | xargs kill -9 2>/dev/null
fi

echo -e "\n${GREEN}All services stopped successfully!${NC}"


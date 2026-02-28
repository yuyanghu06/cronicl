#!/bin/bash

# Cronicl App - Complete Start Script
# Starts both frontend and backend services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Cronicl App...${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Setting up frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
cd ..

echo -e "${YELLOW}📦 Setting up backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Push database migrations
echo -e "${YELLOW}🗄️  Applying database migrations...${NC}"
npm run db:push || true

cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Function to cleanup on script exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${YELLOW}🚀 Starting backend on http://localhost:3000${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Start frontend
echo -e "${YELLOW}🚀 Starting frontend on http://localhost:5173${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ All services started!${NC}"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo -e "${GREEN}Backend:${NC} http://localhost:3000"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

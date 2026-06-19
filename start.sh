#!/bin/bash
# Start both backend and frontend
echo "Starting Training Club..."

# Start backend
cd backend && npm start &
BACKEND_PID=$!

# Start frontend
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "OK Backend:  http://localhost:3001"
echo "OK Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and handle exit
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

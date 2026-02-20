#!/bin/bash
echo "Starting SentinellAI Full-Stack Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT

# 1. Start Backend
echo "Starting Django Backend on port 8001..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8001 &
BACKEND_PID=$!
cd ..

# 2. Start Frontend
echo "Starting React Frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo "SentinellAI is running!"
echo "Backend: http://localhost:8001/api/"
echo "Frontend: http://localhost:5173/"
echo "Press Ctrl+C to stop."

wait $BACKEND_PID $FRONTEND_PID

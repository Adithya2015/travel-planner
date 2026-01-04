#!/bin/bash

echo "Starting Travel Planner App..."

# Kill any previous instances running on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing previous instances on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "Running on http://localhost:3000..."

PORT=3000 npm run dev

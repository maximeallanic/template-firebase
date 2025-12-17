#!/bin/bash

# Start dev server and emulators with proper signal handling
# This ensures emulators can export data on Ctrl+C

cleanup() {
    echo ""
    echo "Stopping dev server..."
    if [ -n "$VITE_PID" ] && kill -0 $VITE_PID 2>/dev/null; then
        kill $VITE_PID 2>/dev/null
    fi
    echo "Waiting for emulators to export and shutdown..."
    wait $EMU_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Vite dev server in background
npm run dev &
VITE_PID=$!

# Start Firebase emulators in background
npm run emulators &
EMU_PID=$!

# Wait for both processes
wait

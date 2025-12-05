#!/bin/bash

echo "🚀 Starting MIXR API Integration Tests"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please create a .env file with your DATABASE_URL and OPENAI_API_KEY"
  exit 1
fi

# Check if server is already running
if curl -s http://localhost:6174/health > /dev/null 2>&1; then
  echo "✅ Server is already running"
  echo ""
  echo "Running integration tests..."
  echo ""
  ~/.bun/bin/bun test src/integration.test.ts
  exit $?
fi

echo "⚠️  Server is not running on localhost:6174"
echo ""
echo "To run integration tests, you need to:"
echo "1. Start the server in one terminal: bun run dev"
echo "2. Run this script in another terminal"
echo ""
echo "Or you can start the server now in the background (press Ctrl+C to cancel):"
read -p "Start server in background? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Starting server in background..."
  ~/.bun/bin/bun run dev > /tmp/mixr-server.log 2>&1 &
  SERVER_PID=$!
  echo "Server PID: $SERVER_PID"

  # Wait for server to be ready
  echo "⏳ Waiting for server to be ready..."
  for i in {1..30}; do
    if curl -s http://localhost:6174/health > /dev/null 2>&1; then
      echo "✅ Server is ready!"
      break
    fi
    sleep 1
  done

  echo ""
  echo "Running integration tests..."
  echo ""
  ~/.bun/bin/bun test src/integration.test.ts
  TEST_EXIT_CODE=$?

  echo ""
  echo "🛑 Stopping server (PID: $SERVER_PID)..."
  kill $SERVER_PID 2>/dev/null

  exit $TEST_EXIT_CODE
else
  echo ""
  echo "❌ Test run cancelled"
  exit 1
fi

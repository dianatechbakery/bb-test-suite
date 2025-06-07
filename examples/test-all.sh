#!/bin/bash
# Combined test script for Brainbase and LLM integration

# Build the project
echo "Building the project..."
cd ..
npm run build

# Start the server in the background
echo "Starting the server..."
npm start &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for the server to start..."
sleep 5

# Run the test
echo "Running the combined integration test..."
cd examples
node test-all.js

# Kill the server
echo "Stopping the server..."
kill $SERVER_PID

echo "Test complete!"

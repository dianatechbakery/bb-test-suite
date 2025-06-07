#!/bin/bash
# Test script for Brainbase integration

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
echo "Running the Brainbase integration test..."
cd examples
node test-brainbase.js

# Kill the server
echo "Stopping the server..."
kill $SERVER_PID

echo "Test complete!"

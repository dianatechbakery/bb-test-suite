#!/bin/bash

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

# Run the example
echo "Running the example..."
cd examples
node test-flow.js

# Kill the server
echo "Stopping the server..."
kill $SERVER_PID

echo "Example complete!"

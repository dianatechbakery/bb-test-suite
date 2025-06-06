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

# Open the visualizer in the default browser
echo "Opening the visualizer..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "file://$(pwd)/examples/visualize-flow.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open "file://$(pwd)/examples/visualize-flow.html"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start "file://$(pwd)/examples/visualize-flow.html"
else
  echo "Unsupported OS. Please open the visualizer manually at:"
  echo "file://$(pwd)/examples/visualize-flow.html"
fi

# Wait for user to press Enter
echo ""
echo "Press Enter to stop the server and exit..."
read

# Kill the server
echo "Stopping the server..."
kill $SERVER_PID

echo "Visualizer closed!"

#!/bin/bash
# Simple test script for the BrainbaseRunner class

# Build the project
echo "Building the project..."
cd ..
npm run build

# Run the simple test script
echo "Running the simple BrainbaseRunner test..."
cd examples
node test-brainbase-runner-simple.js

echo "Test complete!"

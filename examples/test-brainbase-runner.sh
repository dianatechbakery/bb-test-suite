#!/bin/bash
# Test script for the BrainbaseRunner class

# Build the project
echo "Building the project..."
cd ..
npm run build

# Run the example script
echo "Running the BrainbaseRunner example..."
cd examples
node test-brainbase-runner.js

echo "Test complete!"

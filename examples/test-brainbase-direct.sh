#!/bin/bash
# Test script for direct Brainbase integration

# Build the project
echo "Building the project..."
cd ..
npm run build

# Run the direct test script
echo "Running the direct Brainbase integration test..."
cd examples
node test-brainbase-direct.js

echo "Test complete!"

/**
 * Simple test script for the BrainbaseRunner class
 * 
 * This script tests the basic functionality of the BrainbaseRunner class:
 * 1. Connecting to the Brainbase Engine
 * 2. Sending a simple message
 * 3. Receiving a response
 * 4. Closing the connection
 */

const { BrainbaseRunner } = require('../dist/runner/brainbase-runner');
const { config } = require('../dist/config');

// Configuration
const BRAINBASE_API_KEY = process.env.BRAINBASE_API_KEY || config.brainbase.apiKey;
const BRAINBASE_FLOW_ID = process.env.BRAINBASE_FLOW_ID || config.brainbase.defaultFlowId;
const BRAINBASE_WORKER_ID = process.env.BRAINBASE_WORKER_ID || config.brainbase.workerId;
const WS_HOST = process.env.BRAINBASE_WS_HOST || config.brainbase.wsHost;

// Main function to run the test
async function runSimpleTest() {
  console.log('Starting simple BrainbaseRunner test...');
  console.log(`API Key: ${BRAINBASE_API_KEY.substring(0, 10)}...`);
  console.log(`Flow ID: ${BRAINBASE_FLOW_ID}`);
  console.log(`Worker ID: ${BRAINBASE_WORKER_ID}`);
  console.log(`WebSocket Host: ${WS_HOST}`);
  console.log('------------------------------');
  
  // Create a new BrainbaseRunner instance
  const runner = new BrainbaseRunner({
    apiKey: BRAINBASE_API_KEY,
    flowId: BRAINBASE_FLOW_ID,
    workerId: BRAINBASE_WORKER_ID,
    host: WS_HOST
  });
  
  try {
    // Set up event handlers
    runner.on('message', (message) => {
      console.log(`Received message: ${message}`);
    });
    
    runner.on('stream', (chunk) => {
      // Stream chunks are handled in the _handleMessage method
    });
    
    runner.on('function_call', (data) => {
      console.log('Function call:', data);
    });
    
    runner.on('error', (error) => {
      console.error('Error:', error);
    });
    
    runner.on('unknown', (data) => {
      console.log('Received unknown message:', data);
    });
    
    runner.on('initialized', () => {
      console.log('Brainbase Engine initialized successfully');
    });
    
    // Connect to the Brainbase Engine
    console.log('Connecting to Brainbase Engine...');
    await runner.start();
    console.log('Connected successfully!');
    
    // Send a simple message
    console.log('Sending message: "Hello, Brainbase!"');
    await runner.sendMessage('Hello, Brainbase!');
    
    // Wait for the response
    console.log('Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Increased timeout to 5 seconds
    
    // Close the connection
    console.log('Closing connection...');
    await runner.close();
    console.log('Connection closed.');
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runSimpleTest();

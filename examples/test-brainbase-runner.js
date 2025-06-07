/**
 * Example script demonstrating how to use the BrainbaseRunner class directly
 * 
 * This script connects to the Brainbase Engine and allows for interactive
 * conversation with a Based flow.
 */

const { BrainbaseRunner } = require('../dist/runner/brainbase-runner');
const readline = require('readline');
const { config } = require('../dist/config');

// Configuration - you can override these with your own values
const API_KEY = process.env.BRAINBASE_API_KEY || config.brainbase.apiKey;
const FLOW_ID = process.env.BRAINBASE_FLOW_ID || config.brainbase.defaultFlowId;
const WORKER_ID = process.env.BRAINBASE_WORKER_ID || config.brainbase.workerId;
const WS_HOST = process.env.BRAINBASE_WS_HOST || config.brainbase.wsHost;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create a new BrainbaseRunner instance
const runner = new BrainbaseRunner({
  apiKey: API_KEY,
  flowId: FLOW_ID,
  workerId: WORKER_ID,
  host: WS_HOST
});

// Set up event handlers
runner.on('message', (message) => {
  console.log(`\nAgent: ${message}`);
});

runner.on('stream', (chunk) => {
  // Stream chunks are handled in the _handleMessage method
  // This event is emitted for each chunk of a streaming response
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

runner.on('close', () => {
  console.log('Connection closed');
  rl.close();
  process.exit(0);
});

// Main function to run the interactive chat
async function runInteractiveChat() {
  console.log('Starting interactive chat with Brainbase...');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`Flow ID: ${FLOW_ID}`);
  console.log(`Worker ID: ${WORKER_ID}`);
  console.log(`WebSocket Host: ${WS_HOST}`);
  console.log('------------------------------');
  console.log('Type "exit" or "quit" to end the conversation');
  console.log('------------------------------');
  
  try {
    // Connect to the Brainbase Engine
    console.log('Connecting to Brainbase Engine...');
    await runner.start();
    console.log('Connected successfully!');
    
    // Start the chat loop
    chatLoop();
  } catch (error) {
    console.error('Failed to connect:', error);
    rl.close();
    process.exit(1);
  }
}

// Function to handle the chat loop
function chatLoop() {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('Exiting chat...');
      await runner.close();
      rl.close();
      process.exit(0);
      return;
    }
    
    try {
      // Send the user's message to Brainbase
      await runner.sendMessage(input);
      
      // Continue the chat loop
      chatLoop();
    } catch (error) {
      console.error('Error sending message:', error);
      await runner.close();
      rl.close();
      process.exit(1);
    }
  });
}

// Run the interactive chat
runInteractiveChat();

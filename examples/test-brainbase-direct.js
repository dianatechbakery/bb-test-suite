/**
 * Test script for direct Brainbase integration using BrainbaseRunner
 * 
 * This script tests the Brainbase integration by:
 * 1. Creating a test scenario
 * 2. Using BrainbaseRunner to execute the scenario
 * 3. Reporting the results
 */

const { BrainbaseRunner } = require('../dist/runner/brainbase-runner');
const { config } = require('../dist/config');

// Configuration
const BRAINBASE_API_KEY = process.env.BRAINBASE_API_KEY || config.brainbase.apiKey;
const BRAINBASE_FLOW_ID = process.env.BRAINBASE_FLOW_ID || config.brainbase.defaultFlowId;
const BRAINBASE_WORKER_ID = process.env.BRAINBASE_WORKER_ID || config.brainbase.workerId;
const WS_HOST = process.env.BRAINBASE_WS_HOST || config.brainbase.wsHost;

// Create a simple test scenario
const scenario = {
  id: 'test_scenario_1',
  description: 'Simple test scenario for Brainbase',
  userPersona: 'A curious user who wants to learn about services',
  steps: [
    {
      id: 'step_1',
      message: 'Hello there!',
      expectedOutcome: 'chatbot'
    },
    {
      id: 'step_2',
      message: 'My phone number is 555-123-4567',
      expectedOutcome: null // No expected outcome since the flow ends after this message
    }
    // The flow ends after the user provides their phone number, so we don't need a third step
  ]
};

// Create a transcript to store the conversation
const transcript = [];

// Main function to run the test
async function runDirectTest() {
  console.log('Starting direct Brainbase integration test...');
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
  
  let success = true;
  let failureReason = '';
  
  try {
    // Set up event handlers
    runner.on('message', (message) => {
      console.log(`Agent: ${message}`);
      // Add the message to the transcript
      transcript.push({ role: 'assistant', content: message });
    });
    
    runner.on('stream', (chunk) => {
      // Stream chunks are handled in the _handleMessage method
    });
    
    runner.on('function_call', (data) => {
      console.log('Function call:', data);
      // Add function calls to the transcript as well
      const functionName = data.function || 'unknown_function';
      transcript.push({ role: 'function', content: `Function call: ${functionName}` });
    });
    
    runner.on('error', (error) => {
      console.error('Error:', error);
      success = false;
      failureReason = typeof error === 'string' ? error : 'Unknown error';
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
    
    // Execute each step in the scenario
    for (const step of scenario.steps) {
      console.log(`\nExecuting step ${step.id}: "${step.message}"`);
      transcript.push({ role: 'user', content: step.message });
      
      try {
        // Send the message to Brainbase
        await runner.sendMessage(step.message);
        
        // Wait for the response (in a real implementation, you would wait for the 'message' event)
        console.log('Waiting for response...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased timeout to 5 seconds
        
        // Get the last assistant message from the transcript
        // Find the last assistant message in the transcript
        let lastAssistantMessage = null;
        for (let i = transcript.length - 1; i >= 0; i--) {
          if (transcript[i].role === 'assistant') {
            lastAssistantMessage = transcript[i];
            break;
          }
        }
        
        // Check if the response contains the expected outcome
        if (step.expectedOutcome && lastAssistantMessage && !lastAssistantMessage.content.includes(step.expectedOutcome)) {
          success = false;
          failureReason = `Response did not match expected outcome at step ${step.id}`;
          console.error(`Expected response to contain "${step.expectedOutcome}" but got: "${lastAssistantMessage.content}"`);
          break;
        }
      } catch (error) {
        // If the WebSocket is closed, it means the flow has ended
        if (error.message && error.message.includes('WebSocket is not open')) {
          console.log('WebSocket connection was closed by the server. The flow has ended.');
          break;
        } else {
          // For other errors, rethrow
          throw error;
        }
      }
    }
    
    // Close the connection
    await runner.close();
    
    // Report the results
    console.log('\nTest result:');
    console.log(`Success: ${success}`);
    console.log('Transcript:');
    
    transcript.forEach((message) => {
      console.log(`[${message.role}]: ${message.content}`);
    });
    
    if (!success) {
      console.log(`Failure reason: ${failureReason}`);
    }
    
  } catch (error) {
    console.error('Test execution error:', error);
    success = false;
    failureReason = error instanceof Error ? error.message : 'Unknown error';
  }
  
  console.log('\nTest complete!');
}

// Run the test
runDirectTest();

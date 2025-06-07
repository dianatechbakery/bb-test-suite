/**
 * Test script for Brainbase integration
 * 
 * This script tests the Brainbase integration by:
 * 1. Parsing a Based flow
 * 2. Generating paths
 * 3. Creating scenarios
 * 4. Running a test against Brainbase
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { config } = require('../dist/config');

// Configuration
const API_URL = 'http://localhost:3000';
const BRAINBASE_API_KEY = process.env.BRAINBASE_API_KEY || config.brainbase.apiKey;
const BRAINBASE_FLOW_ID = process.env.BRAINBASE_FLOW_ID || config.brainbase.defaultFlowId;
const BRAINBASE_WORKER_ID = process.env.BRAINBASE_WORKER_ID || config.brainbase.workerId;

// Read the Based flow file
const basedFilePath = path.join(__dirname, 'simple-flow.based');
const basedCode = fs.readFileSync(basedFilePath, 'utf8');

async function testBrainbase() {
  try {
    console.log('Starting Brainbase integration test...');
    console.log('------------------------------');
    
    // Step 1: Parse the Based code
    console.log('Step 1: Parsing Based code...');
    const parseResponse = await axios.post(`${API_URL}/based/node`, {
      code: basedCode
    });
    
    const { nodes, edges } = parseResponse.data;
    console.log(`Parsed ${nodes.length} nodes and ${edges.length} edges.`);
    
    // Step 2: Generate paths
    console.log('\nStep 2: Generating paths...');
    const pathsResponse = await axios.post(`${API_URL}/based/paths`, {
      nodes,
      edges
    });
    
    const { paths } = pathsResponse.data;
    console.log(`Generated ${paths.length} possible conversation paths.`);
    
    if (paths.length === 0) {
      console.error('No paths generated. Exiting test.');
      return;
    }
    
    // Step 3: Generate a scenario for the first path
    console.log('\nStep 3: Generating test scenario...');
    const scenariosResponse = await axios.post(`${API_URL}/based/scenario`, {
      path: paths[0],
      nodes,
      count: 1
    });
    
    const { scenarios } = scenariosResponse.data;
    console.log('Generated test scenario:');
    console.log(JSON.stringify(scenarios[0], null, 2));
    
    // Step 4: Run the test against Brainbase
    console.log('\nStep 4: Running test against Brainbase...');
    console.log(`API Key: ${BRAINBASE_API_KEY.substring(0, 10)}...`);
    console.log(`Flow ID: ${BRAINBASE_FLOW_ID}`);
    
    const testResponse = await axios.post(`${API_URL}/based/test`, {
      scenario: scenarios[0],
      apiKey: BRAINBASE_API_KEY,
      flowId: BRAINBASE_FLOW_ID,
      workerId: BRAINBASE_WORKER_ID,
      queue: false // Run synchronously for testing
    });
    
    const { result } = testResponse.data;
    
    console.log('\nTest result:');
    console.log(`Success: ${result.success}`);
    console.log('Transcript:');
    
    result.transcript.forEach((message, index) => {
      console.log(`[${message.role}]: ${message.content}`);
    });
    
    if (!result.success) {
      console.log(`Failure reason: ${result.failureReason}`);
    }
    
    console.log('\nTest complete!');
    
  } catch (error) {
    console.error('Error testing Brainbase integration:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBrainbase();

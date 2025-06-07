/**
 * Combined test script for Brainbase and LLM integration
 * 
 * This script tests both the Brainbase integration and LLM integration by:
 * 1. Parsing a Based flow
 * 2. Generating paths
 * 3. Creating scenarios using the LLM service
 * 4. Running tests against Brainbase
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000';
const BRAINBASE_API_KEY = 'sk_3fb37da96d9c6b077699213e2a883507fc717e2fa40b58b22a2f36e9afa0';
const BRAINBASE_FLOW_ID = 'flow_50976a2a-5470-44b4-a131-18fec736cbda';
const BRAINBASE_WORKER_ID = 'worker_default';

// Read the Based flow file
const basedFilePath = path.join(__dirname, 'simple-flow.based');
const basedCode = fs.readFileSync(basedFilePath, 'utf8');

async function testAll() {
  try {
    console.log('Starting combined integration test...');
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
    
    // Step 3: Generate scenarios using LLM
    console.log('\nStep 3: Generating test scenarios with LLM...');
    const scenariosResponse = await axios.post(`${API_URL}/based/scenario`, {
      path: paths[0],
      nodes,
      count: 1
    });
    
    const { scenarios } = scenariosResponse.data;
    
    console.log('\nGenerated test scenario:');
    console.log(`User Persona: ${scenarios[0].userPersona}`);
    console.log('Steps:');
    scenarios[0].steps.forEach(step => {
      console.log(`- ${step.message}`);
    });
    
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
    
    console.log('\nCombined integration test complete!');
    
  } catch (error) {
    console.error('Error in combined integration test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAll();

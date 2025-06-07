/**
 * Test script for LLM integration
 * 
 * This script tests the LLM integration by:
 * 1. Parsing a Based flow
 * 2. Generating paths
 * 3. Creating scenarios using the LLM service
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000';

// Read the Based flow file
const basedFilePath = path.join(__dirname, 'simple-flow.based');
const basedCode = fs.readFileSync(basedFilePath, 'utf8');

async function testLLM() {
  try {
    console.log('Starting LLM integration test...');
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
      count: 2 // Generate 2 scenarios to compare
    });
    
    const { scenarios } = scenariosResponse.data;
    
    console.log('\nGenerated test scenarios:');
    scenarios.forEach((scenario, index) => {
      console.log(`\nScenario ${index + 1}:`);
      console.log(`User Persona: ${scenario.userPersona}`);
      console.log('Steps:');
      scenario.steps.forEach(step => {
        console.log(`- ${step.message}`);
      });
    });
    
    console.log('\nLLM integration test complete!');
    
  } catch (error) {
    console.error('Error testing LLM integration:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testLLM();

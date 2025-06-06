const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const BRAINBASE_API_KEY = 'your-api-key'; // Replace with your actual API key
const BRAINBASE_FLOW_ID = 'your-flow-id'; // Replace with your actual flow ID

// Read the Based flow file
const basedFilePath = path.join(__dirname, 'simple-flow.based');
const basedCode = fs.readFileSync(basedFilePath, 'utf8');

// Main function to test the flow
async function testFlow() {
  try {
    console.log('Starting test of Based flow...');
    console.log('------------------------------');
    
    // Step 1: Parse the Based code into nodes and edges
    console.log('Step 1: Parsing Based code...');
    const parseResponse = await axios.post(`${API_URL}/based/node`, {
      code: basedCode
    });
    
    const { nodes, edges } = parseResponse.data;
    console.log(`Parsed ${nodes.length} nodes and ${edges.length} edges.`);
    
    // Step 2: Generate all possible paths through the conversation
    console.log('\nStep 2: Generating paths...');
    const pathsResponse = await axios.post(`${API_URL}/based/paths`, {
      nodes,
      edges
    });
    
    const { paths } = pathsResponse.data;
    console.log(`Generated ${paths.length} possible conversation paths.`);
    
    // Step 3: Generate test scenarios for each path
    console.log('\nStep 3: Generating test scenarios...');
    const allScenarios = [];
    
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      console.log(`Generating scenarios for path ${i + 1}/${paths.length}...`);
      
      const scenariosResponse = await axios.post(`${API_URL}/based/scenario`, {
        path,
        nodes,
        count: 1 // Generate 1 scenario per path
      });
      
      const { scenarios } = scenariosResponse.data;
      allScenarios.push(...scenarios);
    }
    
    console.log(`Generated ${allScenarios.length} test scenarios.`);
    
    // Step 4: Run tests for each scenario
    console.log('\nStep 4: Running tests...');
    const testIds = [];
    
    for (let i = 0; i < allScenarios.length; i++) {
      const scenario = allScenarios[i];
      console.log(`Queueing test for scenario ${i + 1}/${allScenarios.length}...`);
      
      const testResponse = await axios.post(`${API_URL}/based/test`, {
        scenario,
        apiKey: BRAINBASE_API_KEY,
        flowId: BRAINBASE_FLOW_ID,
        queue: true // Queue the test for execution
      });
      
      const { testId } = testResponse.data;
      testIds.push(testId);
    }
    
    console.log(`Queued ${testIds.length} tests for execution.`);
    console.log('Test IDs:', testIds);
    
    // Note: In a real implementation, you would poll for test results
    console.log('\nTests are running in the background. In a real implementation, you would poll for results.');
    
    // Alternative: Use the all-in-one endpoint
    console.log('\nAlternative: Using the all-in-one endpoint...');
    const analyzeResponse = await axios.post(`${API_URL}/based/analyze`, {
      code: basedCode,
      scenarioCount: 1,
      apiKey: BRAINBASE_API_KEY,
      flowId: BRAINBASE_FLOW_ID,
      runTests: true
    });
    
    const { nodes: allNodes, edges: allEdges, paths: allPaths, scenarios: allScenarios2, testIds: allTestIds } = analyzeResponse.data;
    
    console.log(`All-in-one analysis complete:`);
    console.log(`- ${allNodes.length} nodes`);
    console.log(`- ${allEdges.length} edges`);
    console.log(`- ${allPaths.length} paths`);
    console.log(`- ${allScenarios2.length} scenarios`);
    console.log(`- ${allTestIds.length} tests queued`);
    
    console.log('\nTest complete!');
    
  } catch (error) {
    console.error('Error testing flow:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFlow();

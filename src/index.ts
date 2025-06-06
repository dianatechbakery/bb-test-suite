import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import { parseBasedCode } from './parser';
import { generatePaths } from './paths';
import { generateScenarios } from './scenarios';
import { runTest, queueTest, getTestResult } from './runner';
import { Node, Edge, Path, Scenario } from './types';

// Create Express app
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Parse Based code into nodes
app.post('/based/node', ((req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    const result = parseBasedCode(code);
    res.json(result);
  } catch (error) {
    console.error('Error parsing Based code:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}) as RequestHandler);

// Generate paths from nodes
app.post('/based/paths', ((req: Request, res: Response) => {
  try {
    const { nodes, edges } = req.body;
    
    if (!nodes || !edges) {
      return res.status(400).json({ error: 'Nodes and edges are required' });
    }
    
    const paths = generatePaths(nodes, edges);
    res.json({ paths });
  } catch (error) {
    console.error('Error generating paths:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}) as RequestHandler);

// Generate scenarios for a path
app.post('/based/scenario', (async (req: Request, res: Response) => {
  try {
    const { path, nodes, count = 1 } = req.body;
    
    if (!path || !nodes) {
      return res.status(400).json({ error: 'Path and nodes are required' });
    }
    
    const scenarios = await generateScenarios(path, nodes, count);
    res.json({ scenarios });
  } catch (error) {
    console.error('Error generating scenarios:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}) as RequestHandler);

// Run a test for a scenario
app.post('/based/test', (async (req: Request, res: Response) => {
  try {
    const { scenario, apiKey, flowId, queue = true } = req.body;
    
    if (!scenario || !apiKey || !flowId) {
      return res.status(400).json({ error: 'Scenario, API key, and flow ID are required' });
    }
    
    if (queue) {
      // Queue the test for execution
      const testId = queueTest(scenario, apiKey, flowId);
      res.json({ testId });
    } else {
      // Run the test synchronously
      const result = await runTest(scenario, apiKey, flowId);
      res.json({ result });
    }
  } catch (error) {
    console.error('Error running test:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}) as RequestHandler);

// Get the result of a test
app.get('/based/test/:id', ((req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Test ID is required' });
    }
    
    const result = getTestResult(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    
    res.json({ result });
  } catch (error) {
    console.error('Error getting test result:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}) as RequestHandler);

// Convenience endpoint to run all steps in one request
app.post('/based/analyze', (async (req: Request, res: Response) => {
  try {
    const { code, scenarioCount = 1, apiKey, flowId, runTests = false } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    // Step 1: Parse Based code into nodes
    const { nodes, edges } = parseBasedCode(code);
    
    // Step 2: Generate paths from nodes
    const paths = generatePaths(nodes, edges);
    
    // Step 3: Generate scenarios for each path
    const allScenarios: Scenario[] = [];
    
    for (const path of paths) {
      const scenarios = await generateScenarios(path, nodes, scenarioCount);
      allScenarios.push(...scenarios);
    }
    
    // Step 4: Run tests if requested
    const testIds: string[] = [];
    
    if (runTests && apiKey && flowId) {
      for (const scenario of allScenarios) {
        const testId = queueTest(scenario, apiKey, flowId);
        testIds.push(testId);
      }
    }
    
    res.json({
      nodes,
      edges,
      paths,
      scenarios: allScenarios,
      testIds
    });
  } catch (error) {
    console.error('Error analyzing Based code:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}) as RequestHandler);

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import { MockBrainbaseServer } from './brainbase-server';

/**
 * Start the mock Brainbase server
 * 
 * This script starts the mock Brainbase server on port 8080.
 * It can be run directly with `ts-node src/mock/start-mock-server.ts`
 * or after building with `node dist/mock/start-mock-server.js`.
 */

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const server = new MockBrainbaseServer(port);

console.log(`Mock Brainbase server started on port ${port}`);
console.log('Press Ctrl+C to stop the server');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping mock Brainbase server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping mock Brainbase server...');
  server.stop();
  process.exit(0);
});

import WebSocket from 'ws';

/**
 * Mock Brainbase WebSocket server for testing
 * 
 * This server emulates the Brainbase Engine's WebSocket API for testing purposes.
 * It listens for connections, handles initialization messages, and responds to user messages.
 */
export class MockBrainbaseServer {
  private server: WebSocket.Server;
  private port: number;
  private clients: Map<WebSocket, { initialized: boolean }> = new Map();
  
  /**
   * Create a new mock Brainbase server
   * @param port Port to listen on
   */
  constructor(port: number = 8080) {
    this.port = port;
    this.server = new WebSocket.Server({ port });
    
    this.server.on('connection', this.handleConnection.bind(this));
    
    console.log(`Mock Brainbase server running on ws://localhost:${port}`);
  }
  
  /**
   * Handle a new WebSocket connection
   * @param ws WebSocket connection
   * @param req HTTP request
   */
  private handleConnection(ws: WebSocket, req: any): void {
    console.log('Client connected to mock Brainbase server');
    console.log('Connection URL:', req.url);
    
    // Extract API key, flow ID, and worker ID from URL
    const url = new URL(`http://localhost${req.url}`);
    const apiKey = url.searchParams.get('api_key');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const workerId = pathParts[0];
    const flowId = pathParts[1];
    
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'none'}`);
    console.log(`Worker ID: ${workerId || 'none'}`);
    console.log(`Flow ID: ${flowId || 'none'}`);
    
    // Add client to the map
    this.clients.set(ws, { initialized: false });
    
    // Set up event handlers
    ws.on('message', (message: WebSocket.Data) => this.handleMessage(ws, message));
    
    ws.on('close', () => {
      console.log('Client disconnected from mock Brainbase server');
      this.clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error in mock Brainbase server:', error);
    });
  }
  
  /**
   * Handle a message from a client
   * @param ws WebSocket connection
   * @param message Message data
   */
  private handleMessage(ws: WebSocket, message: WebSocket.Data): void {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      const clientState = this.clients.get(ws);
      if (!clientState) {
        console.error('Client not found in map');
        return;
      }
      
      if (data.action === 'initialize') {
        // Handle initialization message
        console.log('Handling initialization message');
        clientState.initialized = true;
        
        // Send a welcome message
        this.sendResponse(ws, {
          action: 'message',
          data: {
            message: 'Welcome to the mock Brainbase Engine!'
          }
        });
      } else if (data.action === 'message') {
        // Handle user message
        if (!clientState.initialized) {
          this.sendResponse(ws, {
            action: 'error',
            data: {
              message: 'Client not initialized'
            }
          });
          return;
        }
        
        console.log('Handling user message:', data.data.message);
        
        // Send a response
        this.sendResponse(ws, {
          action: 'message',
          data: {
            message: `You said: "${data.data.message}". This is a mock response from the Brainbase Engine.`
          }
        });
      } else {
        console.log(`Unknown action: ${data.action}`);
        this.sendResponse(ws, {
          action: 'error',
          data: {
            message: `Unknown action: ${data.action}`
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendResponse(ws, {
        action: 'error',
        data: {
          message: 'Error parsing message'
        }
      });
    }
  }
  
  /**
   * Send a response to a client
   * @param ws WebSocket connection
   * @param response Response data
   */
  private sendResponse(ws: WebSocket, response: any): void {
    ws.send(JSON.stringify(response));
  }
  
  /**
   * Stop the server
   */
  public stop(): void {
    this.server.close();
    console.log('Mock Brainbase server stopped');
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  new MockBrainbaseServer(port);
}

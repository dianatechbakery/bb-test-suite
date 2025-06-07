import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * Interface for BrainbaseRunner options
 */
export interface BrainbaseRunnerOptions {
  workerId: string;
  flowId: string;
  apiKey: string;
  host?: string;
}

/**
 * TypeScript implementation of the BrainbaseRunner class
 * This class handles WebSocket communication with the Brainbase Engine
 */
export class BrainbaseRunner extends EventEmitter {
  private workerId: string;
  private flowId: string;
  private apiKey: string;
  private host: string;
  private url: string;
  private ws: WebSocket | null = null;
  private streamBuffer: string = "";
  private streamingActive: boolean = false;
  
  /**
   * Create a new BrainbaseRunner instance
   * @param options Configuration options
   */
  constructor(options: BrainbaseRunnerOptions) {
    super();
    this.workerId = options.workerId;
    this.flowId = options.flowId;
    this.apiKey = options.apiKey;
    this.host = options.host || 'wss://brainbase-engine-python.onrender.com';
    
    // Ensure the host has the correct protocol
    if (!this.host.startsWith('ws://') && !this.host.startsWith('wss://')) {
      this.host = `wss://${this.host}`;
    }
    
    // Construct the URL using the format from the Python implementation
    this.url = `${this.host}/${this.workerId}/${this.flowId}?api_key=${this.apiKey}`;
  }
  
  /**
   * Start the WebSocket connection and initialize the runner
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to Brainbase Engine at ${this.url}...`);
        
        // Create WebSocket connection with timeout
        this.ws = new WebSocket(this.url);
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.terminate();
            reject(new Error('Connection timeout: Failed to connect to Brainbase Engine'));
          }
        }, 10000); // 10 second timeout
        
        this.ws.on('open', async () => {
          clearTimeout(connectionTimeout);
          console.log(`Connected to ${this.url}`);
          
          try {
            await this._initialize();
            resolve();
          } catch (error) {
            console.error('Error during initialization:', error);
            reject(error);
          }
        });
        
        this.ws.on('message', (data) => {
          this._handleMessage(data.toString());
        });
        
        this.ws.on('error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          
          // Emit the error event
          this.emit('error', error);
          
          reject(error);
        });
        
        this.ws.on('close', (code, reason) => {
          clearTimeout(connectionTimeout);
          console.log(`WebSocket connection closed: ${code} ${reason}`);
          this.emit('close', { code, reason });
        });
      } catch (error) {
        console.error('Error starting BrainbaseRunner:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Send a message to the Brainbase Engine
   * @param message Message to send
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    // Format the message according to the Python implementation
    const chatMessage = {
      action: 'message',
      data: { message }
    };
    
    try {
      await this._send(chatMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  /**
   * Initialize the WebSocket connection
   * @private
   */
  private async _initialize(): Promise<void> {
    // Initialize with the same format as the Python implementation
    const initData = {
      streaming: true,
      deploymentType: process.env.DEPLOYMENT_TYPE || 'production'
    };
    
    const initMessage = {
      action: 'initialize',
      data: JSON.stringify(initData)
    };
    
    await this._send(initMessage);
    console.log('Initialization message sent.');
  }
  
  /**
   * Send a message to the WebSocket server
   * @param message Message to send
   * @private
   */
  private async _send(message: any): Promise<void> {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.ws!.send(JSON.stringify(message), (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Handle a message from the WebSocket server
   * @param data Message data
   * @private
   */
  private _handleMessage(data: string): void {
    try {
      // Try to parse the message as JSON
      let message;
      try {
        message = JSON.parse(data);
      } catch (e) {
        console.warn('Received non-JSON message:', data);
        this.emit('unknown', { data });
        return;
      }
      
      // Check if the message has an action
      const action = message.action;
      if (!action) {
        console.warn('Received message without action:', message);
        this.emit('unknown', message);
        return;
      }
      
      switch (action) {
        case 'message':
        case 'response':
          // Regular non-streaming message
          if (this.streamingActive) {
            console.log(); // finish any previous streaming output
            this.streamingActive = false;
            this.streamBuffer = "";
          }
          const messageText = message.data?.message || '';
          console.log('Agent:', messageText);
          this.emit('message', messageText);
          break;
          
        case 'stream':
          // Handle streaming content
          const streamChunk = message.data?.message || '';
          if (!this.streamingActive) {
            // First chunk of a streaming sequence
            process.stdout.write('Agent: ');
            this.streamingActive = true;
            this.streamBuffer = "";
          }
          
          // Print only the new chunk
          process.stdout.write(streamChunk);
          this.streamBuffer += streamChunk;
          this.emit('stream', streamChunk);
          break;
          
        case 'function_call':
          if (this.streamingActive) {
            console.log(); // ensure any pending streaming output ends
            this.streamingActive = false;
            this.streamBuffer = "";
          }
          const functionName = message.data?.function || '';
          console.log('Function call requested:', functionName);
          this.emit('function_call', message.data);
          break;
          
        case 'error':
          if (this.streamingActive) {
            console.log();
            this.streamingActive = false;
            this.streamBuffer = "";
          }
          const errorMessage = message.data?.message || '';
          console.error('Error from server:', errorMessage);
          
          // Check for specific error types
          if (errorMessage.includes('404')) {
            console.error('The requested resource was not found. Please check your API key, flow ID, and worker ID.');
          } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
            console.error('Authentication failed. Please check your API key.');
          } else if (errorMessage.includes('429')) {
            console.error('Rate limit exceeded. Please try again later.');
          }
          
          this.emit('error', errorMessage);
          break;
          
        case 'done':
          // End of a streamed message: add a newline.
          if (this.streamingActive) {
            console.log();
            this.streamingActive = false;
            const finalMessage = this.streamBuffer;
            this.streamBuffer = "";
            this.emit('done', finalMessage);
          }
          console.log('Operation completed successfully:', message.data);
          break;
          
        case 'initialized':
          // Handle initialization response
          console.log('Brainbase Engine initialized successfully');
          this.emit('initialized', message.data);
          break;
          
        default:
          if (this.streamingActive) {
            console.log();
            this.streamingActive = false;
            this.streamBuffer = "";
          }
          console.log('Unknown action received:', action);
          this.emit('unknown', message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      this.emit('error', error);
    }
  }
}

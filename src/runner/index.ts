import WebSocket from 'ws';
import { Scenario, TestResult, Message } from '../types';

/**
 * Interface for Brainbase WebSocket client options
 */
interface BrainbaseWSClientOptions {
  apiKey: string;
  flowId: string;
}

/**
 * Simple implementation of the Brainbase WebSocket client
 */
class BrainbaseWSClient {
  private ws: WebSocket | null = null;
  private messageQueue: string[] = [];
  private responseHandlers: ((response: string) => void)[] = [];
  private options: BrainbaseWSClientOptions;
  
  constructor(options: BrainbaseWSClientOptions) {
    this.options = options;
  }
  
  /**
   * Connect to the Brainbase WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://api.usebrainbase.com/ws?api_key=${this.options.apiKey}&flow_id=${this.options.flowId}`);
      
      this.ws.on('open', () => {
        console.log('Connected to Brainbase WebSocket');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          const handler = this.responseHandlers.shift();
          if (handler) {
            handler(message.text || '');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }
  
  /**
   * Send a message to the Brainbase WebSocket server
   * @param text Message text
   * @returns Response from the server
   */
  async sendMessage(text: string): Promise<string> {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    return new Promise((resolve) => {
      this.ws!.send(JSON.stringify({ type: 'message', text }));
      this.responseHandlers.push(resolve);
    });
  }
  
  /**
   * Disconnect from the Brainbase WebSocket server
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Run a test for a scenario
 * @param scenario Scenario to test
 * @param apiKey Brainbase API key
 * @param flowId Brainbase flow ID
 * @returns Test result
 */
export async function runTest(scenario: Scenario, apiKey: string, flowId: string): Promise<TestResult> {
  const client = new BrainbaseWSClient({ apiKey, flowId });
  
  const transcript: Message[] = [];
  let success = true;
  let failureReason = '';
  
  try {
    await client.connect();
    
    // Send initial message to start the conversation
    const initialResponse = await client.sendMessage('Hello');
    transcript.push({ role: 'assistant', content: initialResponse });
    
    // Execute each step in the scenario
    for (const step of scenario.steps) {
      transcript.push({ role: 'user', content: step.message });
      
      const response = await client.sendMessage(step.message);
      transcript.push({ role: 'assistant', content: response });
      
      // Simple check if response contains expected outcome
      if (step.expectedOutcome && !response.includes(step.expectedOutcome)) {
        success = false;
        failureReason = `Response did not match expected outcome at step ${step.id}`;
        break;
      }
    }
  } catch (error) {
    console.error('Test execution error:', error);
    success = false;
    failureReason = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    await client.disconnect();
  }
  
  return {
    success,
    transcript,
    failureReason: failureReason || undefined,
    scenario
  };
}

/**
 * Queue a test for execution
 * @param scenario Scenario to test
 * @param apiKey Brainbase API key
 * @param flowId Brainbase flow ID
 * @returns Test ID
 */
export function queueTest(scenario: Scenario, apiKey: string, flowId: string): string {
  const testId = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // In a real implementation, this would add the test to a queue
  // For the MVP, we'll just run the test immediately in the background
  setTimeout(() => {
    runTest(scenario, apiKey, flowId)
      .then(result => {
        // In a real implementation, this would store the result
        console.log(`Test ${testId} completed:`, result.success ? 'Success' : 'Failure');
      })
      .catch(error => {
        console.error(`Test ${testId} error:`, error);
      });
  }, 0);
  
  return testId;
}

/**
 * Get the result of a test
 * @param testId Test ID
 * @returns Test result
 */
export function getTestResult(testId: string): TestResult | null {
  // In a real implementation, this would retrieve the result from storage
  // For the MVP, we'll just return null
  return null;
}

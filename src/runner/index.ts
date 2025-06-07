import { Scenario, TestResult, Message } from '../types';
import { BrainbaseRunner, BrainbaseRunnerOptions } from './brainbase-runner';
import { config } from '../config';

/**
 * Run a test for a scenario
 * @param scenario Scenario to test
 * @param apiKey Brainbase API key
 * @param flowId Brainbase flow ID
 * @param workerId Brainbase worker ID (optional)
 * @returns Test result
 */
export async function runTest(
  scenario: Scenario, 
  apiKey: string, 
  flowId: string, 
  workerId: string = config.brainbase.workerId
): Promise<TestResult> {
  const runner = new BrainbaseRunner({ 
    apiKey, 
    flowId, 
    workerId,
    host: config.brainbase.wsHost
  });
  
  const transcript: Message[] = [];
  let success = true;
  let failureReason = '';
  
  try {
    // Set up message event handler
    runner.on('message', (content: string) => {
      transcript.push({ role: 'assistant', content });
    });
    
    // Set up error handler
    runner.on('error', (error: any) => {
      console.error('Error during test:', error);
      success = false;
      failureReason = typeof error === 'string' ? error : 'Unknown error';
    });
    
    // Connect to the Brainbase Engine
    await runner.start();
    
    // Execute each step in the scenario
    for (const step of scenario.steps) {
      transcript.push({ role: 'user', content: step.message });
      
      // Send the message
      await runner.sendMessage(step.message);
      
      // Wait for a response (in a real implementation, you would use events)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the last assistant message from the transcript
      const lastMessage = transcript[transcript.length - 1];
      
      // Simple check if response contains expected outcome
      if (step.expectedOutcome && lastMessage && !lastMessage.content.includes(step.expectedOutcome)) {
        success = false;
        failureReason = `Response did not match expected outcome at step ${step.id}`;
        console.error(`Expected response to contain "${step.expectedOutcome}" but got: "${lastMessage?.content || 'no response'}"`);
        break;
      }
    }
  } catch (error) {
    console.error('Test execution error:', error);
    success = false;
    failureReason = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    await runner.close();
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
 * @param workerId Brainbase worker ID (optional)
 * @returns Test ID
 */
export function queueTest(
  scenario: Scenario, 
  apiKey: string, 
  flowId: string, 
  workerId: string = config.brainbase.workerId
): string {
  const testId = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // In a real implementation, this would add the test to a queue
  // For the MVP, we'll just run the test immediately in the background
  setTimeout(() => {
    runTest(scenario, apiKey, flowId, workerId)
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

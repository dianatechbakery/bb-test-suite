/**
 * Configuration for the Brainbase Automated Testing Suite
 * 
 * This configuration includes API keys for testing purposes.
 * In a production environment, these should be replaced with environment variables.
 */

export const config = {
   brainbase: {
    apiKey: process.env.BRAINBASE_API_KEY || 'your_api_key_here', // Replace with your API key or use environment variable
    defaultFlowId: process.env.BRAINBASE_FLOW_ID || 'your_flow_id_here', // Replace with your flow ID or use environment variable
    workerId: process.env.BRAINBASE_WORKER_ID || 'worker_default', // Worker ID for Brainbase Engine
    wsHost: process.env.BRAINBASE_WS_HOST || 'wss://brainbase-engine-python.onrender.com' // WebSocket host for Brainbase Engine
  },
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo', // Default model to use
    temperature: 0.7, // Default temperature for creativity
    maxTokens: 500 // Default max tokens for responses
  }
};

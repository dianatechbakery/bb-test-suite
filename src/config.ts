/**
 * Configuration for the Brainbase Automated Testing Suite
 * 
 * To use this configuration, set the following environment variables:
 * - BRAINBASE_API_KEY: Your Brainbase API key
 * - BRAINBASE_FLOW_ID: The ID of your Based flow
 * - BRAINBASE_WORKER_ID: The worker ID for Brainbase Engine (optional)
 * - BRAINBASE_WS_HOST: The WebSocket host for Brainbase Engine (optional)
 * - OPENAI_API_KEY: Your OpenAI API key for LLM integration
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
    apiKey: process.env.OPENAI_API_KEY || ''
  }
};

/**
 * LLM service for generating scenarios
 * 
 * This service provides functions for generating user personas and messages using OpenAI's API.
 * It creates realistic test scenarios based on conversation paths in Based flows.
 */

import { Node, NodeType } from '../types';
import { config } from '../config';
import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;

/**
 * Generate a user persona using OpenAI
 * @param conditions Conditions from the Based flow
 * @param ifConditions If conditions from the Based flow
 * @returns User persona
 */
export async function generatePersonaWithLLM(
  conditions: string[], 
  ifConditions: string[]
): Promise<string> {
  try {
    if (!openai) {
      await initLLMService();
    }
    
    console.log('Generating user persona with OpenAI');
    console.log('Conditions:', conditions);
    console.log('If conditions:', ifConditions);
    
    // Create a prompt for the LLM
    const prompt = createPersonaPrompt(conditions, ifConditions);
    
    // Call OpenAI API
    const response = await openai!.chat.completions.create({
      model: config.llm.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates realistic user personas for testing conversational AI flows. Create detailed, specific personas that would naturally trigger the conditions provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.llm.temperature,
      max_tokens: config.llm.maxTokens
    });
    
    // Extract and return the persona
    const persona = response.choices[0]?.message?.content || createFallbackPersona(conditions, ifConditions);
    return persona;
  } catch (error) {
    console.error('Error generating persona with OpenAI:', error);
    // Fallback to template-based generation
    return createFallbackPersona(conditions, ifConditions);
  }
}

/**
 * Generate a user message using OpenAI
 * @param prompt Prompt from the Based flow
 * @param condition Condition that should be triggered
 * @param persona The user persona to use for context
 * @returns User message
 */
export async function generateMessageWithLLM(
  prompt: string,
  condition: string,
  persona: string = ''
): Promise<string> {
  try {
    if (!openai) {
      await initLLMService();
    }
    
    console.log('Generating user message with OpenAI');
    console.log('Prompt:', prompt);
    console.log('Condition:', condition);
    
    // Create a prompt for the LLM
    const messagePrompt = createMessagePrompt(prompt, condition, persona);
    
    // Call OpenAI API
    const response = await openai!.chat.completions.create({
      model: config.llm.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates realistic user messages for testing conversational AI flows. Create natural, conversational messages that would trigger the specified condition.'
        },
        {
          role: 'user',
          content: messagePrompt
        }
      ],
      temperature: config.llm.temperature,
      max_tokens: config.llm.maxTokens
    });
    
    // Extract and return the message
    const message = response.choices[0]?.message?.content || createFallbackMessage(condition);
    return message;
  } catch (error) {
    console.error('Error generating message with OpenAI:', error);
    // Fallback to template-based generation
    return createFallbackMessage(condition);
  }
}

/**
 * Initialize the LLM service
 * This function sets up the OpenAI client with the API key from config
 */
export async function initLLMService(): Promise<void> {
  try {
    console.log('Initializing OpenAI service');
    
    // Check if API key is available
    if (!config.llm.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Initialize OpenAI client
    openai = new OpenAI({
      apiKey: config.llm.apiKey
    });
    
    // Test the connection
    const response = await openai.chat.completions.create({
      model: config.llm.model,
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message to verify the OpenAI connection.'
        }
      ],
      max_tokens: 10
    });
    
    console.log('OpenAI service initialized successfully');
    return;
  } catch (error) {
    console.error('Error initializing OpenAI service:', error);
    throw error;
  }
}

/**
 * Create a prompt for generating a user persona
 * @param conditions Conditions from the Based flow
 * @param ifConditions If conditions from the Based flow
 * @returns Prompt for the LLM
 */
function createPersonaPrompt(conditions: string[], ifConditions: string[]): string {
  let prompt = `Create a detailed user persona for testing a conversational AI flow. The persona should be realistic and naturally trigger the following conditions during conversation:\n\n`;
  
  // Add conditions
  if (conditions.length > 0) {
    prompt += 'Conversation conditions:\n';
    conditions.forEach(condition => {
      prompt += `- ${condition}\n`;
    });
    prompt += '\n';
  }
  
  // Add if conditions
  if (ifConditions.length > 0) {
    prompt += 'User attributes:\n';
    ifConditions.forEach(condition => {
      prompt += `- ${condition}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `The persona should include:
- A name
- Background information
- Personality traits
- Specific needs or goals
- Any other relevant details that would make this a realistic user

Format the response as a second-person narrative (e.g., "You are Jane Smith, a 35-year-old marketing professional...").`;
  
  return prompt;
}

/**
 * Create a prompt for generating a user message
 * @param prompt Prompt from the Based flow
 * @param condition Condition that should be triggered
 * @param persona The user persona for context
 * @returns Prompt for the LLM
 */
function createMessagePrompt(prompt: string, condition: string, persona: string): string {
  let messagePrompt = `Generate a realistic user message that would trigger the following condition in a conversational AI flow:\n\n"${condition}"\n\n`;
  
  // Add context from the Based flow prompt
  if (prompt) {
    messagePrompt += `The AI is currently trying to: ${prompt}\n\n`;
  }
  
  // Add persona context if available
  if (persona) {
    messagePrompt += `User persona: ${persona}\n\n`;
  }
  
  messagePrompt += `The message should:
- Be natural and conversational
- Clearly trigger the specified condition
- Be consistent with the user persona (if provided)
- Be a single message (not a conversation)

Format the response as just the message text, without any additional explanation or formatting.`;
  
  return messagePrompt;
}

/**
 * Create a fallback persona if the LLM call fails
 * @param conditions Conditions from the Based flow
 * @param ifConditions If conditions from the Based flow
 * @returns Fallback persona
 */
function createFallbackPersona(conditions: string[], ifConditions: string[]): string {
  // Simple template-based persona generation
  const templates = [
    "You are Alex Johnson, a 32-year-old customer looking for assistance with a recent purchase.",
    "You are Sam Smith, a 45-year-old professional who needs help with your account settings.",
    "You are Taylor Williams, a 28-year-old new user who has questions about the service features."
  ];
  
  // Select a random template
  let persona = templates[Math.floor(Math.random() * templates.length)];
  
  // Add condition-specific details
  conditions.forEach(condition => {
    if (condition.includes("user says goodbye")) {
      persona += " You are in a hurry and need to end the conversation quickly.";
    } else if (condition.includes("user says they're bored")) {
      persona += " You have a short attention span and get bored easily during conversations.";
    } else if (condition.includes("user asks about services")) {
      persona += " You are particularly interested in learning about all available services.";
    } else if (condition.includes("user wants to speak to a human")) {
      persona += " You prefer speaking with human representatives rather than chatbots.";
    }
  });
  
  // Add if condition-specific details
  ifConditions.forEach(condition => {
    if (condition.includes("married")) {
      persona += " You are married with two children.";
    } else if (condition.includes("premium")) {
      persona += " You have a premium account and expect high-quality service.";
    }
  });
  
  return persona;
}

/**
 * Create a fallback message if the LLM call fails
 * @param condition Condition that should be triggered
 * @returns Fallback message
 */
function createFallbackMessage(condition: string): string {
  // Simple template-based message generation
  if (condition.includes("user says goodbye")) {
    return "I need to go now. Thanks for your help, but I have to run. Goodbye!";
  } else if (condition.includes("user says they're bored")) {
    return "This is getting pretty boring. Can we move on to something else?";
  } else if (condition.includes("user asks about services")) {
    return "I'd like to know more about the services you offer. Can you give me a detailed overview?";
  } else if (condition.includes("user wants to speak to a human")) {
    return "I'd prefer to speak with a human representative, please. Can you transfer me?";
  } else if (condition.includes("user wants a joke")) {
    return "I could use a good laugh. Tell me a joke to cheer me up, please.";
  } else if (condition.includes("user wants an activity")) {
    return "I'm looking for something fun to do. Can you suggest an interesting activity?";
  } else if (condition.includes("user says nevermind")) {
    return "Actually, nevermind. Let's talk about something else instead.";
  } else {
    return "I'm not sure what to say next. Can you help guide the conversation?";
  }
}

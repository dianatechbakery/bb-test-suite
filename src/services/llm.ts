/**
 * LLM service for generating scenarios
 * 
 * This service provides functions for generating user personas and messages using an LLM.
 * Currently, it uses template-based generation as a fallback, but can be extended to use
 * an actual LLM API like OpenAI.
 */

import { Node, NodeType } from '../types';

/**
 * Generate a user persona using an LLM
 * @param conditions Conditions from the Based flow
 * @param ifConditions If conditions from the Based flow
 * @returns User persona
 */
export async function generatePersonaWithLLM(
  conditions: string[], 
  ifConditions: string[]
): Promise<string> {
  // TODO: Implement actual LLM call
  // For now, use template-based generation as a fallback
  
  console.log('Generating user persona with template (LLM integration pending)');
  console.log('Conditions:', conditions);
  console.log('If conditions:', ifConditions);
  
  // Simple template-based persona generation
  const templates = [
    "Your name is Alex Johnson and you are a customer looking for assistance.",
    "Your name is Sam Smith and you need help with your account.",
    "Your name is Taylor Williams and you have questions about the service."
  ];
  
  // Select a random template
  let persona = templates[Math.floor(Math.random() * templates.length)];
  
  // Add condition-specific details
  conditions.forEach(condition => {
    if (condition.includes("user says goodbye")) {
      persona += " You will say goodbye after a few exchanges.";
    } else if (condition.includes("user says they're bored")) {
      persona += " You are feeling bored and uninterested in the conversation.";
    } else if (condition.includes("user asks about services")) {
      persona += " You are interested in learning about the available services.";
    } else if (condition.includes("user wants to speak to a human")) {
      persona += " You prefer to speak with a human representative.";
    }
  });
  
  // Add if condition-specific details
  ifConditions.forEach(condition => {
    if (condition.includes("married")) {
      persona += " You are married.";
    } else if (condition.includes("premium")) {
      persona += " You have a premium account.";
    }
  });
  
  return persona;
}

/**
 * Generate a user message using an LLM
 * @param prompt Prompt from the Based flow
 * @param condition Condition that should be triggered
 * @returns User message
 */
export async function generateMessageWithLLM(
  prompt: string,
  condition: string
): Promise<string> {
  // TODO: Implement actual LLM call
  // For now, use template-based generation as a fallback
  
  console.log('Generating user message with template (LLM integration pending)');
  console.log('Prompt:', prompt);
  console.log('Condition:', condition);
  
  // Simple template-based message generation
  if (condition.includes("user says goodbye")) {
    return "Goodbye, I need to go now. Thanks for your help!";
  } else if (condition.includes("user says they're bored")) {
    return "I'm feeling pretty bored with this conversation.";
  } else if (condition.includes("user asks about services")) {
    return "Can you tell me about the services you offer?";
  } else if (condition.includes("user wants to speak to a human")) {
    return "I'd like to speak with a human representative, please.";
  } else if (condition.includes("user wants a joke")) {
    return "Tell me a joke to cheer me up.";
  } else if (condition.includes("user wants an activity")) {
    return "Can you suggest something fun I could do?";
  } else if (condition.includes("user says nevermind")) {
    return "Actually, nevermind. Let's talk about something else.";
  } else {
    return "I'm not sure what to say next.";
  }
}

/**
 * Initialize the LLM service
 * This function would set up any necessary configuration for the LLM
 */
export function initLLMService(): void {
  console.log('Initializing LLM service (placeholder)');
  // TODO: Initialize LLM client, load API keys, etc.
}

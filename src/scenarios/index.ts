import { Node, Path, Scenario, ScenarioStep, NodeType } from '../types';
import { generatePersonaWithLLM, generateMessageWithLLM } from '../services/llm';

/**
 * Generate test scenarios for a path
 * @param path Path through the conversation flow
 * @param nodes Array of nodes
 * @param count Number of scenarios to generate
 * @returns Array of scenarios
 */
export async function generateScenarios(path: Path, nodes: Node[], count: number = 1): Promise<Scenario[]> {
  const scenarios: Scenario[] = [];
  
  // Get node objects for the path
  const pathNodes = path.map(nodeId => nodes.find(node => node.id === nodeId)).filter(Boolean) as Node[];
  
  // Extract conditions from path nodes
  const conditions = pathNodes
    .filter(node => node.type === NodeType.LOOP_UNTIL)
    .flatMap(node => node.data.until || []);
  
  // Extract if conditions
  const ifConditions = pathNodes
    .filter(node => node.type === NodeType.IF)
    .map(node => node.data.condition);
  
  // Generate scenarios using LLM
  for (let i = 0; i < count; i++) {
    try {
      // Generate a user persona using LLM
      const userPersona = await generatePersonaWithLLM(conditions, ifConditions);
      
      // Generate steps for the scenario
      const steps = await generateStepsWithLLM(pathNodes, userPersona);
      
      const scenario: Scenario = {
        id: `scenario_${i + 1}`,
        description: `Test scenario ${i + 1} for path with ${conditions.length} conditions`,
        userPersona,
        steps
      };
      
      scenarios.push(scenario);
    } catch (error) {
      console.error(`Error generating scenario ${i + 1}:`, error);
      // Fall back to template-based generation if LLM fails
      const scenario: Scenario = {
        id: `scenario_${i + 1}_fallback`,
        description: `Fallback test scenario ${i + 1} for path`,
        userPersona: generateFallbackUserPersona(conditions, ifConditions),
        steps: generateFallbackSteps(pathNodes)
      };
      
      scenarios.push(scenario);
    }
  }
  
  return scenarios;
}

/**
 * Generate conversation steps based on the path nodes using LLM
 * @param pathNodes Array of nodes in the path
 * @param userPersona The user persona for context
 * @returns Array of scenario steps
 */
async function generateStepsWithLLM(pathNodes: Node[], userPersona: string): Promise<ScenarioStep[]> {
  const steps: ScenarioStep[] = [];
  
  for (let i = 0; i < pathNodes.length; i++) {
    const node = pathNodes[i];
    
    if (node.type === NodeType.LOOP_UNTIL) {
      // For loop-until nodes, generate a message that triggers one of the conditions
      const condition = node.data.until && node.data.until.length > 0 
        ? node.data.until[Math.floor(Math.random() * node.data.until.length)]
        : "user responds to the prompt";
      
      const message = await generateMessageWithLLM(node.data.prompt, condition, userPersona);
      
      steps.push({
        id: `step_${i}`,
        message,
        expectedOutcome: condition
      });
    } else if (node.type === NodeType.BASED && node.data.code) {
      // Check if the code contains a say() function
      if (node.data.code.includes('say(')) {
        const sayMatch = node.data.code.match(/say\s*\(\s*["'](.+?)["']/);
        if (sayMatch) {
          const agentMessage = sayMatch[1];
          const condition = "user responds to agent message";
          
          const message = await generateMessageWithLLM(
            `Respond to the agent's message: "${agentMessage}"`,
            condition,
            userPersona
          );
          
          steps.push({
            id: `step_${i}`,
            message,
            expectedOutcome: "The agent should continue with the conversation flow."
          });
        }
      }
    }
  }
  
  return steps;
}

/**
 * Generate a fallback user persona based on conditions (used if LLM fails)
 * @param conditions Array of conditions
 * @param ifConditions Array of if conditions
 * @returns User persona
 */
function generateFallbackUserPersona(conditions: string[], ifConditions: string[]): string {
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
    } else if (condition.includes("user says they're excited")) {
      persona += " You are excited and enthusiastic about the conversation.";
    } else if (condition.includes("user says okay")) {
      persona += " You are agreeable and willing to follow suggestions.";
    } else if (condition.includes("user wants to be transferred")) {
      persona += " You prefer speaking with human representatives rather than chatbots.";
    }
  });
  
  // Add if condition-specific details
  ifConditions.forEach(condition => {
    if (condition.includes("married")) {
      persona += " You are married with two children.";
    } else if (condition.includes("user_info")) {
      persona += " You have an account with the service and expect high-quality support.";
    }
  });
  
  return persona;
}

/**
 * Generate fallback conversation steps based on the path nodes (used if LLM fails)
 * @param pathNodes Array of nodes in the path
 * @returns Array of scenario steps
 */
function generateFallbackSteps(pathNodes: Node[]): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  
  pathNodes.forEach((node, index) => {
    if (node.type === NodeType.LOOP_UNTIL) {
      steps.push({
        id: `step_${index}`,
        message: generateFallbackMessageForPrompt(node.data.prompt),
        expectedOutcome: "The agent should respond appropriately to the message."
      });
    } else if (node.type === NodeType.BASED && node.data.code) {
      // Check if the code contains a say() function
      if (node.data.code.includes('say(')) {
        const sayMatch = node.data.code.match(/say\s*\(\s*["'](.+?)["']/);
        if (sayMatch) {
          const agentMessage = sayMatch[1];
          steps.push({
            id: `step_${index}`,
            message: generateFallbackResponseToAgentMessage(agentMessage),
            expectedOutcome: "The agent should continue with the conversation flow."
          });
        }
      }
    }
  });
  
  return steps;
}

/**
 * Generate a fallback user message based on the prompt (used if LLM fails)
 * @param prompt Prompt from the talk function
 * @returns User message
 */
function generateFallbackMessageForPrompt(prompt: string): string {
  // Generate a user message based on the prompt
  if (prompt.includes("How are you")) {
    return "I'm doing well, thank you for asking! How about you?";
  } else if (prompt.includes("preferred contact method")) {
    return "I prefer to be contacted by email. It's more convenient for me.";
  } else if (prompt.includes("Talk to the user about their day")) {
    return "My day has been pretty good so far. I went for a walk this morning and had a productive afternoon. How can you help me today?";
  } else if (prompt.includes("Recommend the user talk to their spouse")) {
    return "That's a good idea, I'll definitely talk to them about it. Thanks for the suggestion.";
  } else if (prompt.includes("Silver & Fit")) {
    return "Yes, I'm calling about my own Silver & Fit membership. I have some questions about the benefits.";
  } else if (prompt.includes("gather the following customer information")) {
    return "My name is John Smith, my ZIP code is 12345, and my date of birth is January 15, 1970. Is there anything else you need?";
  }
  
  // Default response
  return "Hello, I need some help with your service. Can you assist me?";
}

/**
 * Generate a fallback user response to an agent message (used if LLM fails)
 * @param agentMessage Message from the agent
 * @returns User response
 */
function generateFallbackResponseToAgentMessage(agentMessage: string): string {
  // Generate a user response based on the agent message
  if (agentMessage.includes("Hello") || agentMessage.includes("Hi")) {
    return "Hi there! I'm hoping you can help me today.";
  } else if (agentMessage.includes("How can I help")) {
    return "I need some information about your services. Specifically, I'm wondering about pricing options.";
  } else if (agentMessage.includes("Thank you")) {
    return "You're welcome! I appreciate your assistance.";
  } else if (agentMessage.includes("Goodbye") || agentMessage.includes("bye")) {
    return "Goodbye! Thanks for your help today.";
  } else if (agentMessage.includes("?")) {
    return "Yes, that sounds good to me. Let's proceed with that option.";
  }
  
  // Default response
  return "I understand what you're saying. Please continue with the next steps.";
}

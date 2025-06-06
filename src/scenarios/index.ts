import { Node, Path, Scenario, ScenarioStep, NodeType } from '../types';

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
  
  // Simple template-based scenario generation
  for (let i = 0; i < count; i++) {
    const scenario: Scenario = {
      id: `scenario_${i + 1}`,
      description: `Test scenario ${i + 1} for path`,
      userPersona: generateUserPersona(conditions, ifConditions),
      steps: generateSteps(pathNodes)
    };
    
    scenarios.push(scenario);
  }
  
  return scenarios;
}

/**
 * Generate a user persona based on conditions
 * @param conditions Array of conditions
 * @param ifConditions Array of if conditions
 * @returns User persona
 */
function generateUserPersona(conditions: string[], ifConditions: string[]): string {
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
    } else if (condition.includes("user says they're excited")) {
      persona += " You are excited and enthusiastic about the conversation.";
    } else if (condition.includes("user says okay")) {
      persona += " You are agreeable and willing to follow suggestions.";
    } else if (condition.includes("user wants to be transferred")) {
      persona += " You want to speak with a human representative.";
    }
  });
  
  // Add if condition-specific details
  ifConditions.forEach(condition => {
    if (condition.includes("married")) {
      persona += " You are married.";
    } else if (condition.includes("user_info")) {
      persona += " You have an account with the service.";
    }
  });
  
  return persona;
}

/**
 * Generate conversation steps based on the path nodes
 * @param pathNodes Array of nodes in the path
 * @returns Array of scenario steps
 */
function generateSteps(pathNodes: Node[]): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  
  pathNodes.forEach((node, index) => {
    if (node.type === NodeType.LOOP_UNTIL) {
      steps.push({
        id: `step_${index}`,
        message: generateMessageForPrompt(node.data.prompt),
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
            message: generateResponseToAgentMessage(agentMessage),
            expectedOutcome: "The agent should continue with the conversation flow."
          });
        }
      }
    }
  });
  
  return steps;
}

/**
 * Generate a user message based on the prompt
 * @param prompt Prompt from the talk function
 * @returns User message
 */
function generateMessageForPrompt(prompt: string): string {
  // Generate a user message based on the prompt
  if (prompt.includes("How are you")) {
    return "I'm doing well, thank you for asking!";
  } else if (prompt.includes("preferred contact method")) {
    return "I prefer to be contacted by email.";
  } else if (prompt.includes("Talk to the user about their day")) {
    return "My day has been pretty good so far. I went for a walk this morning and had a productive afternoon.";
  } else if (prompt.includes("Recommend the user talk to their spouse")) {
    return "That's a good idea, I'll talk to them about it.";
  } else if (prompt.includes("Silver & Fit")) {
    return "Yes, I'm calling about my own Silver & Fit membership.";
  } else if (prompt.includes("gather the following customer information")) {
    return "My name is John Smith, my ZIP code is 12345, and my date of birth is January 15, 1970.";
  }
  
  // Default response
  return "Hello, I need some help.";
}

/**
 * Generate a user response to an agent message
 * @param agentMessage Message from the agent
 * @returns User response
 */
function generateResponseToAgentMessage(agentMessage: string): string {
  // Generate a user response based on the agent message
  if (agentMessage.includes("Hello") || agentMessage.includes("Hi")) {
    return "Hi there!";
  } else if (agentMessage.includes("How can I help")) {
    return "I need some information about your services.";
  } else if (agentMessage.includes("Thank you")) {
    return "You're welcome!";
  } else if (agentMessage.includes("Goodbye") || agentMessage.includes("bye")) {
    return "Goodbye!";
  } else if (agentMessage.includes("?")) {
    return "Yes, that sounds good.";
  }
  
  // Default response
  return "I understand. Please continue.";
}

/**
 * Type definitions for the Brainbase Automated Testing Suite
 */

/**
 * Node type representing a node in the Based flow
 */
export interface Node {
  id: string;
  type: NodeType;
  name: string;
  inputs: Port[];
  outputs: Port[];
  data: Record<string, any>;
}

/**
 * Port type representing an input or output connection point on a node
 */
export interface Port {
  id: string;
  name: string;
  type?: "input" | "output";
}

/**
 * Edge type representing a connection between nodes
 */
export interface Edge {
  id: string;
  source: {
    nodeId: string;
    portId?: string;
  };
  target: {
    nodeId: string;
    portId?: string;
  };
  condition?: EdgeCondition;
}

/**
 * Edge condition type representing a condition for an edge
 */
export type EdgeCondition =
  | {
      type: "ai";
      prompt: string; // natural language condition, e.g. "if user sounds angry"
    }
  | {
      type: "logic";
      expression: string; // Python-style, e.g. "input.value > 10"
    };

/**
 * Node type enum
 */
export enum NodeType {
  BASED = "based",
  LOOP_UNTIL = "loop-until",
  SWITCH = "switch",
  IF = "if",
  END = "end",
  JUMP = "jump"
}

/**
 * Path type representing a sequence of nodes to traverse
 */
export type Path = string[];

/**
 * Scenario type representing a test scenario
 */
export interface Scenario {
  id: string;
  description: string;
  userPersona: string;
  steps: ScenarioStep[];
}

/**
 * Scenario step type representing a step in a test scenario
 */
export interface ScenarioStep {
  id: string;
  message: string;
  expectedOutcome?: string;
}

/**
 * Test result type representing the result of a test
 */
export interface TestResult {
  success: boolean;
  transcript: Message[];
  failureReason?: string;
  scenario: Scenario;
}

/**
 * Message type representing a message in a conversation
 */
export interface Message {
  role: "user" | "assistant";
  content: string;
}

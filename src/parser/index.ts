import { Node, Edge, NodeType, Port, EdgeCondition } from '../types';

/**
 * Parse Based code into nodes and edges
 * @param code Based code as a string
 * @returns Object containing nodes and edges
 */
export function parseBasedCode(code: string): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Split code into lines
  const lines = code.split('\n');
  
  // Track current node and indentation
  let currentNodeId = 'start';
  let nodeCounter = 1;
  
  // Create start node
  nodes.push({
    id: currentNodeId,
    type: NodeType.BASED,
    name: 'Start',
    inputs: [],
    outputs: [{ id: `out_${currentNodeId}`, name: 'next' }],
    data: { code: '' }
  });
  
  // Simple parsing logic to identify key structures
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Collect code for the start node until we hit a loop or other control structure
    if (currentNodeId === 'start' && !line.startsWith('loop:') && !line.startsWith('if ')) {
      const currentNode = nodes.find(n => n.id === 'start');
      if (currentNode) {
        currentNode.data.code += line + '\n';
      }
      continue;
    }
    
    // Identify loop-until blocks
    if (line.startsWith('loop:')) {
      const loopNodeId = `loop_${nodeCounter++}`;
      
      // Find the talk function within the loop
      let talkLine = '';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('until')) {
        if (lines[j].trim().includes('talk(')) {
          talkLine = lines[j].trim();
          break;
        }
        j++;
      }
      
      // Extract prompt from talk function
      const promptMatch = talkLine.match(/talk\s*\(\s*["'](.+?)["']/);
      const prompt = promptMatch ? promptMatch[1] : 'Talk to user';
      
      // Find the until conditions
      const untilConditions: string[] = [];
      j = i + 1;
      while (j < lines.length) {
        if (lines[j].trim().startsWith('until')) {
          const untilMatch = lines[j].trim().match(/until\s+["'](.+?)["']/);
          if (untilMatch) {
            untilConditions.push(untilMatch[1]);
          }
          j++;
          // Skip the indented block after the until
          while (j < lines.length && (lines[j].trim() === '' || lines[j].startsWith('  '))) {
            j++;
          }
        } else {
          j++;
        }
      }
      
      // Create loop-until node
      const loopNode: Node = {
        id: loopNodeId,
        type: NodeType.LOOP_UNTIL,
        name: `Loop ${nodeCounter - 1}`,
        inputs: [{ id: `in_${loopNodeId}`, name: 'input' }],
        outputs: untilConditions.map((cond, idx) => ({ 
          id: `out_${loopNodeId}_${idx}`, 
          name: cond 
        })),
        data: {
          prompt,
          until: untilConditions
        }
      };
      
      nodes.push(loopNode);
      
      // Create edge from current node to loop node
      edges.push({
        id: `edge_${currentNodeId}_to_${loopNodeId}`,
        source: {
          nodeId: currentNodeId,
          portId: `out_${currentNodeId}`
        },
        target: {
          nodeId: loopNodeId,
          portId: `in_${loopNodeId}`
        }
      });
      
      // For each until condition, create a based node for the code block
      untilConditions.forEach((condition, idx) => {
        const untilNodeId = `until_${loopNodeId}_${idx}`;
        const untilNode: Node = {
          id: untilNodeId,
          type: NodeType.BASED,
          name: `${condition} handler`,
          inputs: [{ id: `in_${untilNodeId}`, name: 'input' }],
          outputs: [{ id: `out_${untilNodeId}`, name: 'next' }],
          data: { code: '' }
        };
        
        nodes.push(untilNode);
        
        // Create edge from loop node to until node
        edges.push({
          id: `edge_${loopNodeId}_to_${untilNodeId}`,
          source: {
            nodeId: loopNodeId,
            portId: `out_${loopNodeId}_${idx}`
          },
          target: {
            nodeId: untilNodeId,
            portId: `in_${untilNodeId}`
          },
          condition: {
            type: 'ai',
            prompt: condition
          }
        });
      });
      
      // Update current node
      currentNodeId = loopNodeId;
    }
    
    // Identify if statements
    if (line.startsWith('if ')) {
      const ifNodeId = `if_${nodeCounter++}`;
      
      // Extract condition
      const conditionMatch = line.match(/if\s+(.+?):/);
      const condition = conditionMatch ? conditionMatch[1] : '';
      
      // Create if node
      const ifNode: Node = {
        id: ifNodeId,
        type: NodeType.IF,
        name: `If ${condition}`,
        inputs: [{ id: `in_${ifNodeId}`, name: 'input' }],
        outputs: [
          { id: `out_${ifNodeId}_true`, name: 'True' },
          { id: `out_${ifNodeId}_false`, name: 'False' }
        ],
        data: {
          condition
        }
      };
      
      nodes.push(ifNode);
      
      // Create edge from current node to if node
      edges.push({
        id: `edge_${currentNodeId}_to_${ifNodeId}`,
        source: {
          nodeId: currentNodeId,
          portId: `out_${currentNodeId}`
        },
        target: {
          nodeId: ifNodeId,
          portId: `in_${ifNodeId}`
        }
      });
      
      // Create true branch node
      const trueNodeId = `true_${ifNodeId}`;
      const trueNode: Node = {
        id: trueNodeId,
        type: NodeType.BASED,
        name: `${condition} true branch`,
        inputs: [{ id: `in_${trueNodeId}`, name: 'input' }],
        outputs: [{ id: `out_${trueNodeId}`, name: 'next' }],
        data: { code: '' }
      };
      
      nodes.push(trueNode);
      
      // Create edge from if node to true node
      edges.push({
        id: `edge_${ifNodeId}_to_${trueNodeId}`,
        source: {
          nodeId: ifNodeId,
          portId: `out_${ifNodeId}_true`
        },
        target: {
          nodeId: trueNodeId,
          portId: `in_${trueNodeId}`
        },
        condition: {
          type: 'logic',
          expression: `${condition} == True`
        }
      });
      
      // Create false branch node
      const falseNodeId = `false_${ifNodeId}`;
      const falseNode: Node = {
        id: falseNodeId,
        type: NodeType.BASED,
        name: `${condition} false branch`,
        inputs: [{ id: `in_${falseNodeId}`, name: 'input' }],
        outputs: [{ id: `out_${falseNodeId}`, name: 'next' }],
        data: { code: '' }
      };
      
      nodes.push(falseNode);
      
      // Create edge from if node to false node
      edges.push({
        id: `edge_${ifNodeId}_to_${falseNodeId}`,
        source: {
          nodeId: ifNodeId,
          portId: `out_${ifNodeId}_false`
        },
        target: {
          nodeId: falseNodeId,
          portId: `in_${falseNodeId}`
        },
        condition: {
          type: 'logic',
          expression: `${condition} == False`
        }
      });
      
      // Update current node
      currentNodeId = ifNodeId;
    }
    
    // Identify end statements
    if (line.includes('end()') || line.includes('end_call()')) {
      const endNodeId = `end_${nodeCounter++}`;
      
      // Create end node
      const endNode: Node = {
        id: endNodeId,
        type: NodeType.END,
        name: 'End',
        inputs: [{ id: `in_${endNodeId}`, name: 'input' }],
        outputs: [],
        data: {}
      };
      
      nodes.push(endNode);
      
      // Create edge from current node to end node
      edges.push({
        id: `edge_${currentNodeId}_to_${endNodeId}`,
        source: {
          nodeId: currentNodeId,
          portId: `out_${currentNodeId}`
        },
        target: {
          nodeId: endNodeId,
          portId: `in_${endNodeId}`
        }
      });
      
      // Update current node
      currentNodeId = endNodeId;
    }
    
    // Identify return statements (jump nodes)
    if (line.includes('return ')) {
      const jumpNodeId = `jump_${nodeCounter++}`;
      
      // Extract target
      const targetMatch = line.match(/return\s+["'](.+?)["']/);
      const target = targetMatch ? targetMatch[1] : '';
      
      // Create jump node
      const jumpNode: Node = {
        id: jumpNodeId,
        type: NodeType.JUMP,
        name: `Jump to ${target}`,
        inputs: [{ id: `in_${jumpNodeId}`, name: 'input' }],
        outputs: [{ id: `out_${jumpNodeId}`, name: 'jump' }],
        data: {
          target
        }
      };
      
      nodes.push(jumpNode);
      
      // Create edge from current node to jump node
      edges.push({
        id: `edge_${currentNodeId}_to_${jumpNodeId}`,
        source: {
          nodeId: currentNodeId,
          portId: `out_${currentNodeId}`
        },
        target: {
          nodeId: jumpNodeId,
          portId: `in_${jumpNodeId}`
        }
      });
      
      // Update current node
      currentNodeId = jumpNodeId;
    }
  }
  
  return { nodes, edges };
}

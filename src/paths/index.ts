import { Node, Edge, Path, NodeType } from '../types';

/**
 * Generate all possible paths through the conversation flow
 * @param nodes Array of nodes
 * @param edges Array of edges
 * @returns Array of paths
 */
export function generatePaths(nodes: Node[], edges: Edge[]): Path[] {
  const paths: Path[] = [];
  const startNode = nodes.find(node => node.id === 'start');
  
  if (!startNode) {
    return paths;
  }
  
  // Build a graph representation
  const graph: Record<string, { node: Node, outgoing: { edge: Edge, targetNodeId: string }[] }> = {};
  
  nodes.forEach(node => {
    graph[node.id] = {
      node,
      outgoing: []
    };
  });
  
  edges.forEach(edge => {
    const sourceNodeId = edge.source.nodeId;
    if (graph[sourceNodeId]) {
      graph[sourceNodeId].outgoing.push({
        edge,
        targetNodeId: edge.target.nodeId
      });
    }
  });
  
  // DFS to find all paths
  function dfs(
    nodeId: string, 
    currentPath: string[] = [], 
    visitedNodes: Set<string> = new Set(),
    maxDepth: number = 10,
    loopDetection: Map<string, number> = new Map()
  ) {
    // Avoid infinite recursion
    if (currentPath.length > maxDepth) {
      return;
    }
    
    // Handle loops - allow visiting loop nodes twice but not more
    if (nodeId.startsWith('loop_')) {
      const loopCount = loopDetection.get(nodeId) || 0;
      if (loopCount >= 2) {
        return;
      }
      loopDetection.set(nodeId, loopCount + 1);
    } 
    // For non-loop nodes, avoid cycles
    else if (visitedNodes.has(nodeId)) {
      return;
    } else {
      visitedNodes.add(nodeId);
    }
    
    currentPath.push(nodeId);
    
    const nodeInfo = graph[nodeId];
    if (!nodeInfo) {
      return;
    }
    
    // If no outgoing edges or this is an end node, we've found a path
    if (!nodeInfo.outgoing.length || nodeInfo.node.type === NodeType.END) {
      paths.push([...currentPath]);
    } else {
      // Continue DFS for each outgoing edge
      nodeInfo.outgoing.forEach(({ targetNodeId }) => {
        dfs(
          targetNodeId, 
          [...currentPath], 
          new Set(visitedNodes),
          maxDepth,
          new Map(loopDetection)
        );
      });
    }
  }
  
  dfs(startNode.id);
  
  // Handle jump nodes by connecting them to their targets
  const pathsWithJumps: Path[] = [];
  
  paths.forEach(path => {
    const lastNodeId = path[path.length - 1];
    const lastNode = nodes.find(node => node.id === lastNodeId);
    
    if (lastNode && lastNode.type === NodeType.JUMP) {
      // Find the target node
      const target = lastNode.data.target;
      
      // Find a node that matches the target (by name or other criteria)
      const targetNode = nodes.find(node => 
        node.type === NodeType.LOOP_UNTIL && 
        node.name.toLowerCase().includes(target.toLowerCase())
      );
      
      if (targetNode) {
        // Create a new path that jumps to the target
        const newPath = [...path, targetNode.id];
        pathsWithJumps.push(newPath);
      } else {
        pathsWithJumps.push(path);
      }
    } else {
      pathsWithJumps.push(path);
    }
  });
  
  return pathsWithJumps;
}

import { Graph } from '../core/Graph';
import { ExecutionContext } from '../core/ExecutionContext';
import { Node, GraphConfig } from '../types';

export class GraphExecutor {
  private nodeRegistry: Map<string, new (config: any) => Node>;

  constructor(nodeRegistry: Map<string, new (config: any) => Node>) {
    this.nodeRegistry = nodeRegistry;
  }

  registerNode(type: string, NodeClass: new (config: any) => Node): void {
    this.nodeRegistry.set(type, NodeClass);
  }

  async executeGraph(
    graphConfig: GraphConfig,
    sessionId: string,
    userId?: string,
    initialState?: Record<string, any>,
    streamCallback?: (chunk: import('../types').StreamingChunk) => void
  ): Promise<Record<string, any>> {
    const context = new ExecutionContext(sessionId, userId, initialState);
    const graph = new Graph(graphConfig, this.nodeRegistry);
    
    // Inject stream callback if supported
    for (const node of graph.nodes.values()) {
      if (streamCallback && typeof (node as any).setStreamCallback === 'function') {
        (node as any).setStreamCallback(streamCallback);
      }
    }

    const results = await graph.execute(context);

    // Return final outputs
    const outputs: Record<string, any> = {};
    for (const [nodeId, result] of Object.entries(results)) {
      if (result.success && result.output !== undefined) {
        outputs[nodeId] = result.output;
      }
    }

    return outputs;
  }

  validateGraph(graphConfig: GraphConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check all node types are registered
    for (const node of graphConfig.nodes) {
      if (!this.nodeRegistry.has(node.type)) {
        errors.push(`Unknown node type: ${node.type}`);
      }
    }

    // Check all edge references exist
    const nodeIds = new Set(graphConfig.nodes.map(n => n.id));
    for (const edge of graphConfig.edges) {
      if (!nodeIds.has(edge.from)) {
        errors.push(`Edge references non-existent node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to)) {
        errors.push(`Edge references non-existent node: ${edge.to}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

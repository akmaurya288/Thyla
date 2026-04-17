import { Node, NodeConfig, EdgeConfig, GraphConfig, ExecutionContext, NodeResult } from '../types';

export class Graph {
  nodes: Map<string, Node>;
  edges: Map<string, EdgeConfig[]>;
  adjacencyList: Map<string, string[]>;

  constructor(config: GraphConfig, nodeRegistry: Map<string, new (config: any) => Node>) {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();

    this.buildGraph(config, nodeRegistry);
  }

  private buildGraph(config: GraphConfig, nodeRegistry: Map<string, new (config: any) => Node>): void {
    // Build nodes
    for (const nodeConfig of config.nodes) {
      const NodeClass = nodeRegistry.get(nodeConfig.type);
      if (!NodeClass) {
        throw new Error(`Unknown node type: ${nodeConfig.type}`);
      }
      const node = new NodeClass(nodeConfig);
      this.nodes.set(nodeConfig.id, node);
      this.edges.set(nodeConfig.id, []);
      this.adjacencyList.set(nodeConfig.id, []);
    }

    // Build edges
    for (const edge of config.edges) {
      const edges = this.edges.get(edge.from);
      if (edges) {
        edges.push(edge);
      }

      const adj = this.adjacencyList.get(edge.from);
      if (adj) {
        adj.push(edge.to);
      }
    }
  }

  getTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const tempVisited = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string): void => {
      if (tempVisited.has(nodeId)) {
        throw new Error(`Cycle detected in graph involving node: ${nodeId}`);
      }
      if (visited.has(nodeId)) {
        return;
      }

      tempVisited.add(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        visit(neighbor);
      }

      tempVisited.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      visit(nodeId);
    }

    return order.reverse();
  }

  async execute(context: ExecutionContext): Promise<Record<string, NodeResult>> {
    const order = this.getTopologicalOrder();
    const results: Record<string, NodeResult> = {};

    for (const nodeId of order) {
      const node = this.nodes.get(nodeId);
      if (!node) {
        continue;
      }

      // Pass outputs from predecessor nodes
      const incomingEdges = this.edges.get(nodeId) || [];
      for (const edge of incomingEdges) {
        const predecessorResult = results[edge.from];
        if (predecessorResult && predecessorResult.output) {
          const inputKey = edge.inputKey || edge.from;
          context.set(inputKey, predecessorResult.output);
        }
      }

      const result = await node.execute(context);
      results[nodeId] = result;

      if (!result.success) {
        throw new Error(`Node ${nodeId} failed: ${result.error}`);
      }
    }

    return results;
  }
}

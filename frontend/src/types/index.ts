export interface NodeConfig {
  inputKey?: string;
  outputKey?: string;
  value?: string;
  model?: string;
  temperature?: number;
  [key: string]: any;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeConfig;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ThylaGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BackendGraphConfig {
  nodes: Array<{
    id: string;
    type: string;
    config: NodeConfig;
  }>;
  edges: Array<{
    from: string;
    to: string;
    outputKey?: string;
    inputKey?: string;
  }>;
}

export interface ExecutionResponse {
  success: boolean;
  results: Record<string, any>;
  sessionId: string;
  error?: string;
}

export interface StreamMessage {
  type: 'start' | 'chunk' | 'complete' | 'error';
  content?: string;
  done?: boolean;
  results?: Record<string, any>;
  sessionId?: string;
  error?: string;
}

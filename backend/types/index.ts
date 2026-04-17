export interface NodeConfig {
  id: string;
  type: string;
  config: Record<string, any>;
}

export interface EdgeConfig {
  from: string;
  to: string;
  outputKey?: string;
  inputKey?: string;
}

export interface GraphConfig {
  nodes: NodeConfig[];
  edges: EdgeConfig[];
}

export interface ExecutionContext {
  sessionId: string;
  userId?: string;
  state: Map<string, any>;
  metadata: Record<string, any>;
  get(key: string): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

export interface NodeResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Node {
  id: string;
  type: string;
  config: Record<string, any>;
  execute(context: ExecutionContext): Promise<NodeResult>;
}

export interface StreamingChunk {
  content: string;
  done: boolean;
  metadata?: Record<string, any>;
}

export interface ChannelAdapter {
  type: string;
  sendMessage(message: any): Promise<void>;
  onMessage(callback: (message: any) => void): void;
  close(): void;
}

export interface SessionState {
  sessionId: string;
  userId?: string;
  conversationHistory: Message[];
  state: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

import { Node, NodeConfig, ExecutionContext, NodeResult } from '../types';

export abstract class BaseNode implements Node {
  id: string;
  type: string;
  config: Record<string, any>;

  constructor(config: NodeConfig) {
    this.id = config.id;
    this.type = config.type;
    this.config = config.config || {};
  }

  abstract execute(context: ExecutionContext): Promise<NodeResult>;

  protected getInput(context: ExecutionContext, key: string, defaultValue?: any): any {
    if (context.has(key)) {
      return context.get(key);
    }
    if (this.config[key] !== undefined) {
      return this.config[key];
    }
    return defaultValue;
  }

  protected setOutput(context: ExecutionContext, key: string, value: any): void {
    context.set(key, value);
  }
}

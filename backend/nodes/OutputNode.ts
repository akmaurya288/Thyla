import { BaseNode } from '../core/BaseNode';
import { ExecutionContext, NodeResult } from '../types';

export class OutputNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeResult> {
    const inputKey = this.config.inputKey || 'input';
    const value = this.getInput(context, inputKey);

    if (value === undefined) {
      return {
        success: false,
        error: 'OutputNode: No value provided'
      };
    }

    // In a real implementation, this might send to a channel, log, etc.
    // For now, we just return the value
    console.log(`[OutputNode] Output: ${value}`);

    return {
      success: true,
      output: value,
      metadata: { nodeType: 'output' }
    };
  }
}

import { BaseNode } from '../core/BaseNode';
import { ExecutionContext, NodeResult } from '../types';

export class InputNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeResult> {
    const outputKey = this.config.outputKey || 'input';
    // If config has predefined value, use it. Otherwise, look for "input" passed externally
    const value = this.config.value || this.getInput(context, 'input');

    if (value === undefined) {
      return {
        success: false,
        error: 'InputNode: No value provided'
      };
    }

    this.setOutput(context, outputKey, value);

    return {
      success: true,
      output: value,
      metadata: { nodeType: 'input' }
    };
  }
}

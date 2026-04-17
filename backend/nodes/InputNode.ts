import { BaseNode } from '../core/BaseNode';
import { ExecutionContext, NodeResult } from '../types';

export class InputNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeResult> {
    const inputKey = this.config.inputKey || 'input';
    const value = this.config.value || this.getInput(context, 'value');

    if (value === undefined) {
      return {
        success: false,
        error: 'InputNode: No value provided'
      };
    }

    this.setOutput(context, inputKey, value);

    return {
      success: true,
      output: value,
      metadata: { nodeType: 'input' }
    };
  }
}

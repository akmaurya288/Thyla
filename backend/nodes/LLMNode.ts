import { BaseNode } from '../core/BaseNode';
import { ExecutionContext, NodeResult, StreamingChunk } from '../types';

export class LLMNode extends BaseNode {
  private streamCallback?: (chunk: StreamingChunk) => void;

  async execute(context: ExecutionContext): Promise<NodeResult> {
    const inputKey = this.config.inputKey || 'input';
    const outputKey = this.config.outputKey || 'output';
    const prompt = this.getInput(context, inputKey);

    if (!prompt) {
      return {
        success: false,
        error: 'LLMNode: No prompt provided'
      };
    }

    try {
      const response = await this.callLLM(prompt, context);
      this.setOutput(context, outputKey, response);

      return {
        success: true,
        output: response,
        metadata: { nodeType: 'llm', model: this.config.model || 'mock' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  setStreamCallback(callback: (chunk: StreamingChunk) => void): void {
    this.streamCallback = callback;
  }

  private async callLLM(prompt: string, context: ExecutionContext): Promise<string> {
    // Mock implementation - replace with actual LLM API call
    const mockResponse = `Mock LLM response to: "${prompt}"`;
    
    // Simulate streaming
    if (this.streamCallback) {
      const words = mockResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        this.streamCallback({
          content: words[i] + ' ',
          done: i === words.length - 1
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return mockResponse;
  }
}

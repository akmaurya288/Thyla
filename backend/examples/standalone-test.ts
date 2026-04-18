/**
 * Standalone test for Thyla execution engine
 * This runs without Redis or the full server setup
 */

import { GraphExecutor } from '../orchestrator/GraphExecutor';
import { ExecutionContext } from '../core/ExecutionContext';
import { InputNode } from '../nodes/InputNode';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { Node, GraphConfig } from '../types';

async function runStandaloneTest(): Promise<void> {
  console.log('=== Thyla Standalone Test ===\n');

  // Create node registry
  const nodeRegistry = new Map<string, new (config: any) => Node>([
    ['input', InputNode],
    ['llm', LLMNode],
    ['output', OutputNode]
  ]);

  // Create executor
  const executor = new GraphExecutor(nodeRegistry);

  // Define a simple graph programmatically
  const graphConfig: GraphConfig = {
    nodes: [
      {
        id: 'input',
        type: 'input',
        config: {
          outputKey: 'user_message',
          value: 'What is the capital of France?'
        }
      },
      {
        id: 'llm',
        type: 'llm',
        config: {
          inputKey: 'user_message',
          outputKey: 'llm_response',
          model: 'mock'
        }
      },
      {
        id: 'output',
        type: 'output',
        config: {
          inputKey: 'llm_response'
        }
      }
    ],
    edges: [
      {
        from: 'input',
        to: 'llm',
        outputKey: 'user_message',
        inputKey: 'user_message'
      },
      {
        from: 'llm',
        to: 'output',
        outputKey: 'llm_response',
        inputKey: 'input'
      }
    ]
  };

  console.log('Graph configuration:');
  console.log(JSON.stringify(graphConfig, null, 2));
  console.log('\n---\n');

  // Validate graph
  const validation = executor.validateGraph(graphConfig);
  if (!validation.valid) {
    console.error('Graph validation failed:', validation.errors);
    return;
  }
  console.log('Graph validation passed\n');

  // Execute graph
  console.log('Executing graph...\n');
  const sessionId = 'test-session-standalone';
  const userId = 'test-user';

  try {
    const results = await executor.executeGraph(
      graphConfig,
      sessionId,
      userId,
      { initialData: 'test' }
    );

    console.log('Execution results:');
    console.log(JSON.stringify(results, null, 2));
    console.log('\n---\n');
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Execution failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runStandaloneTest()
    .then(() => {
      console.log('\n=== Test Complete ===');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runStandaloneTest };

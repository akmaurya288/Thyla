import { GraphExecutor } from '../orchestrator/GraphExecutor';
import { ExecutionContext } from '../core/ExecutionContext';
import { InputNode } from '../nodes/InputNode';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { Node, GraphConfig } from '../types';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMinimalFlow(): Promise<void> {
  console.log('=== Thyla Minimal Flow Example ===\n');

  // Create node registry
  const nodeRegistry = new Map<string, new (config: any) => Node>([
    ['input', InputNode],
    ['llm', LLMNode],
    ['output', OutputNode]
  ]);

  // Create executor
  const executor = new GraphExecutor(nodeRegistry);

  // Load graph definition
  const graphPath = join(__dirname, 'simple-graph.json');
  const graphConfig: GraphConfig = JSON.parse(readFileSync(graphPath, 'utf-8'));

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
  const sessionId = 'test-session-001';
  const userId = 'user-123';

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
    console.log('Flow completed successfully!');
  } catch (error) {
    console.error('Execution failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runMinimalFlow().catch(console.error);
}

export { runMinimalFlow };

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { GraphExecutor } from '../orchestrator/GraphExecutor';
import { SessionManager } from '../state/SessionManager';
import { RedisClient } from '../state/RedisClient';
import { InputNode } from '../nodes/InputNode';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { Node } from '../types';
import { createRoutes } from './routes';
import { StreamingServer } from './streaming';

export async function createServerApp(port: number = 3000): Promise<void> {
  const app = express();
  const server = createServer(app);

  // Initialize Redis
  const redis = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
  await redis.connect();

  // Initialize session manager
  const sessionManager = new SessionManager(redis);

  // Initialize graph executor with node registry
  const nodeRegistry = new Map<string, new (config: any) => Node>([
    ['input', InputNode],
    ['llm', LLMNode],
    ['output', OutputNode]
  ]);
  const executor = new GraphExecutor(nodeRegistry);

  // Middleware
  app.use(express.json());

  // Routes
  app.use('/api', createRoutes(executor, sessionManager));

  // WebSocket server
  const wss = new WebSocketServer({ server, path: '/stream' });
  new StreamingServer(wss, executor, sessionManager);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  server.listen(port, () => {
    console.log(`Thyla API server running on port ${port}`);
    console.log(`WebSocket endpoint: ws://localhost:${port}/stream`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await redis.disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

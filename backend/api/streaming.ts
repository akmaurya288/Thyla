import { WebSocket, WebSocketServer } from 'ws';
import { GraphExecutor } from '../orchestrator/GraphExecutor';
import { SessionManager } from '../state/SessionManager';
import { StreamingChunk, GraphConfig } from '../types';

export class StreamingServer {
  private wss: WebSocketServer;
  private executor: GraphExecutor;
  private sessionManager: SessionManager | null;

  constructor(
    wss: WebSocketServer,
    executor: GraphExecutor,
    sessionManager: SessionManager | null
  ) {
    this.wss = wss;
    this.executor = executor;
    this.sessionManager = sessionManager;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any): Promise<void> {
    const { type, sessionId, userId, graph, input } = message;

    switch (type) {
      case 'execute':
        await this.handleExecute(ws, sessionId, userId, graph, input);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: `Unknown message type: ${type}`
        }));
    }
  }

  private async handleExecute(
    ws: WebSocket,
    sessionId: string,
    userId: string | undefined,
    graph: GraphConfig,
    input: string
  ): Promise<void> {
    try {
      // Get or create session (if sessionManager available)
      if (this.sessionManager) {
        let session = await this.sessionManager.getSession(sessionId);
        if (!session) {
          session = await this.sessionManager.createSession(sessionId, userId);
        }

        // Add user message to history
        if (input) {
          await this.sessionManager.addMessage(sessionId, {
            role: 'user',
            content: input,
            timestamp: new Date()
          });
        }
      }

      ws.send(JSON.stringify({
        type: 'start',
        sessionId
      }));

      // Execute with streaming
      const streamCallback = (chunk: StreamingChunk) => {
        ws.send(JSON.stringify({
          type: 'chunk',
          content: chunk.content,
          done: chunk.done,
          metadata: chunk.metadata
        }));
      };

      const results = await this.executor.executeGraph(
        graph,
        sessionId,
        userId,
        { input }, // initial state
        streamCallback
      );

      // Add assistant response to history (if sessionManager available)
      const output = results['output'] || results['llm'];
      if (this.sessionManager && output) {
        await this.sessionManager.addMessage(sessionId, {
          role: 'assistant',
          content: output,
          timestamp: new Date()
        });
      }

      ws.send(JSON.stringify({
        type: 'complete',
        results,
        sessionId
      }));
    } catch (error) {
      console.error('Streaming execution error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

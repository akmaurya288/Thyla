import express from 'express';
import { GraphExecutor } from '../orchestrator/GraphExecutor';
import { SessionManager } from '../state/SessionManager';
import { InputNode } from '../nodes/InputNode';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { GraphConfig } from '../types';

export function createRoutes(
  executor: GraphExecutor,
  sessionManager: SessionManager
): express.Router {
  const router = express.Router();

  // POST /execute - Execute a graph
  router.post('/execute', async (req, res) => {
    try {
      const { graph, sessionId, userId, input } = req.body;

      if (!graph || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields: graph, sessionId' });
      }

      // Get or create session
      let session = await sessionManager.getSession(sessionId);
      if (!session) {
        session = await sessionManager.createSession(sessionId, userId);
      }

      // Add user message to history
      if (input) {
        await sessionManager.addMessage(sessionId, {
          role: 'user',
          content: input,
          timestamp: new Date()
        });
      }

      // Execute graph
      const results = await executor.executeGraph(graph, sessionId, userId);

      // Add assistant response to history
      const output = results['output'] || results['llm'];
      if (output) {
        await sessionManager.addMessage(sessionId, {
          role: 'assistant',
          content: output,
          timestamp: new Date()
        });
      }

      res.json({
        success: true,
        results,
        sessionId
      });
    } catch (error) {
      console.error('Execution error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /session/:sessionId - Get session state
  router.get('/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await sessionManager.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /session/:sessionId - Delete session
  router.delete('/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      await sessionManager.deleteSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /session/:sessionId/history - Get conversation history
  router.get('/session/:sessionId/history', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await sessionManager.getConversationHistory(sessionId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

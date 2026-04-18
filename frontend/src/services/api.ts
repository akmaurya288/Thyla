import { BackendGraphConfig, ExecutionResponse, StreamMessage } from '../types';

const API_BASE = '/api';
const WS_BASE = 'ws://localhost:3000/stream';

export const api = {
  async executeAgent(graph: BackendGraphConfig, sessionId: string, input: string): Promise<ExecutionResponse> {
    const response = await fetch(`${API_BASE}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        graph,
        sessionId,
        userId: 'user-1',
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  connectWebSocket(
    onMessage: (message: StreamMessage) => void,
    onError: (error: Event) => void
  ): WebSocket {
    const ws = new WebSocket(WS_BASE);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: StreamMessage = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return ws;
  },

  executeViaWebSocket(
    ws: WebSocket,
    graph: BackendGraphConfig,
    sessionId: string,
    input: string
  ): void {
    ws.send(
      JSON.stringify({
        type: 'execute',
        sessionId,
        userId: 'user-1',
        input,
        graph,
      })
    );
  },
};

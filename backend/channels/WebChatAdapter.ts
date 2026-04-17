import { BaseChannelAdapter } from './ChannelAdapter';
import { WebSocket } from 'ws';

export interface WebChatMessage {
  type: 'user' | 'assistant' | 'system';
  content: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class WebChatAdapter extends BaseChannelAdapter {
  type = 'webchat';
  private ws: WebSocket;
  private sessionId: string;

  constructor(ws: WebSocket, sessionId: string) {
    super();
    this.ws = ws;
    this.sessionId = sessionId;

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('WebChat message parse error:', error);
      }
    });

    this.ws.on('close', () => {
      console.log(`WebChat connection closed for session: ${sessionId}`);
    });

    this.ws.on('error', (error) => {
      console.error(`WebChat error for session ${sessionId}:`, error);
    });
  }

  async sendMessage(message: WebChatMessage): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.ws.close();
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

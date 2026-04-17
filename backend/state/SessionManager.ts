import { RedisClient } from './RedisClient';
import { SessionState, Message } from '../types';

const CONVERSATION_HISTORY_LIMIT = 50;
const SESSION_TTL = 3600; // 1 hour

export class SessionManager {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  async getSession(sessionId: string): Promise<SessionState | null> {
    const data = await this.redis.hGetAll(`session:${sessionId}`);
    
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      sessionId: data.sessionId,
      userId: data.userId || undefined,
      conversationHistory: JSON.parse(data.conversationHistory || '[]'),
      state: JSON.parse(data.state || '{}'),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  async createSession(sessionId: string, userId?: string): Promise<SessionState> {
    const now = new Date();
    const session: SessionState = {
      sessionId,
      userId,
      conversationHistory: [],
      state: {},
      createdAt: now,
      updatedAt: now
    };

    await this.saveSession(session);
    return session;
  }

  async saveSession(session: SessionState): Promise<void> {
    session.updatedAt = new Date();

    await this.redis.hSet(`session:${session.sessionId}`, 'sessionId', session.sessionId);
    await this.redis.hSet(`session:${session.sessionId}`, 'userId', session.userId || '');
    await this.redis.hSet(`session:${session.sessionId}`, 'conversationHistory', JSON.stringify(session.conversationHistory));
    await this.redis.hSet(`session:${session.sessionId}`, 'state', JSON.stringify(session.state));
    await this.redis.hSet(`session:${session.sessionId}`, 'createdAt', session.createdAt.toISOString());
    await this.redis.hSet(`session:${session.sessionId}`, 'updatedAt', session.updatedAt.toISOString());
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.conversationHistory.push(message);

    // Apply sliding window
    if (session.conversationHistory.length > CONVERSATION_HISTORY_LIMIT) {
      session.conversationHistory = session.conversationHistory.slice(-CONVERSATION_HISTORY_LIMIT);
    }

    await this.saveSession(session);
  }

  async getConversationHistory(sessionId: string, limit?: number): Promise<Message[]> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return [];
    }

    if (limit) {
      return session.conversationHistory.slice(-limit);
    }

    return session.conversationHistory;
  }

  async updateState(sessionId: string, key: string, value: any): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.state[key] = value;
    await this.saveSession(session);
  }

  async getState(sessionId: string, key: string): Promise<any> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return session.state[key];
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.delete(`session:${sessionId}`);
  }

  async clearConversationHistory(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.conversationHistory = [];
    await this.saveSession(session);
  }
}

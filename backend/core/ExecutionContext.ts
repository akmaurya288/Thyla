import { ExecutionContext as ExecutionContextInterface } from '../types';

export class ExecutionContext implements ExecutionContextInterface {
  sessionId: string;
  userId?: string;
  state: Map<string, any>;
  metadata: Record<string, any>;

  constructor(sessionId: string, userId?: string, initialState?: Record<string, any>) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.state = new Map(Object.entries(initialState || {}));
    this.metadata = {};
  }

  get(key: string): any {
    return this.state.get(key);
  }

  set(key: string, value: any): void {
    this.state.set(key, value);
  }

  has(key: string): boolean {
    return this.state.has(key);
  }

  delete(key: string): void {
    this.state.delete(key);
  }

  clear(): void {
    this.state.clear();
  }

  toJSON(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      state: Object.fromEntries(this.state),
      metadata: this.metadata
    };
  }

  static fromJSON(json: Record<string, any>): ExecutionContext {
    const ctx = new ExecutionContext(json.sessionId, json.userId, json.state);
    ctx.metadata = json.metadata || {};
    return ctx;
  }
}

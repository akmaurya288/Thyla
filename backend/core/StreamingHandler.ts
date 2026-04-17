import { StreamingChunk } from '../types';

export class StreamingHandler {
  private buffer: string[] = [];
  private batchSize: number;
  private flushInterval: number;
  private callback: (chunk: StreamingChunk) => void;
  private timer?: NodeJS.Timeout;

  constructor(
    callback: (chunk: StreamingChunk) => void,
    batchSize: number = 10,
    flushInterval: number = 100
  ) {
    this.callback = callback;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  start(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.flush();
  }

  add(token: string): void {
    this.buffer.push(token);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const content = this.buffer.join('');
    this.buffer = [];

    this.callback({
      content,
      done: false
    });
  }

  complete(): void {
    this.stop();
    this.callback({
      content: '',
      done: true
    });
  }
}

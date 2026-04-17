import { ChannelAdapter } from '../types';

export abstract class BaseChannelAdapter implements ChannelAdapter {
  abstract type: string;
  protected messageCallback?: (message: any) => void;

  abstract sendMessage(message: any): Promise<void>;

  onMessage(callback: (message: any) => void): void {
    this.messageCallback = callback;
  }

  abstract close(): void;

  protected handleMessage(message: any): void {
    if (this.messageCallback) {
      this.messageCallback(message);
    }
  }
}

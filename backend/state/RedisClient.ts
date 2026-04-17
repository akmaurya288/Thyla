import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor(url: string = 'redis://localhost:6379') {
    this.client = createClient({ url });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async hGet(hash: string, field: string): Promise<string | null> {
    return await this.client.hGet(hash, field);
  }

  async hSet(hash: string, field: string, value: string): Promise<void> {
    await this.client.hSet(hash, field, value);
  }

  async hGetAll(hash: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(hash);
  }

  async hDel(hash: string, field: string): Promise<void> {
    await this.client.hDel(hash, field);
  }

  async lPush(key: string, ...values: string[]): Promise<number> {
    return await this.client.lPush(key, ...values);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lRange(key, start, stop);
  }

  async lTrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.lTrim(key, start, stop);
  }

  async lLen(key: string): Promise<number> {
    return await this.client.lLen(key);
  }
}

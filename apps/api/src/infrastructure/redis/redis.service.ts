import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memory = new Map<string, { value: string; expiresAt?: number }>();

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) return;
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      this.client.connect().catch((err) => {
        this.logger.warn(`Redis unavailable, using memory cache: ${err.message}`);
        this.client = null;
      });
    } catch (err) {
      this.logger.warn(`Redis init failed: ${(err as Error).message}`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        /* fallback */
      }
    }
    const item = this.memory.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
        else await this.client.set(key, value);
        return;
      } catch {
        /* fallback */
      }
    }
    this.memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        /* fallback */
      }
    }
    this.memory.delete(key);
  }
}

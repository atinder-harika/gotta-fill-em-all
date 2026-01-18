// In-memory caching service with TTL support
// For production, swap this with Redis

import { logger } from "./logger";
import { CACHE_CONFIG } from "./constants";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt < now) {
          this.store.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
      }
    }, 60000);
  }

  set<T>(key: string, value: T, ttlSeconds: number = CACHE_CONFIG.TTL_SECONDS): void {
    if (this.store.size >= CACHE_CONFIG.MAX_ENTRIES) {
      // Remove oldest entry if cache is full
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
        logger.warn("Cache full, evicting oldest entry");
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    logger.info("Cache cleared");
  }

  getStats() {
    return {
      size: this.store.size,
      maxSize: CACHE_CONFIG.MAX_ENTRIES,
      entries: Array.from(this.store.keys()),
    };
  }

  async getCached<T>(
    key: string,
    generator: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate if not in cache
    const value = await generator();
    this.set(key, value, ttlSeconds);
    return value;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const cache = new Cache();

import Redis from 'ioredis';
import { logger } from './logger';

// Redis client instance
let redis: Redis | null = null;

/**
 * Get Redis client instance
 * Returns null if Redis is not configured (graceful fallback)
 */
export function getRedisClient(): Redis | null {
  // If already initialized, return existing instance
  if (redis !== null) {
    return redis;
  }

  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  
  if (!redisUrl) {
    logger.warn('Redis not configured - running without server-side cache', {
      component: 'Redis',
      message: 'Set REDIS_URL environment variable to enable Redis caching',
    });
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Connection timeout
      connectTimeout: 10000,
      // Reconnect on error
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect when it's a READONLY error
          return true;
        }
        return false;
      },
    });

    // Handle connection events
    redis.on('connect', () => {
      logger.info('Redis connected successfully', { component: 'Redis' });
    });

    redis.on('error', (err) => {
      logger.error('Redis error', err, { component: 'Redis' });
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed', { component: 'Redis' });
    });

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis', error instanceof Error ? error : new Error(String(error)), {
      component: 'Redis',
    });
    return null;
  }
}

/**
 * Cache helper functions
 */

export interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Cache get error', error instanceof Error ? error : new Error(String(error)), {
      component: 'Redis',
      key,
    });
    return null;
  }
}

/**
 * Set value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const serialized = JSON.stringify(value);
    
    if (options.ttl) {
      await client.setex(key, options.ttl, serialized);
    } else {
      await client.set(key, serialized);
    }

    return true;
  } catch (error) {
    logger.error('Cache set error', error instanceof Error ? error : new Error(String(error)), {
      component: 'Redis',
      key,
    });
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error', error instanceof Error ? error : new Error(String(error)), {
      component: 'Redis',
      key,
    });
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    logger.error('Cache delete pattern error', error instanceof Error ? error : new Error(String(error)), {
      component: 'Redis',
      pattern,
    });
    return 0;
  }
}

/**
 * Cache key generators for consistency
 */
export const CacheKeys = {
  // Media list cache
  mediaList: (sort: string, page: number, limit: number, type?: string) =>
    `media:list:${sort}:${page}:${limit}:${type || 'all'}`,
  
  // Media count cache
  mediaCount: (type?: string) =>
    `media:count:${type || 'all'}`,
  
  // Media by ID
  mediaById: (id: string) =>
    `media:id:${id}`,
  
  // All media keys pattern
  allMediaKeys: () =>
    'media:*',
} as const;

/**
 * Invalidate all media cache
 */
export async function invalidateMediaCache(): Promise<void> {
  const deletedCount = await cacheDelPattern(CacheKeys.allMediaKeys());
  logger.info('Media cache invalidated', {
    component: 'Redis',
    deletedKeys: deletedCount,
  });
}


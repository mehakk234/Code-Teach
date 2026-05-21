const Redis = require('ioredis');

/**
 * RedisClient - Singleton Pattern Implementation
 * Ensures only one Redis connection is created and reused throughout the application
 */
class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    this.client = null;
    this.isConnected = false;
    RedisClient.instance = this;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready to accept commands');
      });

      this.client.on('close', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      // Wait for connection
      await this.client.ping();
      
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  /**
   * Cache data with TTL
   */
  async set(key, value, ttl = 3600) {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      await client.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  }

  /**
   * Get cached data
   */
  async get(key) {
    try {
      const client = this.getClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  }

  /**
   * Delete cached data
   */
  async del(key) {
    try {
      const client = this.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async delPattern(pattern) {
    try {
      const client = this.getClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis DEL pattern error:', error.message);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error.message);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key) {
    try {
      const client = this.getClient();
      return await client.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error.message);
      return null;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key, ttl) {
    try {
      const client = this.getClient();
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE error:', error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      RedisClient.instance = null;
      console.log('Redis connection closed');
    }
  }
}

// Export singleton instance
module.exports = new RedisClient();

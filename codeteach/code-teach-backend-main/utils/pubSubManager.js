const Redis = require('ioredis');

/**
 * PubSub Manager - Redis Pub/Sub Implementation
 * Handles real-time event publishing and subscription
 */
class PubSubManager {
  constructor() {
    if (PubSubManager.instance) {
      return PubSubManager.instance;
    }

    this.publisher = null;
    this.subscriber = null;
    this.eventHandlers = new Map();
    PubSubManager.instance = this;
  }

  /**
   * Initialize publisher and subscriber clients
   */
  async connect() {
    if (this.publisher && this.subscriber) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      // Create separate clients for publishing and subscribing
      this.publisher = new Redis(redisUrl);
      this.subscriber = new Redis(redisUrl);

      this.publisher.on('error', (err) => {
        console.error('PubSub Publisher error:', err.message);
      });

      this.subscriber.on('error', (err) => {
        console.error('PubSub Subscriber error:', err.message);
      });

      // Handle incoming messages
      this.subscriber.on('message', (channel, message) => {
        this.handleMessage(channel, message);
      });

      console.log('✅ PubSub Manager initialized');
    } catch (error) {
      console.error('Failed to initialize PubSub:', error.message);
      throw error;
    }
  }

  /**
   * Publish event to a channel
   */
  async publish(channel, data) {
    try {
      if (!this.publisher) {
        await this.connect();
      }

      const message = JSON.stringify({
        timestamp: new Date().toISOString(),
        data
      });

      await this.publisher.publish(channel, message);
      console.log(`📢 Published to ${channel}:`, data);
      return true;
    } catch (error) {
      console.error('Publish error:', error.message);
      return false;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel, handler) {
    try {
      if (!this.subscriber) {
        await this.connect();
      }

      // Store handler
      if (!this.eventHandlers.has(channel)) {
        this.eventHandlers.set(channel, []);
        await this.subscriber.subscribe(channel);
        console.log(`👂 Subscribed to channel: ${channel}`);
      }

      this.eventHandlers.get(channel).push(handler);
      return true;
    } catch (error) {
      console.error('Subscribe error:', error.message);
      return false;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel) {
    try {
      if (!this.subscriber) {
        return false;
      }

      await this.subscriber.unsubscribe(channel);
      this.eventHandlers.delete(channel);
      console.log(`🔕 Unsubscribed from channel: ${channel}`);
      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error.message);
      return false;
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(channel, message) {
    try {
      const handlers = this.eventHandlers.get(channel);
      if (!handlers || handlers.length === 0) {
        return;
      }

      const parsedMessage = JSON.parse(message);
      
      // Call all registered handlers
      handlers.forEach(handler => {
        try {
          handler(parsedMessage.data, parsedMessage.timestamp);
        } catch (error) {
          console.error(`Handler error for channel ${channel}:`, error.message);
        }
      });
    } catch (error) {
      console.error('Message handling error:', error.message);
    }
  }

  /**
   * Publish course enrollment event
   */
  async publishEnrollment(userId, courseId, courseName) {
    return this.publish('course:enrollment', {
      userId,
      courseId,
      courseName,
      event: 'enrolled'
    });
  }

  /**
   * Publish progress update event
   */
  async publishProgressUpdate(userId, courseId, progress) {
    return this.publish('course:progress', {
      userId,
      courseId,
      progress,
      event: 'progress_updated'
    });
  }

  /**
   * Publish module completion event
   */
  async publishModuleCompletion(userId, courseId, moduleId, subModuleId) {
    return this.publish('course:module_complete', {
      userId,
      courseId,
      moduleId,
      subModuleId,
      event: 'module_completed'
    });
  }

  /**
   * Publish user notification
   */
  async publishNotification(userId, notification) {
    return this.publish(`user:${userId}:notifications`, notification);
  }

  /**
   * Close all connections
   */
  async disconnect() {
    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = null;
    }
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
    this.eventHandlers.clear();
    PubSubManager.instance = null;
    console.log('PubSub connections closed');
  }
}

// Export singleton instance
module.exports = new PubSubManager();

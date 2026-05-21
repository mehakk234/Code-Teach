const Queue = require('bull');
const { sendVerificationEmail } = require('./emailService');

/**
 * Email Queue - Bull Queue Implementation
 * Handles asynchronous email processing with retry logic
 */
class EmailQueue {
  constructor() {
    if (EmailQueue.instance) {
      return EmailQueue.instance;
    }

    this.queue = null;
    EmailQueue.instance = this;
  }

  /**
   * Initialize the email queue
   */
  async initialize() {
    if (this.queue) {
      return this.queue;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      // Create queue
      this.queue = new Queue('email-queue', redisUrl, {
        defaultJobOptions: {
          attempts: 3, // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000 // Start with 2 seconds
          },
          removeOnComplete: true,
          removeOnFail: false
        }
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Setup queue processor
      this.setupProcessor();

      console.log('✅ Email Queue initialized');
      return this.queue;
    } catch (error) {
      console.error('Failed to initialize email queue:', error.message);
      throw error;
    }
  }

  /**
   * Setup event handlers for queue monitoring
   */
  setupEventHandlers() {
    this.queue.on('completed', (job, result) => {
      console.log(`✅ Email job ${job.id} completed:`, job.data.type);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ Email job ${job.id} failed:`, err.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`⚠️  Email job ${job.id} stalled`);
    });

    this.queue.on('progress', (job, progress) => {
      console.log(`📊 Email job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Setup queue processor
   */
  setupProcessor() {
    this.queue.process(async (job) => {
      const { type, email, data } = job.data;

      try {
        job.progress(10);

        switch (type) {
          case 'verification':
            await sendVerificationEmail(email, data.otp, 'verify_email');
            break;

          case 'password_reset':
            await sendVerificationEmail(email, data.otp, 'reset_password');
            break;

          case 'welcome':
            await this.sendWelcomeEmail(email, data);
            break;

          case 'enrollment':
            await this.sendEnrollmentEmail(email, data);
            break;

          case 'completion':
            await this.sendCompletionEmail(email, data);
            break;

          default:
            throw new Error(`Unknown email type: ${type}`);
        }

        job.progress(100);
        return { success: true, email, type };
      } catch (error) {
        console.error(`Email processing error (${type}):`, error.message);
        throw error;
      }
    });
  }

  /**
   * Add verification email to queue
   */
  async sendVerificationEmail(email, otp, priority = 'high') {
    await this.ensureInitialized();
    
    const jobOptions = {
      priority: priority === 'high' ? 1 : priority === 'medium' ? 2 : 3,
      delay: 0
    };

    return this.queue.add({
      type: 'verification',
      email,
      data: { otp }
    }, jobOptions);
  }

  /**
   * Add password reset email to queue
   */
  async sendPasswordResetEmail(email, otp) {
    await this.ensureInitialized();
    
    return this.queue.add({
      type: 'password_reset',
      email,
      data: { otp }
    }, { priority: 1 });
  }

  /**
   * Add welcome email to queue
   */
  async sendWelcomeEmail(email, userData) {
    await this.ensureInitialized();
    
    return this.queue.add({
      type: 'welcome',
      email,
      data: userData
    }, { priority: 3 });
  }

  /**
   * Send welcome email (placeholder)
   */
  async sendWelcomeEmail(email, data) {
    console.log(`📧 Sending welcome email to ${email}`);
    // Implement actual email sending logic here
  }

  /**
   * Add enrollment email to queue
   */
  async sendEnrollmentEmail(email, courseData) {
    await this.ensureInitialized();
    
    return this.queue.add({
      type: 'enrollment',
      email,
      data: courseData
    }, { priority: 2 });
  }

  /**
   * Send enrollment email (placeholder)
   */
  async sendEnrollmentEmail(email, data) {
    console.log(`📧 Sending enrollment email to ${email} for course: ${data.courseName}`);
    // Implement actual email sending logic here
  }

  /**
   * Add completion email to queue
   */
  async sendCompletionEmail(email, courseData) {
    await this.ensureInitialized();
    
    return this.queue.add({
      type: 'completion',
      email,
      data: courseData
    }, { priority: 2 });
  }

  /**
   * Send completion email (placeholder)
   */
  async sendCompletionEmail(email, data) {
    console.log(`📧 Sending completion email to ${email} for course: ${data.courseName}`);
    // Implement actual email sending logic here
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    await this.ensureInitialized();
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(start = 0, end = 10) {
    await this.ensureInitialized();
    return this.queue.getFailed(start, end);
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(jobId) {
    await this.ensureInitialized();
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.retry();
      return true;
    }
    return false;
  }

  /**
   * Clear all failed jobs
   */
  async clearFailedJobs() {
    await this.ensureInitialized();
    await this.queue.clean(0, 'failed');
  }

  /**
   * Ensure queue is initialized
   */
  async ensureInitialized() {
    if (!this.queue) {
      await this.initialize();
    }
  }

  /**
   * Close queue connection
   */
  async close() {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
      EmailQueue.instance = null;
      console.log('Email queue closed');
    }
  }
}

// Export singleton instance
module.exports = new EmailQueue();

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const pubSubManager = require('./pubSubManager');

/**
 * WebSocket Manager - Socket.io Implementation
 * Handles real-time bidirectional communication
 */
class WebSocketManager {
  constructor() {
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }

    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    WebSocketManager.instance = this;
  }

  /**
   * Initialize Socket.io server
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupPubSubIntegration();

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userId} (Socket: ${socket.id})`);

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle course room join
      socket.on('join:course', (courseId) => {
        socket.join(`course:${courseId}`);
        console.log(`👥 User ${socket.userId} joined course room: ${courseId}`);
      });

      // Handle course room leave
      socket.on('leave:course', (courseId) => {
        socket.leave(`course:${courseId}`);
        console.log(`👋 User ${socket.userId} left course room: ${courseId}`);
      });

      // Handle progress update
      socket.on('progress:update', (data) => {
        console.log(`📊 Progress update from ${socket.userId}:`, data);
        // Broadcast to course room
        socket.to(`course:${data.courseId}`).emit('progress:updated', {
          userId: socket.userId,
          ...data
        });
      });

      // Handle typing indicators (for future chat feature)
      socket.on('typing:start', (data) => {
        socket.to(`course:${data.courseId}`).emit('user:typing', {
          userId: socket.userId,
          courseId: data.courseId
        });
      });

      socket.on('typing:stop', (data) => {
        socket.to(`course:${data.courseId}`).emit('user:stopped_typing', {
          userId: socket.userId,
          courseId: data.courseId
        });
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to CodeTeach WebSocket server',
        userId: socket.userId
      });
    });
  }

  /**
   * Integrate with PubSub for cross-instance communication
   */
  setupPubSubIntegration() {
    // Subscribe to course enrollment events
    pubSubManager.subscribe('course:enrollment', (data) => {
      this.emitToUser(data.userId, 'enrollment:success', {
        courseId: data.courseId,
        courseName: data.courseName,
        message: `Successfully enrolled in ${data.courseName}`
      });

      // Notify course room
      this.emitToRoom(`course:${data.courseId}`, 'user:enrolled', {
        userId: data.userId,
        courseName: data.courseName
      });
    });

    // Subscribe to progress updates
    pubSubManager.subscribe('course:progress', (data) => {
      this.emitToUser(data.userId, 'progress:updated', {
        courseId: data.courseId,
        progress: data.progress
      });
    });

    // Subscribe to module completion
    pubSubManager.subscribe('course:module_complete', (data) => {
      this.emitToUser(data.userId, 'module:completed', {
        courseId: data.courseId,
        moduleId: data.moduleId,
        subModuleId: data.subModuleId,
        message: 'Module completed! 🎉'
      });

      // Notify course room
      this.emitToRoom(`course:${data.courseId}`, 'user:module_completed', {
        userId: data.userId,
        moduleId: data.moduleId
      });
    });
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId, event, data) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to room
   */
  emitToRoom(room, event, data) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get Socket.io instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('WebSocket server not initialized');
    }
    return this.io;
  }
}

// Export singleton instance
module.exports = new WebSocketManager();

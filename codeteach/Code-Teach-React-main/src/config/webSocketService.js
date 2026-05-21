import { io } from 'socket.io-client';
import config from './config';

/**
 * WebSocket Service - Socket.io Client Implementation
 * Handles real-time bidirectional communication with backend
 */
class WebSocketService {
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }

    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    WebSocketService.instance = this;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return this.socket;
    }

    const serverUrl = config.api.baseUrl || 'http://localhost:5000';

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * Setup core event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.triggerEvent('connection:success', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.triggerEvent('connection:lost', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      this.triggerEvent('connection:error', { error: error.message, attempts: this.reconnectAttempts });
    });

    this.socket.on('connected', (data) => {
      console.log('📢 Server message:', data);
      this.triggerEvent('server:connected', data);
    });

    // Course enrollment events
    this.socket.on('enrollment:success', (data) => {
      console.log('📚 Enrollment success:', data);
      this.triggerEvent('enrollment:success', data);
    });

    this.socket.on('user:enrolled', (data) => {
      console.log('👥 User enrolled:', data);
      this.triggerEvent('user:enrolled', data);
    });

    // Progress events
    this.socket.on('progress:updated', (data) => {
      console.log('📊 Progress updated:', data);
      this.triggerEvent('progress:updated', data);
    });

    this.socket.on('module:completed', (data) => {
      console.log('🎉 Module completed:', data);
      this.triggerEvent('module:completed', data);
    });

    this.socket.on('user:module_completed', (data) => {
      console.log('👏 User completed module:', data);
      this.triggerEvent('user:module_completed', data);
    });

    // Typing indicators
    this.socket.on('user:typing', (data) => {
      this.triggerEvent('user:typing', data);
    });

    this.socket.on('user:stopped_typing', (data) => {
      this.triggerEvent('user:stopped_typing', data);
    });
  }

  /**
   * Join a course room
   */
  joinCourse(courseId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:course', courseId);
      console.log(`👥 Joined course room: ${courseId}`);
    }
  }

  /**
   * Leave a course room
   */
  leaveCourse(courseId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:course', courseId);
      console.log(`👋 Left course room: ${courseId}`);
    }
  }

  /**
   * Send progress update
   */
  sendProgressUpdate(courseId, progress) {
    if (this.socket && this.isConnected) {
      this.socket.emit('progress:update', { courseId, progress });
    }
  }

  /**
   * Send typing indicator
   */
  startTyping(courseId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', { courseId });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(courseId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', { courseId });
    }
  }

  /**
   * Subscribe to custom event
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);

    // If socket is already connected, add listener
    if (this.socket) {
      this.socket.on(eventName, handler);
    }
  }

  /**
   * Unsubscribe from event
   */
  off(eventName, handler) {
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(eventName, handler);
    }
  }

  /**
   * Trigger event handlers
   */
  triggerEvent(eventName, data) {
    if (this.eventHandlers.has(eventName)) {
      this.eventHandlers.get(eventName).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Emit custom event
   */
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Cannot emit event: Socket not connected');
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if connected
   */
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;

import { useEffect, useState, useCallback } from 'react';
import webSocketService from '../config/webSocketService';
import { getAuthToken } from '../config/config';

/**
 * Custom React Hook for WebSocket functionality
 * Provides real-time updates and WebSocket management
 */
export const useWebSocket = (options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const { autoConnect = true, onEnrollment, onProgress, onModuleComplete } = options;

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token available');
        return;
      }

      webSocketService.connect(token);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
  }, []);

  // Join course room
  const joinCourse = useCallback((courseId) => {
    webSocketService.joinCourse(courseId);
  }, []);

  // Leave course room
  const leaveCourse = useCallback((courseId) => {
    webSocketService.leaveCourse(courseId);
  }, []);

  // Send progress update
  const sendProgress = useCallback((courseId, progress) => {
    webSocketService.sendProgressUpdate(courseId, progress);
  }, []);

  useEffect(() => {
    // Setup event handlers
    const handleConnectionSuccess = (data) => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected:', data);
    };

    const handleConnectionLost = (data) => {
      setIsConnected(false);
      console.warn('WebSocket connection lost:', data);
    };

    const handleConnectionError = (data) => {
      setIsConnected(false);
      setError(data.error);
    };

    const handleEnrollment = (data) => {
      setLastMessage({ type: 'enrollment', data });
      if (onEnrollment) {
        onEnrollment(data);
      }
    };

    const handleProgress = (data) => {
      setLastMessage({ type: 'progress', data });
      if (onProgress) {
        onProgress(data);
      }
    };

    const handleModuleComplete = (data) => {
      setLastMessage({ type: 'module_complete', data });
      if (onModuleComplete) {
        onModuleComplete(data);
      }
    };

    // Subscribe to events
    webSocketService.on('connection:success', handleConnectionSuccess);
    webSocketService.on('connection:lost', handleConnectionLost);
    webSocketService.on('connection:error', handleConnectionError);
    webSocketService.on('enrollment:success', handleEnrollment);
    webSocketService.on('progress:updated', handleProgress);
    webSocketService.on('module:completed', handleModuleComplete);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      webSocketService.off('connection:success', handleConnectionSuccess);
      webSocketService.off('connection:lost', handleConnectionLost);
      webSocketService.off('connection:error', handleConnectionError);
      webSocketService.off('enrollment:success', handleEnrollment);
      webSocketService.off('progress:updated', handleProgress);
      webSocketService.off('module:completed', handleModuleComplete);
    };
  }, [autoConnect, connect, onEnrollment, onProgress, onModuleComplete]);

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect,
    joinCourse,
    leaveCourse,
    sendProgress,
    socket: webSocketService.getSocket()
  };
};

/**
 * Hook for course-specific WebSocket functionality
 */
export const useCourseWebSocket = (courseId) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const websocket = useWebSocket({
    autoConnect: true,
    onProgress: (data) => {
      if (data.courseId === courseId) {
        console.log('Course progress updated:', data);
      }
    }
  });

  useEffect(() => {
    if (websocket.isConnected && courseId) {
      // Join course room
      websocket.joinCourse(courseId);

      // Setup course-specific handlers
      const handleUserEnrolled = (data) => {
        if (data.courseId === courseId) {
          console.log('New user enrolled:', data);
        }
      };

      const handleUserTyping = (data) => {
        if (data.courseId === courseId) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (data.courseId === courseId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      };

      webSocketService.on('user:enrolled', handleUserEnrolled);
      webSocketService.on('user:typing', handleUserTyping);
      webSocketService.on('user:stopped_typing', handleUserStoppedTyping);

      // Cleanup
      return () => {
        websocket.leaveCourse(courseId);
        webSocketService.off('user:enrolled', handleUserEnrolled);
        webSocketService.off('user:typing', handleUserTyping);
        webSocketService.off('user:stopped_typing', handleUserStoppedTyping);
      };
    }
  }, [websocket.isConnected, courseId, websocket]);

  return {
    ...websocket,
    onlineUsers,
    typingUsers: Array.from(typingUsers)
  };
};

/**
 * Hook for real-time notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState(new Set());

  const websocket = useWebSocket({
    autoConnect: true,
    onEnrollment: (data) => {
      // Create unique key to prevent duplicates
      const notificationKey = `enrollment-${data.courseId}-${data.userId}`;
      
      // Only add if not recently shown (prevent duplicates within 5 seconds)
      if (!recentNotifications.has(notificationKey)) {
        addNotification({
          type: 'success',
          title: '🎉 New Enrollment',
          message: data.message,
          timestamp: new Date()
        });
        
        // Track this notification to prevent duplicates
        setRecentNotifications(prev => new Set([...prev, notificationKey]));
        
        // Remove from tracking after 5 seconds
        setTimeout(() => {
          setRecentNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationKey);
            return newSet;
          });
        }, 5000);
      }
    },
    onModuleComplete: (data) => {
      // Create unique key to prevent duplicates
      const notificationKey = `module-${data.courseId}-${data.moduleId}-${Date.now()}`;
      
      // Only add if not recently shown
      if (!recentNotifications.has(notificationKey)) {
        addNotification({
          type: 'success',
          title: '✅ Module Completed',
          message: data.message,
          timestamp: new Date()
        });
        
        // Track this notification
        setRecentNotifications(prev => new Set([...prev, notificationKey]));
        
        // Remove from tracking after 3 seconds
        setTimeout(() => {
          setRecentNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationKey);
            return newSet;
          });
        }, 3000);
      }
    }
  });

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Check if similar notification exists in last 3 seconds
      const isDuplicate = prev.some(n => 
        n.title === notification.title && 
        n.message === notification.message &&
        (Date.now() - new Date(n.timestamp).getTime()) < 3000
      );
      
      if (isDuplicate) {
        return prev; // Don't add duplicate
      }
      
      return [
        { id: Date.now() + Math.random(), ...notification },
        ...prev
      ].slice(0, 5); // Keep only last 5 notifications (reduced from 10)
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    isConnected: websocket.isConnected
  };
};

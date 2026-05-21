import React, { useEffect, useState } from 'react';
import { useWebSocket, useNotifications } from '../../hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationToast Component
 * Displays real-time notifications from WebSocket events
 */
const NotificationToast = () => {
  const { notifications, removeNotification, isConnected } = useNotifications();

  useEffect(() => {
    // Auto-remove notifications after 4 seconds (reduced from 5)
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const timer = setTimeout(() => {
        removeNotification(latestNotification.id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  // Show only the latest 3 notifications to prevent clutter
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Connection Status Indicator - Always visible */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`px-3 py-2 rounded-full text-xs font-medium shadow-md ${
          isConnected 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}
      >
        {isConnected ? '� Connected' : '�🔴 Disconnected'}
      </motion.div>

      {/* Notifications */}
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg shadow-lg backdrop-blur-sm ${
              notification.type === 'success'
                ? 'bg-green-500/95 text-white'
                : notification.type === 'error'
                ? 'bg-red-500/95 text-white'
                : 'bg-blue-500/95 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-sm">{notification.title}</h4>
                <p className="text-xs mt-1 opacity-90">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 text-white opacity-70 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Example: Course Progress Component with Real-time Updates
 */
export const CourseProgressWidget = ({ courseId }) => {
  const [progress, setProgress] = useState(0);
  
  const { isConnected, joinCourse, leaveCourse } = useWebSocket({
    autoConnect: true,
    onProgress: (data) => {
      if (data.courseId === courseId) {
        setProgress(data.progress);
        console.log('Progress updated in real-time:', data.progress);
      }
    },
    onModuleComplete: (data) => {
      console.log('Module completed!', data);
    }
  });

  useEffect(() => {
    if (isConnected && courseId) {
      joinCourse(courseId);
      return () => leaveCourse(courseId);
    }
  }, [isConnected, courseId, joinCourse, leaveCourse]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Course Progress</h3>
        <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
          {isConnected ? '● Live' : '○ Offline'}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {progress}% Complete
      </p>
    </div>
  );
};

/**
 * Example: Online Users Counter
 */
export const OnlineUsersCounter = ({ courseId }) => {
  const { isConnected } = useWebSocket({ autoConnect: true });
  const [onlineCount, setOnlineCount] = useState(0);

  // You can implement online user tracking via WebSocket events
  useEffect(() => {
    // Subscribe to user count updates
    // This is a placeholder - implement based on your needs
  }, [courseId]);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      <span>{onlineCount} users online</span>
    </div>
  );
};

export default NotificationToast;
